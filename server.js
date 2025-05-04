const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    maxHttpBufferSize: 1e8
});

// Serve static files from the current directory
app.use(express.static('.'));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Error handling in case of an error; not allowing rooms A, B, C or D
  socket.on('joinRoom', (roomName) => {
    if (!['A', 'B', 'C', 'D'].includes(roomName)) {
      return;
    }
    
    // Join the roomName as well as informing all users that someone joined
    socket.room = roomName;
    socket.join(roomName);
    io.to(roomName).emit('user connected', 'A user has joined the chat');
  });
  
  // Message emitter
  socket.on('message', (data) => {
    if (socket.room) {
      io.to(socket.room).emit('message', {
        sender: data.sender,
        message: data.message
      });
    }
  });

  // Drawing emitter
  socket.on('drawing message', (data) => {
    if (socket.room) {
      io.to(socket.room).emit('drawing message', data);
    }
  });
  
  // Disconnect emitter
  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (socket.room) {
      socket.to(socket.room).emit('user disconnected', 'A user has left the chat');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {}); 