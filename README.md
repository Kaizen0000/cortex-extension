# ✦ Omni-Cortex 


**The Universal Local Memory Engine for AI.**


Omni-Cortex is a powerful, privacy-first Chrome extension and local Go backend that gives you a universal "memory layer" across all major AI platforms (ChatGPT, Claude, Gemini, Perplexity, Poe, etc.). Save brilliant prompts, curate context streams, and inject knowledge directly into any AI's brain—all stored locally on your machine.


---


### 🎥 See it in Action


> **[📹 Watch the Demo Video Here](link-to-your-video-or-youtube)**
> *(Tip: If you have a `.gif` of the UI, you can replace this line with `![Demo](link_to_gif.gif)` to embed it directly!)*


---


### ✨ Key Features


* **Universal AI Support:** Built with a highly advanced DOM-injection engine that bypasses React/Next.js virtual DOMs. Works flawlessly on ChatGPT, Claude, Gemini, Perplexity, Qwen, and local LLM UIs.
* **100% Local & Private:** Your data never touches a third-party cloud. Memories are stored in a lightning-fast local SQLite database powered by a headless Go backend.
* **Context Streams:** Organize your workflows into custom "Streams". Switch streams on the fly to keep coding context separate from creative writing.
* **Bulletproof Injection & Uploads:** Instantly inject thousands of words of context natively, or use the "Shotgun Upload" algorithm to force file attachments past modern AI security blocks.
* **Studio UI:** A premium, draggable glassmorphism interface. Minimalist, distraction-free, and closes automatically when you click away.
* **Frictionless Hotkeys:** * Summon the brain from anywhere: `Ctrl + Shift + Space` (or `Cmd + Shift + Space`)
    * Route text directly from the chat box: Type ``
* **Markdown Export:** One-click export of any memory stream into clean `.md` files—perfect for dropping into Obsidian or Notion.


---


### 🏗️ Architecture


Omni-Cortex uses **Chrome Native Messaging** to bridge the gap between your web browser and your local computer.
1. **Frontend:** Vanilla JavaScript Chrome Extension (Manifest V3) using Shadow DOM isolation.
2. **Bridge:** Chrome Native Messaging API.
3. **Backend:** A lightweight, headless Go (`.exe`) executable.
4. **Storage:** Local SQLite database (`memory.db`).


---


### 🚀 Installation Guide (Windows)


Because Omni-Cortex interacts directly with your local file system, it requires a brief one-time setup to securely connect the Chrome Extension to the Go database.


#### 1. Compile the Go Backend
Ensure you have [Go installed](https://go.dev/). Open your terminal in the project folder and compile the backend as a hidden background process:
\`\`\`bash
go build -ldflags="-H windowsgui" -o omnicortex.exe main.go
\`\`\`


#### 2. Load the Extension into Chrome
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right corner).
3. Click **Load unpacked** and select your Omni-Cortex project folder.
4. **Important:** Copy the generated **Extension ID** (a long string of lowercase letters).


#### 3. Configure the Native Messaging Host
Chrome needs to know where your `.exe` lives. Create a file named `com.omnicortex.local.json` in your project folder:
\`\`\`json
{
  "name": "com.omnicortex.local",
  "description": "Omni-Cortex Local Database",
  "path": "C:\\Absolute\\Path\\To\\Your\\omnicortex.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID_HERE/"
  ]
}
\`\`\`
*(Make sure to use double backslashes `\\` for the Windows path and paste your Extension ID).*


#### 4. Register the Host with Windows
Create a text file named `register.reg`, paste the following code, update the path, and double-click it to run:
\`\`\`text
Windows Registry Editor Version 5.00


[HKEY_CURRENT_USER\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.omnicortex.local]
@="C:\\Absolute\\Path\\To\\Your\\com.omnicortex.local.json"
\`\`\`


Restart Chrome entirely, and Omni-Cortex is ready to use!


---


### 🧠 How to Use


1. **Save Context:** Hover over any AI response. A minimalist `✦ Save to Stream` button will appear. Click it, name the context (optional), and it's secured locally.
2. **Inject Context:** Open the Omni-Cortex panel (`Ctrl+Shift+Space`), select the memories you want, and click **Inject**. The text will type itself into the AI's chat box.
3. **Attach Files:** Click **Attach File** to automatically compile your entire memory stream into a `.txt` file and brute-force it into the AI's upload zone.


---


### 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
* **Extension:** Chrome Manifest V3 API
* **Backend:** Go (Golang)
* **Database:** SQLite (`modernc.org/sqlite` pure-go driver)


---


### 📜 License


Distributed under the MIT License. See `LICENSE` for more information.
