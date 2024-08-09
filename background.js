// Constants
const PROMPTS = ["Prompt 1", "Prompt 2", "Prompt 3"];
const API_URL = 'http://localhost:3000/api/data/fetch';
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
function fetchData() {
    console.log("Sending request");
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            console.log('Fetch Response:', data);
        })
        .catch(error => {
            console.log('Error fetching data:', error);
        });
}

// Function to handle runtime messages
function handleRuntimeMessage(request, sender, sendResponse) {
    console.log("Request:", request);

    if (request.queryText) {
        console.log("Processing queryText:", request.queryText);
    } else if (request.type === 'checkServer' || request.type === 'stopServer') {
        console.log("Received request:", request.type);
        setTimeout(() => {
            sendResponse({ message: '1' });
        }, RESPONSE_DELAY);
        return true;  // Keep the message channel open for async response
    } else if (request.type === 'getPrompt') {
        setTimeout(() => {
            try {
                const prompt = PROMPTS[request.index] || '';  // Ensure valid index
                console.log("Prompt:", prompt);
                sendResponse({ type: 'throwPrompt', prompt });
            } catch (error) {
                console.log("Error processing indexProcess:", error);
                sendResponse({ type: 'throwPrompt', prompt: '' });
            }
        }, RESPONSE_DELAY);
        return true;  // Keep the message channel open for async response
    }
}

// Adding event listeners
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.runtime.onMessage.addListener(handleRuntimeMessage);
