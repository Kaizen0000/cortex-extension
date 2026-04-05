package main

import (
	"bytes"
	"database/sql"
	"encoding/binary"
	"encoding/json"
	"io"
	"log"
	"os"
	"path/filepath" // Forces absolute pathing

	_ "modernc.org/sqlite"
)

// --- 1. UPDATED STRUCT ---
type IncomingMessage struct {
	Command string `json:"command"`
	Folder  string `json:"folder"`
	Chat    string `json:"chat"`
	Text    string `json:"text"`
	ID      int    `json:"id"` // NEW: Allows deleting specific memories by their ID
}

type MemoryItem struct {
	ID   int    `json:"id"`
	Text string `json:"text"`
}

type OutgoingMessage struct {
	Status    string       `json:"status"`
	Message   string       `json:"message,omitempty"`
	Folders   []string     `json:"folders,omitempty"`
	Chats     []string     `json:"chats,omitempty"`
	Data      string       `json:"data,omitempty"`
	DataArray []MemoryItem `json:"dataArray,omitempty"`
}

var logger *log.Logger
var db *sql.DB

func init() {
	// FIND EXACT LOCATION OF THE EXE
	exePath, err := os.Executable()
	if err != nil {
		os.Exit(1)
	}
	exeDir := filepath.Dir(exePath)

	// FORCE LOGS AND DB TO THAT EXACT FOLDER
	logPath := filepath.Join(exeDir, "cortex_debug.log")
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
	if err != nil {
		os.Exit(1)
	}
	logger = log.New(file, "CORTEX: ", log.Ldate|log.Ltime|log.Lshortfile)

	dbPath := filepath.Join(exeDir, "memory.db")
	logger.Printf("Omni-Cortex Booting. Database locked to absolute path: %s\n", dbPath)

	db, err = sql.Open("sqlite", dbPath)
	if err != nil {
		logger.Fatalf("Failed to open db: %v", err)
	}

	// CREATE NEW SCHEMA
	db.Exec(`CREATE TABLE IF NOT EXISTS cortex_vault (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		folder_name TEXT NOT NULL,
		chat_name TEXT NOT NULL,
		content TEXT NOT NULL
	);`)

	// THE RESCUE OPERATION (Now with logging)
	var count int
	err = db.QueryRow(`SELECT count(*) FROM sqlite_master WHERE type='table' AND name='conversations'`).Scan(&count)
	
	if err == nil && count > 0 {
		var rowCount int
		db.QueryRow(`SELECT count(*) FROM conversations`).Scan(&rowCount)
		logger.Printf("FOUND OLD TABLE! Migrating %d old memories to the Legacy folder...\n", rowCount)
		
		_, execErr := db.Exec(`INSERT INTO cortex_vault (folder_name, chat_name, content) 
				 SELECT 'Legacy', session_name, content FROM conversations`)
		
		if execErr != nil {
			logger.Printf("Migration failed: %v\n", execErr)
		} else {
			db.Exec(`ALTER TABLE conversations RENAME TO conversations_archived`)
			logger.Println("Migration successful. Old table archived.")
		}
	} else {
		logger.Println("No old 'conversations' table found to migrate.")
	}

	logger.Println("Omni-Cortex Vault Online and listening.")
}

func getFolders() OutgoingMessage {
	rows, err := db.Query(`SELECT DISTINCT folder_name FROM cortex_vault`)
	if err != nil {
		return OutgoingMessage{Status: "error", Message: "DB Error"}
	}
	defer rows.Close()

	var folders []string
	for rows.Next() {
		var f string
		rows.Scan(&f)
		folders = append(folders, f)
	}
	if len(folders) == 0 {
		folders = append(folders, "General")
	}
	return OutgoingMessage{Status: "success", Folders: folders}
}

