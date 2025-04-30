// Connect to Socket.io server
const socket = io();

// DOM elements
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const startBtn = document.getElementById('startBtn');
const keys = document.querySelectorAll('.key');
const capsKey = document.querySelector('.caps');
const sound = new Audio ('/assets/Klick.mp3');

let username = '';
let isCaps = false;
let isShift = false;

// (Temporary) If not set by the user, set it to default
let currentRoom = 'default';

input.disabled = true;
input.placeholder = 'Please enter your username first!';
input.style.cursor = 'not-allowed';

function setUsername(name) {
    username = name;
    input.disabled = false;
    input.placeholder = 'Type a message...';
    input.style.cursor = 'text';
    joinRoom('default');
}

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!username) {
        alert('Please enter your username first!');
        return;
    }
    if (input.value) {
        // Emit chat message to server with room information
        socket.emit('chat message', {

            room: currentRoom,
            message: `[${username}] ${input.value}`
        });
        input.value = '';
    }
});

startBtn.addEventListener('click', function() {
    const input = document.getElementById('username-input').value.trim();
    if (input) {
        username = input;
        setUsername(input);
        document.getElementById('input').placeholder = `${username}: Type a message...`;
        input.disabled = false;
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
            sound.play();

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

// Automatically focus the input when page loads
window.addEventListener("load", function() {   
    input.focus();

    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) {
            sound.currentTime = 0;
            sound.play();
            
            let key = e.key.toLowerCase();
            let keyElement;
            
            // Handle special cases
            switch(key) {
                case ' ':
                    keyElement = document.querySelector('.key.space');
                    break;
                case 'backspace':
                    keyElement = document.querySelector('.key.back');
                    break;
                case 'enter':
                    keyElement = document.querySelector('.key.enter');
                    break;
                case 'capslock':
                    keyElement = document.querySelector('.key.caps');
                    break;
                case 'shift':
                    keyElement = document.querySelector('.key.shift');
                    break;
                default:
                    keyElement = document.querySelector(`.key[data-key="${e.key}"]`);
                    if (!keyElement) {
                        keyElement = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
                    }
            }
            
            // Apply animation if we found a matching key
            if (keyElement) {
                keyElement.classList.add('active');
                // Remove element after 100 milliseconds (simulating the 'click')
                setTimeout(() => keyElement.classList.remove('active'), 100);
            }
        }
    });
});

// Listen for chat messages from server
socket.on('chat message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

// Optional: Display connection/disconnection notifications
socket.on('user connected', () => {
    const item = document.createElement('li');
    item.textContent = 'A user has joined the chat';
    item.className = 'system-message';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('user disconnected', () => {
    const item = document.createElement('li');
    item.textContent = 'A user has left the chat';
    item.className = 'system-message';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

// Add room joining functionality
function joinRoom(roomName) {
    currentRoom = roomName;
    socket.emit('join room', roomName);
    // Clear messages when joining new room
    messages.innerHTML = '';
    // Add room indicator message
    const item = document.createElement('li');
    item.textContent = `You joined room: ${roomName}`;
    item.className = 'system-message';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
}

// (Temporary) If someone puts a room name, override the name instead
document.getElementById('joinRoomBtn').addEventListener('click', () => {
    const roomInput = document.getElementById('room-input');
    const newRoom = roomInput.value.trim();
    if (newRoom) {
        joinRoom(newRoom);
        roomInput.value = '';
    }
});