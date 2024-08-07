// Listener for tab updates
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // Check if the tab is fully loaded
    if (changeInfo.status === 'complete') {
        const tabUrl = tab.url;
        
        if (tabUrl.includes('chatgpt.com')) {
            console.log("Tab URL includes chatgpt.com, sending message to content script");
            
            // Send message to content script in the updated tab
            chrome.tabs.sendMessage(tabId, { text: "What is the meaning of life?" });
        } else {
            console.log("Tab URL does not include chatgpt.com.");
        }
    }
});

// Listener for messages from other parts of the extension (like a popup)
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Background script received a message:", request);
    if (request.queryText) {
        // Optionally handle messages from popup or other parts of the extension
        // Here, you might want to store or process the message differently
        console.log("Processing queryText:", request.queryText);
    }
});

// Example function to initiate a process (could be triggered by other means)
function initiateProcess() {
    console.log("Background script running");
    // You can add code here to handle any initiation process
}

// Run function after background script starts
setTimeout(initiateProcess, 10000);
