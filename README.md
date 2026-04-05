<div align="center">


# ✦ OMNI-CORTEX


**The Universal Local Memory Engine for AI.**


[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?logo=googlechrome&logoColor=white)](#)


Omni-Cortex is a privacy-first Chrome extension and headless Go backend that provides a persistent, universal memory layer across all major AI platforms (ChatGPT, Claude, Gemini, Perplexity, etc.). 


Save brilliant prompts, curate context streams, and inject knowledge directly into any AI's brain—all stored 100% locally on your machine.


---


### 🎥 Watch the Demo


[![Omni-Cortex Demo](https://img.youtube.com/vi/Bkk5aCTQbmE/maxresdefault.jpg)](https://youtu.be/Bkk5aCTQbmE)


*(Click the image above to watch Omni-Cortex in action)*


</div>


---


### ✦ Philosophy


AI platforms trap your context in siloed chat threads. Omni-Cortex breaks that barrier by giving you an independent, local intelligence layer. It sits cleanly on top of your browser, allowing you to carry your curated knowledge bases seamlessly from one AI model to the next.


### ✨ Key Features


* **Universal DOM Engine:** Built with advanced, framework-agnostic DOM injection. Works flawlessly bypassing React/Next.js virtual DOMs on ChatGPT, Claude, Gemini, Qwen, and local LLM UIs.
* **Zero-Cloud Architecture:** Your data never touches a third-party server. All memories are stored in a lightning-fast local SQLite database powered by a headless Go backend.
* **Stream Routing:** Organize your workflows into custom "Streams". Keep coding context completely separate from creative writing.
* **Studio UI:** A premium, draggable glassmorphism interface. Minimalist, distraction-free, and closes automatically when you click away.
* **Bulletproof File Uploads:** Use the "Shotgun Upload" algorithm to instantly force memory files past modern AI security blocks.
* **Frictionless Hotkeys:** * Summon the interface anywhere: `Ctrl + Shift + Space`
  * Route context natively: Type `` directly in the chat box.
* **Markdown Export:** One-click compilation of your memory streams into clean `.md` files for Obsidian or Notion.


---


### 🏗️ Architecture


Omni-Cortex utilizes **Chrome Native Messaging** to bridge the gap between your browser and your local operating system.


1. **Frontend:** Vanilla JavaScript Extension (Manifest V3) / Shadow DOM Isolation.
2. **Bridge:** Chrome Native Messaging API.
3. **Backend:** Headless Go Executable.
4. **Storage:** Local SQLite Database (`memory.db`).


---


### 🚀 Installation Guide (Windows)


Because Omni-Cortex writes data directly to your local drive, it requires a brief one-time setup to securely link Chrome to the Go database.


#### 1. Compile the Go Backend
Ensure you have [Go installed](https://go.dev/). Open your terminal in the project folder and compile the backend as a hidden, headless background process:
```bash
go build -ldflags="-H windowsgui" -o omnicortex.exe main.go
