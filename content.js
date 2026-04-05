console.log("Omni-Cortex: Studio Edition v1.0 Online");

const DEFAULT_FOLDER = "General";
let currentMemory = "Main";
let isPanelOpen = false;

function safeSendMessage(payload, callback) {
    try {
        chrome.runtime.sendMessage(payload, (response) => {
            if (chrome.runtime.lastError) return; 
            if (callback) callback(response);
        });
    } catch (error) {
        if (callback) callback({ status: "error" });
    }
}

function updateAllSaveButtons() {
    document.querySelectorAll('.cortex-btn-label').forEach(label => {
        label.innerText = currentMemory;
    });
}

// --- 1. SHADOW DOM & PREMIUM CSS SETUP ---
const cortexHost = document.createElement('div');
const shadow = cortexHost.attachShadow({ mode: 'open' });
document.body.appendChild(cortexHost);

const sidebarHTML = `
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :host { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; -webkit-font-smoothing: antialiased; }

        #cortex-toggle {
            position: fixed; top: 24px; right: 24px; width: 42px; height: 42px;
            background: rgba(10, 10, 12, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            color: #fff; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 50%;
            font-size: 18px; cursor: grab; z-index: 999999; box-shadow: 0 4px 24px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, background 0.3s ease; display: flex; align-items: center; justify-content: center; user-select: none;
        }
        #cortex-toggle:hover { background: rgba(20, 20, 24, 0.8); transform: scale(1.05); }

        #cortex-panel {
            position: fixed; width: 360px; max-height: 85vh;
            background: rgba(12, 12, 14, 0.85); backdrop-filter: blur(35px) saturate(150%);
            color: #ededed; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; 
            box-shadow: 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
            display: none; flex-direction: column; z-index: 999998; overflow: hidden;
            opacity: 0; transform: translateY(-8px) scale(0.98);
            transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .header { padding: 24px 24px 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); cursor: grab; user-select: none; }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .title { font-size: 13px; font-weight: 800; color: #fff; letter-spacing: 2px; text-transform: uppercase; display: flex; align-items: center; gap: 10px; }
        .title-dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px rgba(255,255,255,0.5); }

        .controls { display: flex; gap: 8px; align-items: center; width: 100%; }
        select { 
            flex: 1; background: rgba(0, 0, 0, 0.3); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); 
            padding: 10px 12px; border-radius: 8px; font-size: 13px; outline: none; cursor: pointer; appearance: none;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 230px; font-weight: 500;
        }
        select:hover { border-color: rgba(255, 255, 255, 0.3); }
        select option { background: #111; color: #fff; }
        
        .btn-icon { background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 0 14px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 16px; }
        .btn-icon:hover { background: #fff; color: #000; border-color: #fff; }
        .btn-trash:hover { background: #ff4444; color: #fff; border-color: #ff4444; }

        .hint-text { font-size: 11px; color: #666; margin-top: 16px; text-align: center; font-weight: 500; letter-spacing: 0.3px; }

        .actions { padding: 18px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .btn { padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.2s ease; letter-spacing: 0.3px; }
        .btn-full { grid-column: span 2; }
        .btn-primary { background: #fff; color: #000; }
        .btn-primary:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #aaa; border: 1px solid rgba(255,255,255,0.05); }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: rgba(255,255,255,0.15); }

        .memory-list { flex-grow: 1; overflow-y: auto; padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 6px; }
        .memory-list::-webkit-scrollbar { width: 4px; }
        .memory-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }

        .memory-item { padding: 14px; border-radius: 10px; font-size: 13px; display: flex; gap: 12px; align-items: start; border: 1px solid transparent; background: rgba(255,255,255,0.02); }
        .memory-item:hover { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.05); }
        
        .memory-checkbox { appearance: none; width: 16px; height: 16px; border: 1px solid #666; border-radius: 4px; cursor: pointer; margin-top: 2px; flex-shrink: 0; transition: all 0.2s; background: transparent; }
        .memory-checkbox:checked { background: #fff; border-color: #fff; box-shadow: 0 0 8px rgba(255,255,255,0.4); }
        
        .memory-content { flex: 1; min-width: 0; }
        .memory-title { font-weight: 700; color: #fff; margin-bottom: 6px; display: block; word-break: break-word; line-height: 1.4; }
        .memory-text { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; color: #999; line-height: 1.6; word-break: break-word; }
        
        .item-delete { color: #555; cursor: pointer; font-size: 14px; padding: 2px; transition: color 0.2s; opacity: 0; display: flex; align-items: center; justify-content: center; }
        .memory-item:hover .item-delete { opacity: 1; }
        .item-delete:hover { color: #ff4444; }
    </style>
    
    <div id="cortex-toggle" title="Omni-Cortex (Ctrl+Shift+Space)">✦</div>
    
    <div id="cortex-panel">
        <div class="header" id="drag-handle">
            <div class="header-top">
                <h3 class="title"><div class="title-dot"></div> OMNI CORTEX</h3>
                <button id="refresh-btn" style="background:none;border:none;color:#666;cursor:pointer;font-size:16px;transition:color 0.2s;font-weight:bold;" title="Sync">↻</button>
            </div>
            <div class="controls">
                <select id="memory-select"><option value="Main">Main</option></select>
                <button id="btn-create-memory" class="btn-icon" title="New Stream">＋</button>
                <button id="btn-delete-stream" class="btn-icon btn-trash" title="Delete Stream">🗑</button>
            </div>
            <div class="hint-text">Type <i>@cortex StreamName!</i> to route memory</div>
        </div>
        <div class="actions">
            <button class="btn btn-primary btn-full" id="btn-inject-selected">Inject Selected Context</button>
            <button class="btn btn-secondary" id="btn-attach-brain">Attach File</button>
            <button class="btn btn-secondary" id="btn-export-md">Export .md</button>
        </div>
        <div class="memory-list" id="memory-container">
            <div style='color:#666; font-size:13px; text-align:center; padding-top: 30px; font-weight:500;'>Syncing cortex...</div>
        </div>
    </div>
`;
shadow.innerHTML = sidebarHTML;

