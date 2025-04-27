// Connect to Socket.io server
const socket = io();

// DOM elements
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const startBtn = document.getElementById('startBtn');
const keys = document.querySelectorAll('.key');
const capsKey = document.querySelector('.caps');

let username = '';
let isCaps = false;
let isShift = false;

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        // Emit chat message to server
        socket.emit('chat message', `[${username}] ${input.value}`);
        input.value = '';
    }
});

startBtn.addEventListener('click', function() {
    const input = document.getElementById('username-input').value.trim();
    if (input) {
        username = input;
        document.getElementById('input').placeholder = `${username}: Type a message...`;
    } 
});

// keyboard functionality
keys.forEach(key => {
    key.addEventListener('click', () => {
        const baseKey = key.getAttribute('data-key');
        if (key.classList.contains('back')) {
            input.value = input.value.slice(0, -1);
        } else if (key.classList.contains('space')) {
            input.value += ' ';
        } else if (key.classList.contains('shift')) {
            isShift = !isShift;
            updateKeysDisplay();
        } else if (key.classList.contains('enter')) {
            form.dispatchEvent(new Event('submit'));
        } else if (key.classList.contains('caps')) {
            isCaps = !isCaps;
            updateKeysDisplay();
        } else {
            // use key that visibly shows on button
            //let keyValue = key.getAttribute('data-key');
            let keyValue = key.textContent;
            
            if (keyValue.length === 1 && /[a-zA-Z]/.test(keyValue)) {
                if (isCaps || isShift) {
                    keyValue = keyValue.toUpperCase();
                } else {
                    keyValue = keyValue.toLowerCase();
                }
            }
            
            input.value += keyValue;

            // if shift was pressed, turn it off after typing once
            if (isShift) {
                isShift = false;
                updateKeysDisplay();
            }
        }
    });
});

function updateKeysDisplay() {
    keys.forEach(k => {
        const kBase = k.getAttribute('data-key');
        if (kBase &&
            !k.classList.contains('space') &&
            !k.classList.contains('enter') &&
            !k.classList.contains('back') &&
            !k.classList.contains('shift') &&
            !k.classList.contains('caps')) {
                if (kBase.length === 1 && /[a-zA-Z]/.test(kBase)) {
                    // display uppercase if caps or shift is active
                    k.textContent = (isCaps || isShift) ? kBase.toUpperCase() : kBase.toLowerCase();
                } else {
                    k.textContent = kBase;
                }
            }
    });
}

// Listen for chat messages from server
socket.on('chat message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// Optional: Display connection/disconnection notifications
socket.on('user connected', () => {
    const item = document.createElement('li');
    item.textContent = 'A user has joined the chat';
    item.className = 'system-message';
    messages.appendChild(item);
});

socket.on('user disconnected', () => {
    const item = document.createElement('li');
    item.textContent = 'A user has left the chat';
    item.className = 'system-message';
    messages.appendChild(item);
});
