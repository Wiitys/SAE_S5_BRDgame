const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const path = require('path');

var players = [];
var farmables = [];
let farmableCounter = 0;

// Configuration des farmables
const FARMABLE_TYPES = ["tree", "rock"];
const FARMABLE_RESPAWN_TIME = 5000; // Temps de réapparition en millisecondes

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

createInitialFarmables()

ioServer.on('connection', (socket) => {

    players.push({ x: 0, y: 0, id: socket.id});

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

    /// Émettre la liste des farmables à tous les joueurs
    socket.on('requestFarmables', () => {
        socket.emit('farmableList', farmables);
    });

    socket.on('destroyFarmable', (farmableId) => {
        const index = farmables.findIndex(farmable => farmable.id === farmableId);
        if (index !== -1) {
            const farmable = farmables.splice(index, 1)[0];
            console.log(`Farmable destroyed: ${farmableId}`);

            // Informer tous les clients de la destruction
            ioServer.emit('farmableDestroyed', farmableId);

            // Réapparition après un délai
            setTimeout(() => {
                createFarmable(farmable.type, farmable.x, farmable.y);
            }, 10000); // délai de 10 secondes
        }
    });
});

function generateUniqueId() {
    return `farmable-${farmableCounter++}`; // Générer un ID unique basé sur un compteur
}

// Fonction pour créer un farmable
function createFarmable(type, x, y) {
    const farmableId = generateUniqueId(); // Fonction pour générer un ID unique
    const farmable = { id: farmableId, type: type, x: x, y: y };
    farmables.push(farmable);
    ioServer.emit('farmableCreated', farmable);
}

function createInitialFarmables() {
    farmables.push({ id: generateUniqueId(), type: "tree", x: 200, y: 200 });
    farmables.push({ id: generateUniqueId(), type: "rock", x: 300, y: 300 });
}