const toggleBtn = shadow.getElementById('cortex-toggle');
const panel = shadow.getElementById('cortex-panel');
const header = shadow.getElementById('drag-handle');
const memorySelect = shadow.getElementById('memory-select');

// --- 2. SMOOTH DRAG PHYSICS ---
let isDraggingToggle = false, didDragToggle = false, toggleOffsetX = 0, toggleOffsetY = 0;
let isDraggingPanel = false, panelOffsetX = 0, panelOffsetY = 0;

toggleBtn.addEventListener('mousedown', (e) => {
    isDraggingToggle = true; didDragToggle = false;
    const rect = toggleBtn.getBoundingClientRect();
    toggleOffsetX = e.clientX - rect.left; toggleOffsetY = e.clientY - rect.top;
});
header.addEventListener('mousedown', (e) => {
    isDraggingPanel = true;
    const rect = panel.getBoundingClientRect();
    panelOffsetX = e.clientX - rect.left; panelOffsetY = e.clientY - rect.top;
});
window.addEventListener('mousemove', (e) => {
    if (isDraggingToggle) {
        didDragToggle = true; 
        let newX = Math.max(0, Math.min(e.clientX - toggleOffsetX, window.innerWidth - toggleBtn.offsetWidth));
        let newY = Math.max(0, Math.min(e.clientY - toggleOffsetY, window.innerHeight - toggleBtn.offsetHeight));
        toggleBtn.style.left = `${newX}px`; toggleBtn.style.top = `${newY}px`;
        toggleBtn.style.right = 'auto'; toggleBtn.style.bottom = 'auto';
        if (isPanelOpen) alignPanelToToggle();
    }
    if (isDraggingPanel) {
        let newX = Math.max(0, Math.min(e.clientX - panelOffsetX, window.innerWidth - panel.offsetWidth));
        let newY = Math.max(0, Math.min(e.clientY - panelOffsetY, window.innerHeight - panel.offsetHeight));
        panel.style.left = `${newX}px`; panel.style.top = `${newY}px`;
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
    }
});
window.addEventListener('mouseup', () => { isDraggingToggle = false; isDraggingPanel = false; });

function alignPanelToToggle() {
    const tRect = toggleBtn.getBoundingClientRect();
    let pX = Math.max(10, Math.min(tRect.left - 360 + tRect.width, window.innerWidth - 370));
    let pY = tRect.bottom + 16;
    if (pY + 500 > window.innerHeight) pY = Math.max(10, tRect.top - 520);
    panel.style.left = `${pX}px`; panel.style.top = `${pY}px`;
}

