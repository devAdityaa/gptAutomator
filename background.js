// Constants
const PROMPTS = ["Prompt 1", "Prompt 2", "Prompt 3"];
const API_URL_INFO = 'http://localhost:3000/api/data/fetch/info';
const API_URL_PROMPT = 'http://localhost:3000/api/data/fetch/prompt';
const API_URL_POST = 'http://localhost:3000/api/data/update/promptResponse'
const RESPONSE_DELAY = 5000;  // Delay for asynchronous responses

// Function to handle tab updates
function handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        const tabUrl = tab.url;
        console.log(`Tab URL: ${tabUrl}`);

        if (tabUrl.includes('chatgpt.com')) {
            console.log("Tab URL includes chatgpt.com, sending message to content script");
            fetchData();
        } else {
            console.log("Tab URL does not include chatgpt.com.");
        }
    }
}
// Function to fetch data from API
async function fetchPrompt(id) {
    try{
        console.log("Sending request INFO");
        const url = `${API_URL_PROMPT}?id=${id}`;

        const response = await fetch(url);
        const responseObject = await response.json();
        console.log("Response for prompt:", responseObject)
        return responseObject;
    }
    catch(e){
        console.log("Error",e)
        return ''
    }
}


async function postResponse(responseText, p_id) {
    try{
        console.log("POST IR",p_id, JSON.stringify({
            p_id:p_id,
            result:responseText
            
        }))
        const response = await fetch(API_URL_POST, {
            method:'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                result:responseText,
                p_id
            })
            
        });
        const responseObject = await response.json();
        console.log("Response for post", responseObject)
        return responseObject;
    }
    catch(e){
        console.log("Error",e)
        return ''
    }
}

// Function to fetch data from API
async function fetchData() {
    try{
        console.log("Sending request INFO");
        const response = await fetch(API_URL_INFO);
        const responseObject = await response.json();
        return responseObject
    }
    catch(e){
        console.log("Error",e)
        return ''
    }
}
function handleRuntimeMessage(request, sender, sendResponse) {
    if (request.queryText) {
        console.log("Processing queryText:", request.queryText);
    } else if (request.type === 'checkServer' || request.type === 'stopServer') {
        console.log("Received request:", request.type);
        try {
            setTimeout(()=>{
                fetchData()
                .then(data=>{
                    sendResponse(data)
                }) // Await fetchData here
            },3000)
            
        } catch (error) {
            console.log("Error fetching data:", error);
            sendResponse({ error: "Failed to fetch data" }); // Send an error response
        }
        return true; // Keep the message channel open for async response
    } else if (request.type === 'getPrompt') {
        setTimeout(() => {
            try {
                fetchPrompt(request.index)
                .then(data=>{
                    sendResponse({ type: 'throwPrompt', promptObj:data })
                }) // Await fetchData here
            } catch (error) {
                console.log("Error processing indexProcess:", error);
                sendResponse({ type: 'throwPrompt', prompt: '' });
            }
        }, 3000);
        return true; // Keep the message channel open for async response
    }
    else if (request.type === 'postResponse') {
        try {
            postResponse(request.response, request.p_id)
            .then(data=>{
               
            }) 
        } catch (error) {
            console.log("Error posting", error);
            
        }
        return true; // Keep the message channel open for async response
    }
}


// Adding event listeners
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.runtime.onMessage.addListener(handleRuntimeMessage);







