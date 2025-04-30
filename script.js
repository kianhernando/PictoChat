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
const drawModeToggle = document.getElementById('draw-mode-toggle');
const keyboardContainer = document.getElementById('keyboard-container');
const drawingSection = document.querySelector('.drawing-section');
const sendDrawingBtn = document.getElementById('send-drawing');
const canvas = document.getElementById('canvas');
// Set willReadFrequently to true for better performance
const context = canvas.getContext('2d', { willReadFrequently: true });

// Socket connection event handlers
socket.on('connect', () => {});

socket.on('connect_error', (error) => {});

socket.on('disconnect', (reason) => {});

// Test socket connection
function testSocketConnection() {
    socket.emit('chat message', '[System] Testing connection...', (error) => {});
}

// Call test immediately after connection
socket.on('connect', testSocketConnection);

// Test socket connection every 5 seconds if not connected
setInterval(() => {
    if (!socket.connected) {
        socket.connect();
    }
}, 5000);

let username = '';
let isCaps = false;
let isShift = false;
let isDrawMode = false;
let marker = "rgb(0,0,0)";
let markerWidth = 1;
let lastEvent;
let mouseDown = false;

// Mode switching functionality
drawModeToggle.addEventListener('click', () => {
    isDrawMode = !isDrawMode;
    drawModeToggle.classList.toggle('active');
    keyboardContainer.style.display = isDrawMode ? 'none' : 'flex';
    drawingSection.style.display = isDrawMode ? 'block' : 'none';
});

input.disabled = true;
input.placeholder = 'Please enter your username first!';
input.style.cursor = 'not-allowed';

function setUsername(name) {
    username = name;
    input.disabled = false;
    input.placeholder = 'Type a message...';
    input.style.cursor = 'text';
}

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!username) {
        alert('Please enter your username first!');
        return;
    }
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

// Listen for drawing messages
socket.on('drawing message', (data) => {
    const item = document.createElement('li');
    item.classList.add('drawing-message');
    
    // Add username
    const usernameText = document.createElement('div');
    usernameText.classList.add('username');
    usernameText.textContent = `[${data.username}]`;
    item.appendChild(usernameText);
    
    // Add drawing
    const img = document.createElement('img');
    img.src = data.drawing;
    img.onload = () => {
        messages.scrollTop = messages.scrollHeight;
    };
    item.appendChild(img);
    
    messages.appendChild(item);
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

// Drawing event listeners
canvas.addEventListener('mousedown', function(e) {
    if (!isDrawMode) return;
    lastEvent = e;
    mouseDown = true;
});

canvas.addEventListener('mousemove', function(e) {
    if (!isDrawMode || !mouseDown) return;
    context.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    context.moveTo(lastEvent.clientX - rect.left, lastEvent.clientY - rect.top);
    context.lineTo(x, y);
    context.lineWidth = markerWidth;
    context.strokeStyle = marker;
    context.lineCap = 'round';
    context.stroke();
    lastEvent = e;
});

canvas.addEventListener('mouseup', function() {
    mouseDown = false;
});

canvas.addEventListener('mouseleave', function() {
    mouseDown = false;
});

// Change marker width
document.getElementById('marker').addEventListener('change', function() {
    markerWidth = this.value;
});

// Clear canvas
document.getElementById('clear').addEventListener('click', function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
});

// Send drawing functionality
sendDrawingBtn.addEventListener('click', () => {
    if (!username) {
        alert('Please enter your username first!');
        return;
    }

    try {
        // Check if canvas is empty
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const isEmpty = imageData.every(pixel => pixel === 0);
        
        if (isEmpty) {
            alert('Please draw something before sending!');
            return;
        }
        
        // Convert canvas to image data and send
        const drawingData = canvas.toDataURL('image/png');
        socket.emit('drawing message', {
            username: username,
            drawing: drawingData
        });
        
        // Clear canvas after sending
        context.clearRect(0, 0, canvas.width, canvas.height);
    } catch (error) {
        alert('Error sending drawing. Please try again.');
    }
});