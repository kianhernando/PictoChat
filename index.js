const socket = io();
const usernameInput = document.getElementById('username-input');
const roomButtons = document.querySelectorAll('.room-btn');

// Clear whenever we reload the page
window.addEventListener('load', () => {
    usernameInput.value = '';
    localStorage.removeItem('username');
    localStorage.removeItem('room');
});

// Prevent joining room before first putting a username
usernameInput.addEventListener('input', () => {
    const username = usernameInput.value.trim();
    roomButtons.forEach(btn => {
        btn.disabled = username.length === 0;
    });
});

// Room button handler
roomButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        const room = btn.dataset.room;
        
        if (username) {
            // Get from local storage to use when we process the room
            localStorage.setItem('username', username);
            localStorage.setItem('room', room);
            // Redirect to chat page
            window.location.href = '/chat.html';
        }
    });
}); 