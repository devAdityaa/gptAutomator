function modifyResponse(response, callback, p_id) {
    try {
        const resArr = response.split('data: ');
        let textResponse = "";
        for (let i = 0; i < resArr.length; i++) {
            let s = resArr[i].trim();
            if (s.includes("finished_successfully")) {
                let js = JSON.parse(s);
                textResponse = js.message.content.parts.join("");
                break;
            }
        }
      
        callback({ text: textResponse, p_id });
        return response;
    } catch (e) {
        console.log(e);
        return response;
    }
}

function interceptAndModifyRequest(callback, query, p_id) {
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
    
        if (typeof input === 'string' && input === "https://chatgpt.com/backend-api/conversation") {
          
            return originalFetch.apply(this, arguments).then(response => {
                if (response.url.includes('.com')) {
                    return response.text().then(async text => {
                        const modifiedText = modifyResponse(text, callback, p_id);
                        window.fetch = originalFetch;
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

function sendResponse(res) {
    window.postMessage({ from: "isolatedScript", ...res }, "*");
}

window.addEventListener("message", (event) => {
    if (event.data.from === "helperScript") {
        console.log("Message received from helper script:", event.data);
        interceptAndModifyRequest(sendResponse, event.data.text, event.data.p_id);
    }
});

console.log('Isolated script injected and ready');
