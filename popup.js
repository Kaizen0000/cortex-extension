function loadSessions() {
    chrome.runtime.sendMessage({ action: "get_sessions" }, (response) => {
        const list = document.getElementById("sessionList");
        
        if (response && response.status === "success") {
            try {
                const sessions = JSON.parse(response.data);
                if (!sessions || sessions.length === 0) {
                    list.innerHTML = "<div style='color:#666; font-style:italic; padding: 10px 0;'>Memory banks are empty.</div>";
                    return;
                }
                
                list.innerHTML = "";
                sessions.forEach(session => {
                    let div = document.createElement("div");
                    div.className = "session-item";
                    
                    let nameSpan = document.createElement("span");
                    nameSpan.className = "session-name";
                    nameSpan.innerText = `📁 ${session}`;
                    
                    let delBtn = document.createElement("button");
                    delBtn.className = "delete-btn";
                    delBtn.innerText = "🗑️";
                    delBtn.title = "Delete this session";
                    delBtn.onclick = () => {
                        if(confirm(`Wipe all memories for session "${session}"?`)) {
                            chrome.runtime.sendMessage({ action: "delete_session", query: session }, () => {
                                loadSessions(); // Reload list after deletion
                            });
                        }
                    };

                    div.appendChild(nameSpan);
                    div.appendChild(delBtn);
                    list.appendChild(div);
                });
            } catch (e) {
                list.innerHTML = "<div style='color:#ff4444;'>Failed to parse memory banks.</div>";
            }
        } else {
            list.innerHTML = "<div style='color:#ff4444;'>Backend Offline. Ensure Cortex .exe is running.</div>";
        }
    });
}

// Load sessions when the popup opens
document.addEventListener('DOMContentLoaded', loadSessions);