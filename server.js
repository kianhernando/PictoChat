const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    maxHttpBufferSize: 1e8
});
const fs = require('fs');
const path = require('path');
const db = require('./db');

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
  socket.on('joinRoom', async ({username, room }) => {
    console.log('JoinRoom:', username, room);
    if (!['A', 'B', 'C', 'D'].includes(room)) {
      return;
    }
    
    try {
      // insert user if not already present
      await db.query(`insert ignore into users (username) values (?)`, [username]);
      const [[userRow]] = await db.query(`select id from users where username = ?`, [username]);
      const [[roomRow]] = await db.query(`select id from rooms where name = ?`, [room]);

      if (!userRow || !roomRow) {
        console.warn('Invalid user or room');
        return;
      }

      // save to socket
      socket.user_id = userRow.id;
      socket.room_id = roomRow.id;
      socket.username = username;
      socket.room = room;

      // join room as well as inform all users that someone has joined
      socket.join(room);
      io.to(room).emit('user connected', `${username} has joined the chat`);
    } catch (err) {
      console.error('joinRoom error:', err);
    }
  });
  
  // Message emitter
  socket.on('message', async (data) => {
    console.log("SERVER RECEIVED:", data);
    if (socket.room && socket.user_id && socket.room_id) {
      console.log("EMITTING TO ROOM:", socket.room);
      io.to(socket.room).emit('message', {
        sender: data.sender,
        message: data.message
      });

      try{
        // set time to local time rather than UTC
        const now = new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles'}).replace(' ', 'T');
        // save to db
        await db.query(
          `insert into messages (user_id, room_id, type, payload, created_on)
          values (?, ?, ?, ?, ?)`,
          [socket.user_id, socket.room_id, 1, data.message, now]
        );
      } catch (err) {
        console.error("Failed to save message:", err);
      }
    } else {
      console.warn("Missing socket.room, user_id, or room_id");
    }
  });

  // Drawing emitter
  socket.on('drawing message', async (buffer) => {
    if (socket.room && socket.user_id && socket.room_id) {
      // save image to file in 'drawings' folder
      try {
        const fileName = `drawing_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
        const filePath = path.join(__dirname, 'drawings', fileName);
        const publicUrl = `/drawings/${fileName}`;

        // save binary buffer to file
        fs.writeFileSync(filePath, Buffer.from(buffer));  // write binary image

        // emit to others in the room
        io.to(socket.room).emit('drawing message', {
          username: socket.username,
          drawing: publicUrl
        });

        // set time to local time rather than UTC
        const now = new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles'}).replace(' ', 'T');
        // save to db
        await db.query(
          `insert into messages (user_id, room_id, type, payload, created_on)
          values (?, ?, ?, ?, ?)`,
          [socket.user_id, socket.room_id, 2, publicUrl, now]
        );
      } catch (err) {
        console.error("Failed to save drawing:", err);
      }
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