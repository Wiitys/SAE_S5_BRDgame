const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const path = require('path');
const fs = require('fs');


var players = [];
var farmables = [];
let farmableCounter = 0;
var drops = [];
let dropCounter = 0;
var projectiles = [];
let projectileCounter = 0
var enemies = []
let enemyCounter = 0

// Configuration des farmables
const FARMABLE_TYPES = ["tree", "rock"];
const FARMABLE_RESPAWN_TIME = 5000; // Temps de réapparition en millisecondes

const ENEMY_RESPAWN_TIME = 5000;

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
    },
    transports: ['polling', 'websocket']
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});

createInitialFarmables()
loadFarmablesFromMap()
loadMonsterSpawns()
//createEnemy(0, 0, undefined,'neutral', undefined, 100, 200)
createEnemy(0, 0, 'boss','aggressive', undefined, 200, 300)

ioServer.on('connection', (socket) => {
    
    players.push({ x: 0, y: 0, id: socket.id, inGame: false, hp: 0, lastDirection: "down"});
    
    console.log(`A player connected: ${socket.id}`);
    
    socket.on('updatePlayers', function(data){
        for(player of players) {
            if(player.id == socket.id) {
                player.x = data.x;
                player.y = data.y;
                player.hp = data.hp;
            }

            if(player.hp <= 0) {
                player.inGame = false;
            } else {
                player.inGame = true;
            }
        }
        socket.emit('updatePlayers', players);
    })

    socket.on("playerDirectionChanged", (data) => {
        const { id, lastDirection } = data;

        // Met à jour la direction du joueur sur le serveur
        if (players[id]) {
            players[id].lastDirection = lastDirection;
        }

        // Diffuse aux autres joueurs
        socket.broadcast.emit("updatePlayerDirection", { id, lastDirection });
    });
    
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
    
    socket.on('requestEnemies', () => {
        socket.emit('enemyList', enemies);
    });

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

    /// Émettre la liste des drops à tous les joueurs
    socket.on('requestDrops', () => {
        socket.emit('dropList', drops);
    });
    
    socket.on('createDrop', (drop) => {
        createDrop(drop.category, drop.type, drop.quantity, drop.x, drop.y);
        console.log(`create drop ${drop.quantity}`)
    });

    socket.on('collectDrop', (dropId) => {
        const index = drops.findIndex(drop => drop.id === dropId);
        if (index !== -1) {
            const drop = drops.splice(index, 1)[0];
            console.log(`drop collected: ${dropId}`);
            
            // Informer tous les clients de la destruction
            ioServer.emit('dropCollected', dropId);
        }
    });

    // Création d'un projectile
    socket.on('createProjectile', (projectile) => {
        createProjectile(projectile.x, projectile.y, projectile.targetX, projectile.targetY, projectile.speed, projectile.rotation, projectile.ownerId, projectile.attackDamageEntities)
    });

    socket.on('projectileHit', (data) => {
        const { projectileId, targetId, targetType } = data; // `targetType` est soit "player" soit "enemy"
        // Vérifier si le projectile est encore actif
        const projectile = projectiles.find(proj => proj.id === projectileId);
        if (projectile) {
            if (targetType === 'player') {
                // Appliquer les dégâts au joueur
                const targetPlayer = players.find(player => player.id === targetId);
                if (targetPlayer) {
                    ioServer.emit('playerHit', { targetId, damage: projectile.attackDamageEntities });
                }
            }

            if (targetType === 'enemy') {
                // Appliquer les dégâts à l'ennemi
                const index = enemies.findIndex(enemy => enemy.id === targetId);
                if (enemies[index]) {
                    enemies[index].hp -= projectile.attackDamageEntities;
                    if(players.find(player => player.id === projectile.ownerId)){
                        enemies[index].isHit = true;
                        setTimeout(() => {
                            if(enemies[index] && enemies[index].id == targetId){
                                enemies[index].isHit = false;
                                enemies[index].isPatrolling = true
                            }
                        }, enemies[index].actionDelay*3);
                    }
                    if(enemies[index].hp <= 0){
                        destroyEnemy(index)
                    }
                }
            }
        }
    });

    
});

