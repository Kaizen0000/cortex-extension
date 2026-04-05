const hostName = "com.omnicortex.local";
let port = chrome.runtime.connectNative(hostName);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    port.postMessage({
        command: request.action, 
        folder: request.folder || "General",
        chat: request.chat || "Main",
        text: request.query || "",
        id: request.id || 0 // NEW: Pass the ID for deletions
    });

    const listener = (msg) => {
        sendResponse(msg); 
        port.onMessage.removeListener(listener);
    };
    
    port.onMessage.addListener(listener);
    return true; 
});

port.onDisconnect.addListener(() => {
    console.error("Disconnected from Go backend.");
});