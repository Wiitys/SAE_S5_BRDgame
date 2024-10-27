const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const path = require('path');

var players = [];
var farmables = [];
let farmableCounter = 0;
var resources = [];
let resourceCounter = 0;

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
    
    socket.on('hitFarmable', (farmableId) => {
        const index = farmables.findIndex(farmable => farmable.id === farmableId);
        if (index !== -1) {
            farmables[index].hp--;
            
            // Informer tous les clients de la destruction
            ioServer.emit('farmableHit', farmableId);
            
            if(farmables[index].hp == 0){
                destroyFarmable(farmableId, index)
            }
        }
    });

    socket.on('createResource', (resource) => {
        createResource(resource.type, resource.x, resource.y);
        console.log('create resource')
    });

    socket.on('collectResource', (resourceId) => {
        const index = resources.findIndex(resource => resource.id === resourceId);
        if (index !== -1) {
            const resource = resources.splice(index, 1)[0];
            console.log(`Resource collected: ${resourceId}`);
            
            // Informer tous les clients de la destruction
            ioServer.emit('resourceCollected', resourceId);
        }
    });
});

function generateUniqueFarmableId() {
    return `farmable-${farmableCounter++}`; // Générer un ID unique basé sur un compteur
}

function generateUniqueResourceId() {
    return `resource-${resourceCounter++}`; // Générer un ID unique basé sur un compteur
}

// Fonction pour créer un farmable
function createFarmable(type, x, y) {
    const farmable = { id: generateUniqueFarmableId(), type: type, x: x, y: y, hp: 10 };
    farmables.push(farmable);
    ioServer.emit('farmableCreated', farmable);
}

function createInitialFarmables() {
    farmables.push({ id: generateUniqueFarmableId(), type: "tree", x: 200, y: 200, hp: 10 });
    farmables.push({ id: generateUniqueFarmableId(), type: "rock", x: 300, y: 300, hp: 10 });
}

function destroyFarmable(farmableId, index){
    const farmable = farmables.splice(index, 1)[0];
    console.log(`Farmable destroyed: ${farmableId}`);
    
    // Informer tous les clients de la destruction
    ioServer.emit('farmableDestroyed', farmableId);
    
    // Réapparition après un délai
    setTimeout(() => {
        createFarmable(farmable.type, farmable.x, farmable.y);
    }, 10000); // délai de 10 secondes
}

// Fonction pour créer une ressource
function createResource(type, x, y) {
    const ressource = { id: generateUniqueResourceId(), type: type, x: x, y: y };
    resources.push(ressource);
    ioServer.emit('resourceCreated', ressource);
}