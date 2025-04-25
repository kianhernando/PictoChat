// Connect to Socket.io server
const socket = io();

// DOM elements
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const startBtn = document.getElementById('startBtn');

let username = '';

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