function generateUniqueProjectileId() {
    return `projectile-${projectileCounter++}`;
}

function generateUniqueFarmableId() {
    return `farmable-${farmableCounter++}`; // Générer un ID unique basé sur un compteur
}

function generateUniqueDropId() {
    return `drop-${dropCounter++}`; // Générer un ID unique basé sur un compteur
}

function generateUniqueEnemyId() {
    return `enemy-${enemyCounter++}`; // Générer un ID unique basé sur un compteur
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

function loadFarmablesFromMap() {
    // Charger la carte JSON (Tiled exporté)
    const mapData = JSON.parse(fs.readFileSync('map.json', 'utf8'));
    console.log('Carte Tiled chargée :', mapData);  // Affichage de la carte complète pour le débogage

    const farmablesFromMap = [];

    // Accéder à la couche des objets (nom de la couche dans Tiled : 'Farmables')
    const objectLayer = mapData.layers.find(layer => layer.name === 'Farmables');
    if (objectLayer) {
        
        objectLayer.objects.forEach(obj => {
            const farmableType = obj.properties.find(prop => prop.name === 'type')?.value || 'default';

            const farmable = {
                id: generateUniqueFarmableId(),
                type: farmableType, 
                x: obj.x,        
                y: obj.y,        
                hp: 10            
            };

            // Ajouter à la liste des farmables
            farmablesFromMap.push(farmable);
       });
    } else {
        console.log('La couche "Farmables" est introuvable dans la carte.');
    }

    // Ajouter les farmables extraits à la liste globale
    farmables.push(...farmablesFromMap);
}


function destroyFarmable(farmableId, index){
    const farmable = farmables.splice(index, 1)[0];
    console.log(`Farmable destroyed: ${farmableId}`);
    
    // Informer tous les clients de la destruction
    ioServer.emit('farmableDestroyed', farmableId);
    
    // Réapparition après un délai
    setTimeout(() => {
        createFarmable(farmable.type, farmable.x, farmable.y);
    }, FARMABLE_RESPAWN_TIME);
}

function destroyEnemy(index){
    // Informer tous les clients de la destruction
    ioServer.emit('enemyDied', enemies[index].id);
    const enemy = enemies.splice(index, 1)[0];
    console.log(enemy)
    // Réapparition après un délai
    setTimeout(() => {
        createEnemy(enemy.spawnX, enemy.spawnY, enemy.type, enemy.behavior, enemy.maxHp, enemy.attackRange, enemy.searchRange, enemy.actionDelay);
    }, ENEMY_RESPAWN_TIME);
}

// Fonction pour créer une drop
function createDrop(category, type, quantity, x, y) {
    const drop = { id: generateUniqueDropId(), category: category, type: type, quantity: quantity, x: x, y: y };
    drops.push(drop);
    ioServer.emit('dropCreated', drop);
}

function createProjectile(x,y,targetX,targetY,speed,rotation,ownerId,attackDamageEntities) {
    const projectileData = {
        id: generateUniqueProjectileId(),
        x: x,
        y: y,
        targetX: targetX,
        targetY: targetY,
        speed: speed,
        rotation: rotation,
        ownerId: ownerId,
        attackDamageEntities: attackDamageEntities
    };

    projectiles.push(projectileData);

    ioServer.emit('projectileCreated', projectileData);
}
    function isPositionFree(x, y) {
        const threshold = 32; // Distance minimale entre les entités (en pixels)

        // Vérifier les ennemis existants
        for (const enemy of enemies) {
            const distance = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
            if (distance < threshold) {
                return false; // Position trop proche d'un autre ennemi
            }
        }

        // Vérifier les farmables existants
        for (const farmable of farmables) {
            const distance = Math.sqrt((farmable.x - x) ** 2 + (farmable.y - y) ** 2);
            if (distance < threshold) {
                return false; // Position trop proche d'un farmable
            }
        }

        // Ajouter d'autres vérifications si nécessaire (ex. : obstacles, objets)
        return true; // La position est libre
    }


    function createEnemy(name, x, y, type = 'melee', behavior = 'aggressive', hp = 10, attackRange, searchRange, actionDelay = 3000) {
    enemyData = { 
        id: generateUniqueEnemyId(), 
        name: name,
        x: x, 
        y: y,
        spawnX: x,
        spawnY: y, 
        type: type, 
        behavior: behavior, 
        maxHp: hp,
        hp: hp,     
        target: null,
        attackRange: attackRange,
        maxAttackRange: attackRange*1.33,
        minAttackRange: attackRange*0.66,
        searchRange: searchRange,
        isHit: false,
        isAttacking: false,
        actionDelay: actionDelay,
        patrolPoints: [
            { x: x + 100, y: y },
            { x: x + 100, y: y + 100 },
            { x: x, y: y + 100 },
            { x: x, y: y } // Retour à la position de départ
        ],
        currentPatrolIndex: 0,
        isPatrolling: true
    }

    enemies.push(enemyData);

    ioServer.emit('enemyCreated', enemyData);
}

function createEnemyFromName(mobName, x, y) {
    const mobConfig = {
        Goblin: {
            type: 'melee',
            behavior: 'aggressive',
            hp: 20,
            attackRange: 50,
            searchRange: 150,
            actionDelay: 3000
        },
        Orc: {
            type: 'melee',
            behavior: 'aggressive',
            hp: 50,
            attackRange: 60,
            searchRange: 200,
            actionDelay: 4000
        },
        Archer: {
            type: 'ranged',
            behavior: 'aggressive',
            hp: 15,
            attackRange: 150,
            searchRange: 300,
            actionDelay: 2000
        }
    };

    const mobData = mobConfig[mobName];
    if (!mobData) {
        console.error(`Erreur : aucune configuration trouvée pour le mob "${mobName}".`);
        return;
    }

    createEnemy(mobName, x, y, mobData.type, mobData.behavior, mobData.hp, mobData.attackRange, mobData.searchRange, mobData.actionDelay);
}

function loadMonsterSpawns() {
    const mapData = JSON.parse(fs.readFileSync('map.json', 'utf8'));
    console.log('Carte Tiled chargée pour les spawns de monstres :', mapData);

    // Trouver la couche "MonsterSpawns"
    const spawnLayer = mapData.layers.find(layer => layer.name === 'MonsterSpawns');

    if (spawnLayer) {
        console.log('Layer "MonsterSpawns" trouvée:', spawnLayer);

        spawnLayer.objects.forEach(obj => {
            const mobName = obj.name; // Le nom du mob (ex : "Goblin", "Orc", etc.)
            const spawnCount = obj.properties.find(prop => prop.name === 'spawnCount')?.value || 1;

            console.log(`Zone de spawn pour le mob : ${mobName}, spawnCount=${spawnCount}, zone=(${obj.x}, ${obj.y}, ${obj.width}, ${obj.height})`);

            // Vérifier si le mobName est valide avant de continuer
            if (!mobName) {
                console.error(`Erreur : aucun nom de mob défini pour l'objet de la zone (${obj.x}, ${obj.y}).`);
                return;
            }

            // Créer plusieurs ennemis aléatoirement dans la zone
            for (let i = 0; i < spawnCount; i++) {
                let attempts = 0;
                let maxAttempts = 10; // Nombre maximum de tentatives pour trouver une position disponible
                let validPosition = false;

                while (!validPosition && attempts < maxAttempts) {
                    const randomX = obj.x + Math.random() * obj.width;
                    const randomY = obj.y + Math.random() * obj.height;

                    // Vérifier si la position est libre
                    if (isPositionFree(randomX, randomY)) {
                        console.log(`Position libre trouvée pour un ${mobName} : (${randomX}, ${randomY})`);
                        createEnemyFromName(mobName, randomX, randomY);
                        validPosition = true;
                    } else {
                        console.log(`Position occupée à (${randomX}, ${randomY}), nouvelle tentative...`);
                        attempts++;
                    }
                }

                if (!validPosition) {
                    console.warn(`Impossible de trouver une position libre pour un ${mobName} après ${maxAttempts} tentatives.`);
                }
            }
        });
    } else {
        console.log('La couche "MonsterSpawns" est introuvable dans la carte.');
    }
}



function updateEnemies() {
    for (const id in enemies) {
        const enemy = enemies[id];
        
        // Logique d'intelligence ennemie ici (ex: poursuite du joueur)
        if (enemy.target && enemy.target.hp > 0) {
            if(enemy.type != "boss"){
                switch (enemy.behavior){
                    case 'aggressive':
                        aggressiveBehavior(enemy);
                        break;
                    case 'neutral':
                        neutralBehavior(enemy);
                        break;
                    case 'passive':
                        passiveBehavior(enemy);
                        break;
                    default:
                        break;
                }
            } else {
                bossBehavior(enemy)
            }
        }
    }
    ioServer.emit('updateEnemies', enemies); // Synchronise les ennemis avec tous les clients
}

setInterval(updateEnemies, 1000 / 60); // 60 updates par 1 seconde (60fps)

function updateEnemyTargets(enemies, players) {
    enemies.forEach(enemy => {
        let closestPlayer = null;
        let closestDistance = Infinity;

        if (isNaN(enemy.x) || isNaN(enemy.y)) {
            console.error(`Erreur : les coordonnées de l’ennemi sont NaN`, enemy);
            enemy.x = 0; // Valeur de secours
            enemy.y = 0;
        }
        players.forEach(player => {
            
            if(player.inGame){
                const distance = Math.sqrt(
                    Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
                );

                if (distance < closestDistance) {
                    closestPlayer = player;
                    closestDistance = distance;
                }
            }
        });
        enemy.target = closestPlayer ? closestPlayer : null;
    });
}

setInterval(() => {
    updateEnemyTargets(enemies, players);

    enemies.forEach(enemy => {
        if(enemy.target){
            ioServer.emit('updateEnemyTarget', {
                id: enemy.id,
                targetId: enemy.target.id
            });
        }
    });
}, 500);

function bossBehavior(enemy){
    // Calcule la distance entre l'ennemi et le joueur

    let dx = enemy.target.x - enemy.x;
    let dy = enemy.target.y - enemy.y;
    const distanceToTarget = Math.sqrt((dx)**2 + (dy)**2);

    const distanceSpawnToPlayer = Math.sqrt((enemy.target.x - enemy.spawnX)**2 + (enemy.target.y - enemy.spawnY)**2);
    
    if (distanceSpawnToPlayer > enemy.searchRange && !enemy.isHit) {
        //console.log(`joueur sorti de la zone de recherche, retour au point d'apparition`)
        patrol(enemy);
        
    // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
    } else if (distanceToTarget >= enemy.maxAttackRange) {
        enemy.isPatrolling = false;
        
        //console.log("joueur trouvé, poursuite lancée")
        enemy.x += (dx / distanceToTarget) * 1; // Simule un déplacement
        enemy.y += (dy / distanceToTarget) * 1;

    // Arrête l'ennemi s'il est à moins de sa range du joueur
    } else if (distanceToTarget < enemy.maxAttackRange) {
        enemy.isPatrolling = false;
        if (distanceToTarget < enemy.minAttackRange) {
            dx = 0;
            dy = 0;
        }

        enemy.x += (dx / distanceToTarget) * 1; // Simule un déplacement
        enemy.y += (dy / distanceToTarget) * 1;
        
        if (!enemy.isAttacking) {
            enemy.isAttacking = true;
            setTimeout(() => {
                console.log("Code exécuté après x secondes.");
                if(enemy.target && enemy.hp > 0 && !enemy.isPatrolling){
                    console.log('entré dans le if')
                    if(distanceToTarget <= enemy.minAttackRange){
                        //combo melee
                        //shootAround(enemy);
                        console.log('melee')
                        //enemy.isAttacking = false
                    } else if(distanceToTarget <= enemy.AttackRange && distanceToTarget > enemy.minAttackRange) {
                        //tir laser OU charge
                        //shootAround(enemy);
                        console.log('laser')
                        dx = 0;
                        dy = 0;
                        //enemy.isAttacking = false
                    } else if(distanceToTarget <= enemy.maxAttackRange && distanceToTarget > enemy.attackRange){
                        //tir circulaire
                        console.log('shoot')
                        dx = 0;
                        dy = 0;
                        shootAround(enemy);
                    }
                }
            }, enemy.actionDelay);
        }
    }
}

// Lorsque le boss attaque, on crée des projectiles autour de lui
function shootAround(enemy) {
    let offset = 0; // Décalage initial des angles
    let repetitions = 0; // Compteur pour les répétitions de l'attaque

    const shootInterval = setInterval(() => {
        // Angles pour les projectiles autour du boss
        const angles = [
            0 + offset, 
            Math.PI / 4 + offset, 
            Math.PI / 2 + offset, 
            3 * Math.PI / 4 + offset, 
            Math.PI + offset, 
            -3 * Math.PI / 4 + offset, 
            -Math.PI / 2 + offset, 
            -Math.PI / 4 + offset
        ];

        // Créer des projectiles pour chaque angle
        angles.forEach(angle => {
            const targetX = enemy.x + Math.cos(angle) * 300; // Portée du tir
            const targetY = enemy.y + Math.sin(angle) * 300;
            createProjectile(enemy.x, enemy.y, targetX, targetY, 200, 5, enemy.id, 1); // Vitesse 200, dégâts 5
        });

        // Incrémenter le décalage de 0.25 pour alterner entre zones sûres et dangereuses
        offset += Math.PI / 8;

        // Incrémenter le compteur de répétitions
        repetitions++;

        // Arrêter l'attaque après 3 répétitions
        if (repetitions >= 3) {
            clearInterval(shootInterval);
            enemy.isAttacking = false
        }
    }, 1000); // Répéter l'attaque toutes les 0.5 secondes
}


function aggressiveBehavior(enemy){
    // Calcule la distance entre l'ennemi et le joueur

    let dx = enemy.target.x - enemy.x;
    let dy = enemy.target.y - enemy.y;
    const distanceToTarget = Math.sqrt((dx)**2 + (dy)**2);

    const distanceSpawnToPlayer = Math.sqrt((enemy.target.x - enemy.spawnX)**2 + (enemy.target.y - enemy.spawnY)**2);
    
    if (distanceSpawnToPlayer > enemy.searchRange && !enemy.isHit) {
        //console.log(`joueur sorti de la zone de recherche, retour au point d'apparition`)
        patrol(enemy);
        
    // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
    } else if (distanceToTarget >= enemy.attackRange) {
        enemy.isPatrolling = false;
        
        //console.log("joueur trouvé, poursuite lancée")
        enemy.x += (dx / distanceToTarget) * 1; // Simule un déplacement
        enemy.y += (dy / distanceToTarget) * 1;

    // Arrête l'ennemi s'il est à moins de sa range du joueur
    } else if (distanceToTarget < enemy.attackRange) {
        if (distanceToTarget < enemy.minAttackRange) {
            dx = 0
            dy = 0
        }

        enemy.x += (dx / distanceToTarget) * 1; // Simule un déplacement
        enemy.y += (dy / distanceToTarget) * 1;
        if (!enemy.isAttacking) {
            enemy.isAttacking = true;
            setTimeout(() => {
                console.log("Code exécuté après x secondes.");
                if(enemy.target && enemy.hp > 0 && distanceToTarget <= enemy.maxAttackRange && !enemy.isPatrolling){
                    createProjectile(enemy.x, enemy.y, enemy.target.x, enemy.target.y, 100, 0, enemy.id, 5)
                }
                enemy.isAttacking = false
            }, enemy.actionDelay);
        }
    }
}

function neutralBehavior(enemy){
    // Calcule la distance entre l'ennemi et le joueur

    let dx = enemy.target.x - enemy.x;
    let dy = enemy.target.y - enemy.y;
    const distanceToTarget = Math.sqrt((dx)**2 + (dy)**2);

    const distanceSpawnToPlayer = Math.sqrt((enemy.target.x - enemy.spawnX)**2 + (enemy.target.y - enemy.spawnY)**2);
    
    if (!enemy.isHit) {
        //console.log(`joueur sorti de la zone de recherche, retour au point d'apparition`)
        patrol(enemy);
        
    // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
    } else if (distanceToTarget >= enemy.attackRange && enemy.isHit) {
        enemy.isPatrolling = false;
        
        //console.log("joueur trouvé, poursuite lancée")
        enemy.x += (dx / distanceToTarget) * 1; // Simule un déplacement
        enemy.y += (dy / distanceToTarget) * 1;

    // Arrête l'ennemi s'il est à moins de sa range du joueur
    } else if (distanceToTarget < enemy.attackRange && enemy.isHit) {
        if (distanceToTarget < enemy.minAttackRange) {
            dx = 0
            dy = 0
        }

        enemy.x += (dx / distanceToTarget) * 1; // Simule un déplacement
        enemy.y += (dy / distanceToTarget) * 1;
        if (!enemy.isAttacking) {
            enemy.isAttacking = true;
            setTimeout(() => {
                console.log("Code exécuté après x secondes.");
                if(enemy.target && enemy.hp > 0 && distanceToTarget <= enemy.maxAttackRange && !enemy.isPatrolling){
                    createProjectile(enemy.x, enemy.y, enemy.target.x, enemy.target.y, 100, 0, enemy.id, 5)
                }
                enemy.isAttacking = false
            }, enemy.actionDelay);
        }
    }
}

function passiveBehavior(enemy){
    // Calcule la distance entre l'ennemi et le joueur
    let timeoutSet = false;
    let dx = enemy.x - enemy.target.x;
    let dy = enemy.y - enemy.target.y;
    const distanceToTarget = Math.sqrt((dx)**2 + (dy)**2);

    if (!enemy.isHit) {
        patrol(enemy);
        
    // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
    } else {
        console.log('cc')
        enemy.isPatrolling = false;
        enemy.x += (dx / distanceToTarget) * 1; // Simule un déplacement
        enemy.y += (dy / distanceToTarget) * 1;
    }
}

function patrol(enemy) {
    if (!enemy.isPatrolling) {
        enemy.isPatrolling = true;
    }

    const targetPoint = enemy.patrolPoints[enemy.currentPatrolIndex];
    let dx = targetPoint.x - enemy.x;
    let dy = targetPoint.y - enemy.y;
    const distanceToTargetPoint = Math.sqrt((dx)**2 + (dy)**2);
    enemy.x += (dx / distanceToTargetPoint) * 1; // Simule un déplacement
    enemy.y += (dy / distanceToTargetPoint) * 1;

    // Vérifie si l'ennemi a atteint le point de patrouille
    if (distanceToTargetPoint < 5) {
        // Passe au point de patrouille suivant
        enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length;
    }
}