// --- 3. TOGGLE & CLICK-AWAY LOGIC ---
function togglePanel() {
    isPanelOpen = !isPanelOpen;
    if (isPanelOpen) {
        alignPanelToToggle();
        panel.style.display = "flex";
        setTimeout(() => { panel.style.opacity = "1"; panel.style.transform = "translateY(0) scale(1)"; }, 10);
        loadStructure();
    } else {
        panel.style.opacity = "0";
        panel.style.transform = "translateY(-8px) scale(0.98)";
        setTimeout(() => { panel.style.display = "none"; }, 300);
    }
}
toggleBtn.addEventListener('click', () => { if (!didDragToggle) togglePanel(); });

document.addEventListener('mousedown', (e) => {
    if (isPanelOpen) {
        const clickedInsidePanel = e.composedPath().includes(cortexHost);
        const clickedToggleButton = e.composedPath().includes(toggleBtn) || e.target === toggleBtn;
        if (!clickedInsidePanel && !clickedToggleButton) togglePanel();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && isPanelOpen) togglePanel();
    if (e.code === "Space" && e.shiftKey && (e.ctrlKey || e.metaKey)) { e.preventDefault(); togglePanel(); }
});

// --- 4. DATA LOADING & DB PERSISTENCE ---
function loadStructure() {
    safeSendMessage({ action: "get_chats", folder: DEFAULT_FOLDER }, (response) => {
        let streamList = ["Main"]; 
        
        if (response && response.chats) {
            response.chats.forEach(c => {
                if (c !== "Main") streamList.push(c); 
            });
        }
        
        memorySelect.innerHTML = streamList.map(c => `<option value="${c}">${c}</option>`).join('');
        if (!streamList.includes(currentMemory)) currentMemory = "Main";
        memorySelect.value = currentMemory;
        
        loadMemoriesIntoSidebar();
        updateAllSaveButtons();
    });
}

