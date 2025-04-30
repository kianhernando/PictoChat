const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Serve static files from the current directory
app.use(express.static('.'));

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Handle joining a room
  socket.on('join room', (room) => {
    // Notify previous room that user left
    if (socket.room) {
      socket.to(socket.room).emit('user disconnected', 'A user has left the chat');
      socket.leave(socket.room);
    }
    
    socket.room = room;
    socket.join(room);
    
    // Notify new room that a user joined
    socket.to(room).emit('user connected', `A user joined room ${room}`);
  });
  
  // Handle chat messages
  socket.on('chat message', (chat) => {
    // Send message only to users in the same room, using parameter
    io.to(chat.room).emit('chat message', chat.message);
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (socket.room) {
      socket.to(socket.room).emit('user disconnected', 'A user has left the chat');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
}); 