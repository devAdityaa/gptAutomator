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
        console.log(textResponse)
        callback({ text: textResponse });
        return response; // Return original response if needed
    } catch (e) {
        console.log(e);
        return response;
    }
}

function interceptAndModifyRequest(callback, query) {
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        console.log("FETCH", input)
        if (typeof input === 'string' && input === "https://chatgpt.com/backend-api/conversation") {
            console.log("Intercepting request:", input);
            return originalFetch.apply(this, arguments).then(response => {
                if (response.url.includes('.com')) {
                    return response.text().then(async text => {
                        const modifiedText = await modifyResponse(text, callback);
                        return new Response(modifiedText, {
                            status: response.status,
                            statusText: response.statusText,
                            headers: response.headers
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

function initiateRequest(text) {
    const form = document.querySelector('form');
    const inputField = form.querySelector('textarea');

    function handleInput() {
        inputField.value = text;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
    }

    handleInput();
    setTimeout(() => {
        const button = form.querySelector('button[data-testid]');
        button.click();
    }, 3000);
}

// Function to send responses back to the helper script
function sendResponse(res) {
    window.postMessage({ from: "isolatedScript", ...res }, "*");
}

// Listen for messages from the helper script
window.addEventListener("message", (event) => {
    // Ensure the message is from the helper script
    if (event.data.from === "helperScript") {
        console.log("Message received from helper script:", event.data);
        interceptAndModifyRequest(sendResponse, event.data.text);
    }
});

console.log('Isolated script injected and ready');
