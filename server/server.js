const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
var players = [];
const path = require('path');

// Remonter d'un niveau avec '..' pour accéder au dossier 'Dev'
app.use(express.static(path.join(__dirname, '..', 'Dev')));

// Fallback pour index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Dev', 'index.html'));
});

const ioServer = new socketIO.Server(server, {
    cors: {
      origin: "http://localhost:8000",
      methods: ["GET", "POST"],
      credentials: true //cookies?
    }
  });

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

ioServer.on('connection', (socket) => {

    players.push({ x: 100, y: 100, id: socket.id});

    console.log(`A player connected: ${socket.id}`);

    socket.on('updatePlayers', function(data){
        for(player of players) {
            if(player.id == socket.id) {
                player.x = data.x;
                player.y = data.y;
            }
        }
        socket.emit('updatePlayers', players);
    })

    socket.on('disconnect', function() {
        var count = 0;
        for (player of players) {
            if(player.id == socket.id) {
                players.splice(count, 1);
                break;
            }
            count++;
        }
    })
});

