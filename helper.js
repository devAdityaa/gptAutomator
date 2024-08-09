// Helper content script

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "fromPopup") {
        sendResponse(1)
        const startIndex = message.index;

        // Initialize a flag for the response
        let responseSent = false;

        // Function to wait for a response from the isolated content script
        const waitForResponse = () => {
            return new Promise((resolve) => {
                const onMessage = (event) => {
                    if (event.source === window && event.data.from === "isolatedScript") {
                        console.log("From Helper Script here, received text", event.data.text);

                        // Log the response from the isolated content script
                        chrome.runtime.sendMessage({
                            type: 'logMessage',
                            message: `Response from Chat GPT Web: ${event.data.text}`
                        });

                        // Remove the event listener to avoid memory leaks
                        window.removeEventListener("message", onMessage);

                        resolve(); // Resolve the promise when response is received
                    }
                };

                // Add the message event listener
                window.addEventListener("message", onMessage);
            });
        };

        // Loop through the range and handle prompts
        for (let i = startIndex; i <= 2; i++) {
            try {
                // Fetch prompt from the background script
                const prompt = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ type: 'getPrompt', index: i }, resolve);
                });

                console.log("Prompt Fetched From Backend", prompt);

                // Log the fetched prompt
                chrome.runtime.sendMessage({
                    type: 'logMessage',
                    message: `Prompt Fetched From Database for index: ${i + 1}`
                });

                // Post the prompt to the window
                window.postMessage({ from: "helperScript", text: prompt.prompt }, "*");

                // Wait for the response from the isolated content script
                await waitForResponse();

            } catch (error) {
                console.log("Error processing prompt:", error);
                // Handle error and optionally send a response or log the issue
            }
        }

        // Send a response to the background script
        if (!responseSent) {
            sendResponse(1);
            responseSent = true;
        }

        chrome.runtime.sendMessage({
            type: 'completed'
        });

        // Keep the message channel open for asynchronous response
        return true;
    }
});
