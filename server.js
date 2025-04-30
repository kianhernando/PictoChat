const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // 100MB max buffer
});

// Serve static files from the current directory
app.use(express.static('.'));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Socket.io connection handling
io.on('connection', (socket) => {
    // Notify others that a user connected
    socket.broadcast.emit('user connected');
    
    // Handle chat messages
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    // Handle drawing messages
    socket.on('drawing message', (data) => {
        try {
            if (!data.drawing.startsWith('data:image')) {
                return;
            }
            io.emit('drawing message', {
                username: data.username,
                drawing: data.drawing
            });
        } catch (error) {
            // Error handling without logging
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        io.emit('user disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {}); 