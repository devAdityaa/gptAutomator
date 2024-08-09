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
    messageContainer.innerText = `#${message}`;
    terminal.appendChild(messageContainer);
}

function changeBtnState(state) {
    btnState = state;
    switch (state) {
        case 1:
            document.documentElement.style.setProperty('--glow-color', COLORS.LOADING);
            startBtn_letter_1.innerText = 'L';
            startBtn_letter_2.innerText = 'OAD';
            startBtn_letter_3.innerText = 'ING';
            startBtn.style.cursor = 'not-allowed';
            break;
        case 2:
            document.documentElement.style.setProperty('--glow-color', COLORS.END_PROCESS);
            startBtn_letter_1.innerText = 'S';
            startBtn_letter_2.innerText = 'T';
            startBtn_letter_3.innerText = 'OP';
            startBtn.style.cursor = 'pointer';
            break;
        default:
            document.documentElement.style.setProperty('--glow-color', COLORS.START_PROCESS);
            startBtn_letter_1.innerText = 'S';
            startBtn_letter_2.innerText = 'T';
            startBtn_letter_3.innerText = 'ART';
            startBtn.style.cursor = 'pointer';
            break;
    }
}

async function sendMessage(processCode) {
    try {
        let message;
        let type;

        if (processCode === '1') {
            message = 'Connecting to the server...';
            type = 'checkServer';
        } else if (processCode === '2') {
            message = 'Stopping the current process...';
            type = 'stopServer';
        } else {
            return 0;
        }

        logToTerminal(message);
        const response = await chrome.runtime.sendMessage({ type });
        if (response && response.message === '1') {
            logToTerminal(processCode === '1' ? 'Connected To Server' : 'Process Stopped, Thanks for using!');
            return 1;
        } else {
            logToTerminal(processCode === '1' ? "Couldn't connect to server" : "Couldn't end process...");
            return 0;
        }
    } catch (error) {
        logToTerminal('Error occurred');
        console.log("Error sending message:", error);
        return 0;
    }
}

async function sendIndex(id) {
    try {
        const currentWindow = await new Promise((resolve) => chrome.windows.getCurrent(resolve));
        const tabs = await new Promise((resolve) => chrome.tabs.query({ active: true, windowId: currentWindow.id }, resolve));

        if (tabs.length > 0) {
            const tabId = tabs[0].id;
            const res = await chrome.tabs.sendMessage(tabId, { type: 'fromPopup', index: id });
            if (!res) throw new Error("Can't communicate with helper script");
            return 1;
        } else {
            logToTerminal("No active tabs found");
            return 0;
        }
    } catch (e) {
        logToTerminal('Error occurred');
        console.log("Error:", e);
        return 0;
    }
}

startBtn.addEventListener('click', async () => {
    if (btnState === 1) return;

    if (btnState === 2) {
        changeBtnState(1);
        const response = await sendMessage('2');
        changeBtnState(response === 1 ? 0 : 2);
    } else if (btnState === 0) {
        changeBtnState(1);
        const response = await sendMessage('1');
        if (response === 1) {
            changeBtnState(2);
            const indexValue = document.querySelector('input#indexValue');
            const startIndex = parseInt(indexValue.value, 10);
            const r = await sendIndex(startIndex - 1);
            if (r) {
                logToTerminal("Index Sent for Processing");
            } else {
                logToTerminal("Can't Start Process, Internal Error");
                changeBtnState(0);
            }
        } else {
            changeBtnState(0);
        }
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "logMessage") {
        logToTerminal(message.message);
    } else if (message.type === "completed") {
        logToTerminal("Process Completed Successfully!");
        changeBtnState(0);
    }
});