func getChats(folder string) OutgoingMessage {
	rows, err := db.Query(`SELECT DISTINCT chat_name FROM cortex_vault WHERE folder_name = ?`, folder)
	if err != nil {
		return OutgoingMessage{Status: "error"}
	}
	defer rows.Close()

	var chats []string
	for rows.Next() {
		var c string
		rows.Scan(&c)
		chats = append(chats, c)
	}
	if len(chats) == 0 {
		chats = append(chats, "Main")
	}
	return OutgoingMessage{Status: "success", Chats: chats}
}

func saveMemory(folder string, chat string, content string) OutgoingMessage {
	if folder == "" { folder = "General" }
	if chat == "" { chat = "Main" }

	_, err := db.Exec(`INSERT INTO cortex_vault (folder_name, chat_name, content) VALUES (?, ?, ?)`, folder, chat, content)
	if err != nil {
		return OutgoingMessage{Status: "error", Message: "Save failed."}
	}
	return OutgoingMessage{Status: "success", Message: "Memory secured."}
}

func fetchSessionAll(folder string, chat string) OutgoingMessage {
	rows, err := db.Query(`SELECT id, content FROM cortex_vault WHERE folder_name = ? AND chat_name = ? ORDER BY id ASC`, folder, chat)
	if err != nil {
		return OutgoingMessage{Status: "error"}
	}
	defer rows.Close()

	var fullContext string
	var memArray []MemoryItem

	for rows.Next() {
		var id int
		var content string
		rows.Scan(&id, &content)
		fullContext += content + "\n\n---\n\n"
		memArray = append(memArray, MemoryItem{ID: id, Text: content})
	}

	return OutgoingMessage{
		Status: "success",
		Data: fullContext,
		DataArray: memArray,
	}
}

// --- 2. NEW DELETION FUNCTIONS ---
func deleteMemory(id int) OutgoingMessage {
	_, err := db.Exec(`DELETE FROM cortex_vault WHERE id = ?`, id)
	if err != nil {
		return OutgoingMessage{Status: "error", Message: "Failed to delete memory"}
	}
	return OutgoingMessage{Status: "success", Message: "Memory deleted"}
}

func deleteStream(folder string, chat string) OutgoingMessage {
	_, err := db.Exec(`DELETE FROM cortex_vault WHERE folder_name = ? AND chat_name = ?`, folder, chat)
	if err != nil {
		return OutgoingMessage{Status: "error", Message: "Failed to delete stream"}
	}
	return OutgoingMessage{Status: "success", Message: "Stream deleted"}
}

// --- I/O ENGINE ---

func readMessage() (IncomingMessage, error) {
	var length uint32
	err := binary.Read(os.Stdin, binary.NativeEndian, &length)
	if err != nil {
		return IncomingMessage{}, err
	}
	msgBytes := make([]byte, length)
	io.ReadFull(os.Stdin, msgBytes)
	var msg IncomingMessage
	json.Unmarshal(msgBytes, &msg)
	return msg, nil
}

func writeMessage(msg OutgoingMessage) {
	msgBytes, _ := json.Marshal(msg)
	length := uint32(len(msgBytes))
	var buf bytes.Buffer
	binary.Write(&buf, binary.NativeEndian, length)
	buf.Write(msgBytes)
	os.Stdout.Write(buf.Bytes())
}

func main() {
	for {
		msg, err := readMessage()
		if err != nil {
			if err == io.EOF { break }
			continue
		}

		var response OutgoingMessage
		
		// --- 3. ADDED NEW COMMANDS TO SWITCH STATEMENT ---
		switch msg.Command {
		case "get_folders": response = getFolders()
		case "get_chats": response = getChats(msg.Folder)
		case "remember_cortex": response = saveMemory(msg.Folder, msg.Chat, msg.Text)
		case "fetch_session_all": response = fetchSessionAll(msg.Folder, msg.Chat)
		case "delete_memory": response = deleteMemory(msg.ID)
		case "delete_stream": response = deleteStream(msg.Folder, msg.Chat)
		default: response = OutgoingMessage{Status: "error", Message: "Unknown command."}
		}
		writeMessage(response)
	}
}