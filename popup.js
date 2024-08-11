const startBtn = document.querySelector('.start-btn');
const startBtn_letter_1 = document.querySelector('.start-btn-letter-1');
const startBtn_letter_2 = document.querySelector('.start-btn-letter-2');
const startBtn_letter_3 = document.querySelector('.start-btn-letter-3');
const isContinuous = document.querySelector('input#cnt');


let btnState = 0;

const COLORS = {
    LOADING: 'hsl(221, 100%, 69%)',
    END_PROCESS: 'hsl(7, 100%, 69%)',
    START_PROCESS: 'hsl(159, 100%, 69%)'
};

function logToTerminal(message) {
    const terminal = document.querySelector('.terminal');
    const messageContainer = document.createElement('p');
    messageContainer.innerHTML = `<span style="color:green;display:inline;margin:0;padding:0;">#</span>${message}`;
    terminal.appendChild(messageContainer);
}

function changeBtnState(state) {
    btnState = state;
    const glowColor = document.documentElement.style;
    const cursorStyle = startBtn.style;

    switch (state) {
        case 1:
            glowColor.setProperty('--glow-color', COLORS.LOADING);
            startBtn_letter_1.innerText = 'L';
            startBtn_letter_2.innerText = 'OAD';
            startBtn_letter_3.innerText = 'ING';
            cursorStyle.cursor = 'not-allowed';
            break;
        case 2:
            glowColor.setProperty('--glow-color', COLORS.END_PROCESS);
            startBtn_letter_1.innerText = 'S';
            startBtn_letter_2.innerText = 'T';
            startBtn_letter_3.innerText = 'OP';
            cursorStyle.cursor = 'pointer';
            break;
        default:
            glowColor.setProperty('--glow-color', COLORS.START_PROCESS);
            startBtn_letter_1.innerText = 'S';
            startBtn_letter_2.innerText = 'T';
            startBtn_letter_3.innerText = 'ART';
            cursorStyle.cursor = 'pointer';
            break;
    }
}

async function sendMessage(processCode) {
    try {
        let message;
        let type;

        switch (processCode) {
            case '1':
                message = 'Connecting to the server...';
                type = 'checkServer';
                break;
            case '2':
                message = 'Stopping the current process...';
                type = 'stopServer';
                break;
            default:
                return 0;
        }

        logToTerminal(message);
        const response = await chrome.runtime.sendMessage({ type });

        if (response?.databaseName) {
            logToTerminal(`Connected To Server\n#Database Name: ${response.databaseName}\n#Username: ${response.currentUser}`);
            return 1;
        } else if (processCode === '2') {
            await stopProcess();
        } else {
            logToTerminal(`Couldn't ${processCode === '1' ? 'connect to server' : 'end process'}...`);
            return 0;
        }
    } catch (error) {
        logToTerminal(`Error occurred: ${error.message}`);
        console.log("Error sending message:", error);
        return 0;
    }
}

async function stopProcess() {
    const tabId = await getActiveTabId();
    if (tabId) {
        await chrome.tabs.sendMessage(tabId, { type: "changeRunState", state: 0 });
        logToTerminal("Process stopped... Thanks for using!");
    }
}

async function sendIndex(id,isContinuous) {
    try {
        const tabId = await getActiveTabId();
        if (tabId) {
            await chrome.tabs.sendMessage(tabId, { type: "changeRunState", state: 1 });
            const res = await chrome.tabs.sendMessage(tabId, { type: 'fromPopup', index: id, isContinuous });
            if (!res) throw new Error("Can't communicate with helper script");
            return 1;
        } else {
            logToTerminal("No active tabs found");
            return 0;
        }
    } catch (error) {
        logToTerminal(`Error occurred: ${error.message}`);
        logToTerminal("Troubleshoot: \n1. Check if you are not on chat gpt page, if not go to chatgpt web page.\n2.Refresh Chat GPT page if you're already on it")
        console.log("Error:", error);
        return 0;
    }
}

async function getActiveTabId() {
    const currentWindow = await chrome.windows.getCurrent();
    const tabs = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
    return tabs.length > 0 ? tabs[0].id : null;
}

startBtn.addEventListener('click', async () => {
    if (btnState === 1) return;

    if (btnState === 2) {
        changeBtnState(1);
        const response = await sendMessage('2');
        stopProcess()
        .then(()=> changeBtnState(response === 1 ? 0 : 2))
        
    } else if (btnState === 0) {
        changeBtnState(1);
        const response = await sendMessage('1');
        if (response === 1) {
            changeBtnState(2);
            const indexValue = document.querySelector('input#indexValue');
            const isContinuous = document.querySelector('input#cnt');
            const startIndex = parseInt(indexValue.value);
            const result = await sendIndex(startIndex, isContinuous.checked);
            logToTerminal(result ? "Index Sent for Processing" : "Can't Start Process, Internal Error");
            if (!result) changeBtnState(0);
        } else {
            changeBtnState(0);
        }
    }
});


isContinuous.addEventListener('click',(e)=>{
    if( e.target.checked){
        const continuousLabelText = document.querySelector('.rightInput .label_text')
        continuousLabelText.innerText = 'Max Amount';
    }
    else{
        const continuousLabelText = document.querySelector('.rightInput .label_text')
        continuousLabelText.innerText = 'Index';
    }
    

})
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "logMessage":
            logToTerminal(request.message);
            break;
        case "completed":
            logToTerminal("Process Completed Successfully!");
            changeBtnState(0);
            break;
        case "isActive":
            console.log("Received from Helper confirm");
            if (request.type) sendResponse(1);
            break;
    }
});
