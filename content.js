console.log("Content script loaded");

// Function to handle the response and modify it
async function modifyResponse(response, callback) {
    try {
        const resArr = response.split('data: ');
        let textResponse = "";

        for (let i = 0; i < resArr.length; i++) {
            let s = resArr[i].trim();
            if (s.includes("in_progress")) {
                let js2 = JSON.parse(s);
                js2.message.content.parts = [""];
            } else if (s.includes("finished_successfully")) {
                let js = JSON.parse(s);
                textResponse = js.message.content.parts.join(""); // Convert array to string
            }
        }
        callback({ text: textResponse  })
        // Call sendFunction with the modified response
        return response; // Return original response if needed
    } catch (e) {
        console.log(e);
        return response;
    }
}









// Function to intercept and modify fetch requests
function interceptAndModifyRequest(callback,query) {
    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
        if (typeof input === 'string' && input === "https://chatgpt.com/backend-api/conversation") {
            console.log("Intercepting request:", input);
            return originalFetch.apply(this, arguments).then(response => {
                if (response.url.includes('.com')) {
                    return response.text().then(async text => {
                        const modifiedText = await modifyResponse(text, callback);
                        return new Response(modifiedText, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers,
                        });
                    });
                }
                return response;
            });
        } else {
            return originalFetch.apply(this, arguments);
        }
    };
    initiateRequest(query);
}

// Function to initiate request by simulating user input
function initiateRequest(text) {
    const form = document.querySelector('form');
    const inputField = form.querySelector('textarea');

    // Function to handle the input event
    function handleInput() {
        inputField.value = text;
        // Trigger the input event
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Set the value and trigger the input event
    handleInput();
    setTimeout(()=>{
        const button = form.querySelector('button[data-testid]');
        button.click();
    },3000)
    
   
}

// Listener for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received a message:", message);
    if (message.text) {

            interceptAndModifyRequest(
                sendResponse, message.text
            );
            
       
    }
    return true; // Required for async sendResponse
});
