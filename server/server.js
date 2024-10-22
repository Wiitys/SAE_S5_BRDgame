const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

//le code est à insérer ici


server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});