function loadMemoriesIntoSidebar() {
    const container = shadow.getElementById('memory-container');
    container.innerHTML = "<div style='color:#666; font-size:13px; text-align:center; padding-top:30px; font-weight:500;'>Syncing...</div>"; 

    safeSendMessage({ action: "fetch_session_all", folder: DEFAULT_FOLDER, chat: currentMemory }, (response) => {
        container.innerHTML = ""; 
        if (response && response.status === "success" && response.dataArray && response.dataArray.length > 0) {
            response.dataArray.forEach(mem => {
                let div = document.createElement('div');
                div.className = 'memory-item';
                
                let displayTitle = "";
                let displayText = mem.text;
                const titleMatch = mem.text.match(/^\[TITLE\](.*?)\n\n/);
                if (titleMatch) {
                    displayTitle = titleMatch[1].trim();
                    displayText = mem.text.replace(titleMatch[0], "").trim();
                }

                let fakeTextArea = document.createElement('textarea');
                fakeTextArea.innerText = displayText; 
                let escapedText = fakeTextArea.innerHTML.replace(/"/g, '&quot;');
                
                div.innerHTML = `
                    <input type="checkbox" class="memory-checkbox" data-fulltext="${escapedText}">
                    <div class="memory-content">
                        ${displayTitle ? `<span class="memory-title">${displayTitle}</span>` : ''}
                        <div class="memory-text">${displayText.substring(0, 180)}...</div>
                    </div>
                    <div class="item-delete" title="Delete memory">✕</div>
                `;
                
                div.querySelector('.item-delete').addEventListener('click', () => {
                    if(confirm("Delete this context?")) {
                        safeSendMessage({ action: "delete_memory", id: mem.id }, () => loadMemoriesIntoSidebar());
                    }
                });
                
                container.appendChild(div);
            });
        } else {
            container.innerHTML = "<div style='color:#666; font-size:13px; text-align:center; padding-top:30px; font-weight:500;'>No context saved yet.</div>";
        }
    });
}

memorySelect.addEventListener('change', (e) => { currentMemory = e.target.value; loadMemoriesIntoSidebar(); updateAllSaveButtons(); });
shadow.getElementById('refresh-btn').addEventListener('click', () => { loadStructure(); });

shadow.getElementById('btn-create-memory').addEventListener('click', () => {
    let name = prompt("Name this context stream:");
    if (name && name.trim()) {
        currentMemory = name.trim();
        safeSendMessage({ 
            action: "remember_cortex", 
            folder: DEFAULT_FOLDER, 
            chat: currentMemory,
            query: `[TITLE] Stream Created\n\nAwaiting new context blocks.`
        }, () => {
            loadStructure(); 
        });
    }
});

shadow.getElementById('btn-delete-stream').addEventListener('click', () => {
    if(confirm(`Are you sure you want to delete ALL memories in "${currentMemory}"?`)) {
        safeSendMessage({ action: "delete_stream", folder: DEFAULT_FOLDER, chat: currentMemory }, () => {
            currentMemory = "Main";
            loadStructure(); 
        });
    }
});

// --- 5. KEYBOARD COMMAND ENGINE ---
document.addEventListener('keyup', (event) => {
    let activeEl = document.activeElement;
    if (activeEl && activeEl.shadowRoot && activeEl.shadowRoot.activeElement) activeEl = activeEl.shadowRoot.activeElement;
    if (!(activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) return;

    let text = activeEl.value || activeEl.innerText || activeEl.textContent || "";
    const cortexMatch = text.match(/@(?:cortex|agent)\s+([^!]+)\s*!/i); 
    if (cortexMatch) {
        currentMemory = cortexMatch[1].trim();
        safeSendMessage({ 
            action: "remember_cortex", folder: DEFAULT_FOLDER, chat: currentMemory,
            query: `[TITLE] Stream Created\n\nAwaiting new context blocks.`
        }, () => {
            loadStructure();
        });
        
        if (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT') activeEl.value = text.replace(cortexMatch[0], ""); 
        else activeEl.textContent = text.replace(cortexMatch[0], "");
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        toggleBtn.style.color = "#fff"; setTimeout(() => toggleBtn.style.color = "#fff", 500);
    }
});

// --- 6. UNIVERSAL DOM ENGINE ---
function getChatInputTarget() {
    return document.querySelector('#prompt-textarea') || document.querySelector('.ProseMirror') || 
           document.querySelector('rich-textarea [contenteditable="true"]') || 
           document.querySelector('textarea[placeholder*="Ask"], textarea[placeholder*="Message"]') || document.querySelector('[contenteditable="true"]') || document.querySelector('textarea'); 
}

shadow.getElementById('btn-inject-selected').addEventListener('click', () => {
    const checkboxes = shadow.querySelectorAll('.memory-checkbox:checked');
    if (checkboxes.length === 0) return alert("Select context to inject.");
    let combinedContext = `[CONTEXT: ${currentMemory}]\n`;
    checkboxes.forEach(cb => { combinedContext += cb.dataset.fulltext + "\n---\n"; });
    const activeEl = getChatInputTarget();
    if (activeEl) {
        activeEl.focus();
        if (!document.execCommand('insertText', false, combinedContext)) navigator.clipboard.writeText(combinedContext).then(() => alert("Copied to clipboard."));
        checkboxes.forEach(cb => cb.checked = false); 
        if (isPanelOpen) togglePanel(); 
    }
});

shadow.getElementById('btn-attach-brain').addEventListener('click', () => {
    const btn = shadow.getElementById('btn-attach-brain'); btn.innerText = "Processing...";
    safeSendMessage({ action: "fetch_session_all", folder: DEFAULT_FOLDER, chat: currentMemory }, (response) => {
        if (response && response.status === "success") {
            const file = new File([`SYSTEM CONTEXT\nStream: ${currentMemory}\n\n` + response.data], `${currentMemory}.txt`.replace(/\s+/g, '_'), { type: 'text/plain' });
            const dataTransfer = new DataTransfer(); dataTransfer.items.add(file);
            let uploaded = false;
            document.querySelectorAll('input[type="file"]').forEach(i => { try { i.files = dataTransfer.files; i.dispatchEvent(new Event('change', { bubbles: true })); uploaded = true; } catch (e) {} });
            const el = getChatInputTarget();
            if (el) { el.focus(); el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dataTransfer })); el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dataTransfer })); uploaded = true; }
            document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dataTransfer }));
            if (!uploaded) { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); btn.innerText = "Downloaded"; } else btn.innerText = "Attached";
            setTimeout(() => { btn.innerText = "Attach File"; if (isPanelOpen) togglePanel(); }, 2000);
        }
    });
});

shadow.getElementById('btn-export-md').addEventListener('click', () => {
    safeSendMessage({ action: "fetch_session_all", folder: DEFAULT_FOLDER, chat: currentMemory }, (response) => {
        if (response && response.status === "success") {
            let mdContent = `# Context Export\n**Stream:** ${currentMemory}\n\n---\n\n`;
            mdContent += response.data.replace(/\[TITLE\](.*?)\n\n/g, "### 📌 $1\n").replace(/PROMPT:/g, "\n#### User\n").replace(/RESPONSE:/g, "\n#### Assistant\n");
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([mdContent], { type: 'text/markdown' })); a.download = `${currentMemory}.md`.replace(/\s+/g, '_'); a.click();
        }
    });
});

