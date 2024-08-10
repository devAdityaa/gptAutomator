// Helper content script
window.shouldContinue = 0;

// Function to check if the popup is active
async function checkIfPopupActive() {
    try {
        const isPopupActive = await chrome.runtime.sendMessage({ from: 'helper', type: 'isActive' });
        if (isPopupActive)
            return 1
        else
            return 0;
    } catch (error) {
        console.error("Error checking popup active state:", error);
        return 0; // Default to inactive if there's an error
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message.type === "changeRunState") {
        console.log("RUN STATUS  CHANGE RECEIVED:", message.state)
        window.shouldContinue = message.state;
        return;
    }

    if (message.type === "fromPopup") {
        sendResponse(1);  // Acknowledge message receipt
        const startIndex = message.index;
        const isContinuous = message.isContinuous;
        // Function to wait for a response from the isolated content script
        const waitForResponse = () => {
            return new Promise((resolve) => {
                const onMessage = (event) => {
                    if (event.source === window && event.data.from === "isolatedScript") {
                        console.log("From Helper Script here, received text", event.data);

                        const logMessage = window.shouldContinue 
                            ? "Response Saved to database" 
                            : "Process ended due to closure of popup page or pressing of stop button...";
                        
                        // Log the appropriate message
                        chrome.runtime.sendMessage({ type: 'logMessage', message: logMessage });

                        // Send the response back
                        chrome.runtime.sendMessage({
                            type: 'postResponse',
                            response: window.shouldContinue ? event.data.text : '',
                            p_id: event.data.p_id
                        });

                        // Clean up the event listener
                        window.removeEventListener("message", onMessage);
                        resolve(window.shouldContinue);
                    }
                };

                // Add the message event listener
                window.addEventListener("message", onMessage);
            });
        };
        if(isContinuous){
            for (let i=1; i <=startIndex; i++) {
                try {
                    
                    const isActive = await checkIfPopupActive();
                    console.log("WIndow ", window.shouldContinue, isActive)
                    // Check if the popup is still active
                    if ( isActive== 0) {
                        window.shouldContinue = 0;
                    }
    
                    // Stop the loop if shouldContinue is 0
                    if (!window.shouldContinue) break;
    
                    // Fetch prompt from the background script
                    const promptObj = await new Promise((resolve) => {
                        chrome.runtime.sendMessage({ type: 'getPrompt', index: i }, resolve);
                    });
    
                    // Log the fetched prompt
                    chrome.runtime.sendMessage({
                        type: 'logMessage',
                        message: `Prompt Fetched From Database for index: ${i}`
                    });
    
                    // Post the prompt to the window
                    window.postMessage({ from: "helperScript", p_id: promptObj.promptObj.promptId, text: promptObj.promptObj.prompt }, "*");
    
                    // Wait for the response from the isolated content script
                    await waitForResponse();
    
                    // Stop the loop if shouldContinue is 0
                    if (!window.shouldContinue) break;
    
                } catch (error) {
                    console.error("Error processing prompt:", error);
                }
            }
        }
        else{
            try {
                // Check if the popup is still active
                if (await checkIfPopupActive() === 0) {
                    window.shouldContinue = 0;
                }

                // Stop the loop if shouldContinue is 0
                if (!window.shouldContinue) return;

                // Fetch prompt from the background script
                const promptObj = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ type: 'getPrompt', index: startIndex }, resolve);
                });

                // Log the fetched prompt
                chrome.runtime.sendMessage({
                    type: 'logMessage',
                    message: `Prompt Fetched From Database for index: ${startIndex}`
                });

                // Post the prompt to the window
                window.postMessage({ from: "helperScript", p_id: promptObj.promptObj.promptId, text: promptObj.promptObj.prompt }, "*");

                // Wait for the response from the isolated content script
                await waitForResponse();

                // Stop the loop if shouldContinue is 0
                if (!window.shouldContinue) return;

            } catch (error) {
                console.error("Error processing prompt:", error);
            }
        }

        // Notify the background script that the process is completed
        chrome.runtime.sendMessage({ type: 'completed' });
        return true;  // Keep the message channel open for asynchronous response
    }
});