// --- 7. ULTIMATE DUPLICATE ANNIHILATOR (Nested-Node Filter) ---
function injectCortexButtons() {
    let rawBlocks = document.querySelectorAll('.markdown, message-content, .font-claude-message, .prose, [data-testid="bot-message"], .step-content, .message.ai');
    
    // Filter out inner blocks to prevent double-injections
    let aiBlocks = Array.from(rawBlocks).filter(block => {
        let parent = block.parentElement;
        while(parent) {
            if (parent.matches && parent.matches('.markdown, message-content, .font-claude-message, .prose, [data-testid="bot-message"], .step-content, .message.ai')) {
                return false; // It's nested inside another valid block, drop it
            }
            parent = parent.parentElement;
        }
        return true; // Keep outer-most block
    });

    aiBlocks.forEach((block) => {
        if (block.innerText.length < 20) return;
        
        let parent = block.parentElement;
        if (!parent) return;

        // Check if THIS SPECIFIC parent already has a button in it
        let existingButtons = parent.querySelectorAll(':scope > .cortex-save-ui');
        if (existingButtons.length > 0) {
            // Destroy any extras React might have cloned
            if (existingButtons.length > 1) {
                for (let i = 1; i < existingButtons.length; i++) {
                    existingButtons[i].remove();
                }
            }
            return; 
        }

        let actionBar = document.createElement('div');
        actionBar.className = 'cortex-save-ui';
        actionBar.style = "margin: 18px 0; display: inline-flex; z-index: 10; position: relative;";

        let saveBtn = document.createElement('button');
        saveBtn.innerHTML = `✦ Save to <span class="cortex-btn-label" style="font-weight:700; max-width:120px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:bottom;">${currentMemory}</span>`;
        saveBtn.style = "background: #fff; color: #000; border: none; border-radius: 999px; font-size: 11px; font-weight: 500; cursor: pointer; padding: 7px 16px; font-family: -apple-system, sans-serif; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 4px;";

        actionBar.appendChild(saveBtn);

        saveBtn.onmouseenter = () => saveBtn.style.transform = "translateY(-1px) scale(1.02)";
        saveBtn.onmouseleave = () => saveBtn.style.transform = "translateY(0) scale(1)";

        actionBar.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
            
            let contextName = prompt("Name this context (leave blank for no name):");
            if (contextName === null) return; 
            
            saveBtn.innerHTML = "Securing...";
            saveBtn.style.background = "#e0e0e0";
            
            let clone = block.cloneNode(true);
            let btnToRemove = clone.querySelector('.cortex-save-ui');
            if (btnToRemove) btnToRemove.remove();
            let cleanAiResponse = clone.innerText.trim();
            
            let userPrompt = "Context Saved";
            let userBlocks = Array.from(document.querySelectorAll('[data-message-author-role="user"], .font-user-message, user-query, [data-testid="user-message"], .message.user, [data-message-role="user"], .prose-user'));
            
            for (let i = userBlocks.length - 1; i >= 0; i--) {
                if (userBlocks[i].compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    userPrompt = userBlocks[i].innerText.trim();
                    break;
                }
            }
            
            let finalQuery = `PROMPT:\n${userPrompt}\n\nRESPONSE:\n${cleanAiResponse}`;
            if (contextName.trim() !== "") finalQuery = `[TITLE] ${contextName.trim()}\n\n${finalQuery}`;

            safeSendMessage({ 
                action: "remember_cortex", 
                folder: DEFAULT_FOLDER, 
                chat: currentMemory,
                query: finalQuery
            }, (response) => {
                if (response && response.status === "success") {
                    saveBtn.innerHTML = "Saved";
                    saveBtn.style.background = "transparent";
                    saveBtn.style.color = "#888";
                    saveBtn.style.boxShadow = "none";
                    saveBtn.style.border = "1px solid rgba(255,255,255,0.1)";
                    actionBar.style.pointerEvents = "none"; 
                    if (isPanelOpen) loadMemoriesIntoSidebar(); 
                } else {
                    saveBtn.innerHTML = "Error";
                    setTimeout(() => { saveBtn.innerHTML = `✦ Save to <span class="cortex-btn-label" style="font-weight:700;">${currentMemory}</span>`; saveBtn.style.background = "#fff"; }, 2000);
                }
            });
        }, true);
        
        // Inject exactly underneath the matched block
        parent.insertBefore(actionBar, block.nextSibling);
    });
}

setInterval(injectCortexButtons, 1500);