const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mysql = require('mysql2'); // Import du module MySQL
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

// Middleware pour le JSON
app.use(express.json());

// Fallback pour index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Dev', 'index.html'));
});

// Configuration de la base de données
const db = mysql.createConnection({
    host: 'db', // Nom du conteneur Docker pour MySQL
    user: 'root',
    password: 'SAE_BRDGame',
    database: 'game_database',
});

connectToDatabase();

// Fonction pour tenter la connexion à la base de données
function connectToDatabase(retries = 5, delay = 5000) {
    db.promise().connect()
        .then(() => {
            console.log('Connecté à la base de données MySQL');
            // Récupération des données
            getFarmables();
            getCraftables();
            getEnemies();
            getRessources();
            getTools();
            getArmours();
        })
        .catch((err) => {
            console.error('Erreur de connexion à la base de données :', err);

            // Si des tentatives sont encore possibles, on réessaye
            if (retries > 0) {
                console.log(`Nouvelle tentative dans ${delay / 1000} secondes... (${retries} essais restants)`);
                setTimeout(() => connectToDatabase(retries - 1, delay), delay);
            } else {
                console.error('Impossible de se connecter après plusieurs tentatives. Arrêt.');
            }
        });
}

// Fonction générique pour exécuter des requêtes
function queryDatabase(query) {
    return new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if (err) {
                console.error('Erreur lors de la requete :', err);
                reject(err); // Rejeter la promesse en cas d'erreur
            } else {
                resolve(results); // Résoudre la promesse avec les résultats
            }
        });
    });
}

let farmablesData = {};
let craftablesData = {};
let enemiesData = {};
let armoursData = {};
let ressourcesData = {};
let toolsData = {};

async function getRessources() {
    try {
        const results = await queryDatabase(`
            SELECT 
                r.id_ressource,
                r.name_ressource,
                r.category,
                r.value_food
            FROM 
                Ressources r;
        `);

        results.forEach(ressource => {
            const { id_ressource, name_ressource, category, value_food } = ressource;

            ressourcesData[id_ressource] = {
                name: name_ressource,
                category : category,
                valueFood: value_food
            };
        });

        console.log(ressourcesData);

        return ressourcesData;
    } catch (error) {
        console.error('Error fetching resources:', error);
    }
}

async function getEnemies() {
    try {
        const results = await queryDatabase(`
            SELECT 
                e.name_enemy,
                e.healthPoints AS hp,
                e.type,
                e.behavior,
                e.attackRange,
                e.searchRange,
                e.actionDelay,
                r.category AS dropCategory,
                r.name_ressource AS dropType,
                r.value_food AS dropValue
            FROM 
                Enemies e
            JOIN 
                dropTypeMobs dtm ON e.id_enemy = dtm.id_enemy    
            LEFT JOIN 
                Ressources r ON dtm.id_ressource = r.id_ressource;
        `);

        results.forEach(enemy => {
            const { name_enemy, hp, type, behavior, attackRange, searchRange, actionDelay, dropCategory, dropType, dropValue } = enemy;
            if(!enemiesData[name_enemy]){
                enemiesData[name_enemy] = {
                    hp : hp,
                    type : type,
                    behavior : behavior,
                    attackRange : attackRange,
                    searchRange : searchRange,
                    actionDelay : actionDelay,
                    drops: []
                };
            }
            
            enemiesData[name_enemy].drops.push({ dropType, dropCategory, dropValue });
        });

        console.log(enemiesData);

        return enemiesData;
    } catch (error) {
        console.error('Error fetching enemies:', error);
    }
}


async function getFarmables() {
    try {
        // Attendre que la promesse renvoyée par queryDatabase se résolve
        const results = await queryDatabase(`
            SELECT 
                f.id_farmable,
                f.type, 
                f.healthPoints as hp,
                r.category as dropCategory,  
                r.name_ressource as dropType,
                r.value_food as dropValue
            FROM 
                Farmables f
            JOIN 
                dropTypeFarm dtf ON f.id_farmable = dtf.id_farmable
            JOIN 
                Ressources r ON dtf.id_ressource = r.id_ressource;
        `);

        // Parcours des résultats et regroupement des données
        results.forEach(farmable => {
            const { id_farmable, type, hp, dropType, dropCategory, dropValue } = farmable;

            // Si le farmable n'existe pas encore dans farmablesData, on le crée
            if (!farmablesData[id_farmable]) {
                farmablesData[id_farmable] = {
                    type: type,
                    hp: hp,
                    drops: []  // Tableau pour contenir les drops
                };
            }

            // Ajouter le drop au tableau "drops" pour ce farmable
            farmablesData[id_farmable].drops.push({ dropType, dropCategory, dropValue });
        });

        console.log(farmablesData);

        createInitialFarmables()
    } catch (err) {
        console.error('Erreur lors de la récupération des farmables :', err);
    }
}

async function getCraftables() {
    try {
        // Attendre que la promesse renvoyée par queryDatabase se résolve
        const results = await queryDatabase(`
            SELECT 
                c.id_craft AS id,
                CASE
                    WHEN t.name_tool IS NOT NULL THEN 'Tool'
                    WHEN a.name_armour IS NOT NULL THEN 'Armour'
                    ELSE 'Ressource'
                END AS category,
                c.name_craft AS name,
                c.quantity_out AS quantity_out,
                CONCAT(
                    '{',
                    GROUP_CONCAT(
                        CASE
                            WHEN cr.name_ressource IS NOT NULL THEN 
                                CONCAT(cr.name_ressource, ': ', cr_c.quantity_needed)
                            ELSE NULL
                        END
                        SEPARATOR ', '
                    ),
                    IF(
                        EXISTS (
                            SELECT 1
                            FROM CraftToolWithTool sub_ctwt
                            WHERE sub_ctwt.id_craft = c.id_craft
                        ),
                        CONCAT(', ',
                            GROUP_CONCAT(
                                CASE
                                    WHEN t_c.name_tool IS NOT NULL THEN 
                                        CONCAT(t_c.name_tool, ': ', ctwt.quantity_needed)
                                    ELSE NULL
                                END
                                SEPARATOR ', '
                            )
                        ),
                        ''
                    ),
                    IF(
                        EXISTS (
                            SELECT 1
                            FROM CraftArmourWithArmour sub_cawa
                            WHERE sub_cawa.id_craft = c.id_craft
                        ),
                        CONCAT(', ',
                            GROUP_CONCAT(
                                CASE
                                    WHEN a_c.name_armour IS NOT NULL THEN 
                                        CONCAT(a_c.name_armour, ': ', cawa.quantity_needed)
                                    ELSE NULL
                                END
                                SEPARATOR ', '
                            )
                        ),
                        ''
                    ),
                    '}'
                ) AS recipe
            FROM Crafts c
            LEFT JOIN CraftRessources cr_c ON c.id_craft = cr_c.id_craft
            LEFT JOIN Ressources cr ON cr_c.id_ressource = cr.id_ressource
            LEFT JOIN Ressources r ON c.id_craft = r.id_ressource
            LEFT JOIN CraftToolWithTool ctwt ON c.id_craft = ctwt.id_craft
            LEFT JOIN Tools t ON c.id_craft = t.id_craft AND t.is_craftable = TRUE
            LEFT JOIN Tools t_c ON t_c.id_tool = ctwt.id_tool AND t.is_craftable = TRUE
            LEFT JOIN CraftArmourWithArmour cawa ON cawa.id_craft = c.id_craft
            LEFT JOIN Armour a ON c.id_craft = a.id_craft AND a.is_craftable = TRUE
            LEFT JOIN Armour a_c ON a_c.id_armour = cawa.id_armour AND a_c.is_craftable = TRUE
            GROUP BY c.id_craft, category, c.name_craft, c.quantity_out
            HAVING recipe IS NOT NULL;
        `);

        // Parcours des résultats et regroupement des données
        results.forEach(craftable => {
            const { id, category, name, quantity_out, recipe } = craftable;

            // Si le farmable n'existe pas encore dans craftablesData, on le crée
            if (!craftablesData[name]) {
                craftablesData[name] = {
                    category: category,
                    type: name,
                    quantity: quantity_out,
                    recipe: recipe
                };
            }
        });

        console.log(craftablesData);

    } catch (err) {
        console.error('Erreur lors de la récupération des craftables :', err);
    }
}


async function getTools() {
    try {
        const results = await queryDatabase(`
            SELECT 
                t.id_tool,
                t.name_tool,
                t.is_craftable,
                t.range_tool,
                t.angle,
                t.farmableDamage,
                t.attackDamage,
                c.id_craft
            FROM 
                Tools t
            JOIN 
                Crafts c ON t.id_craft = c.id_craft;
        `);

        results.forEach(tool => {
            const { id_tool, name_tool, is_craftable, range_tool, angle, farmableDamage, attackDamage, id_craft } = tool;

            toolsData[id_tool] = {
                name: name_tool,
                isCraftable: is_craftable,
                rangeTool: range_tool,
                angle : angle,
                farmableDamage : farmableDamage,
                attackDamage : attackDamage,
                craftId: id_craft
            };
        });

        console.log(toolsData);

        return toolsData;
    } catch (error) {
        console.error('Error fetching tools:', error);
    }
}

async function getArmours() {
    try {
        const results = await queryDatabase(`
            SELECT 
                a.id_armour,
                a.name_armour,
                a.is_craftable,
                a.effect,
                a.resistance,
                c.id_craft
            FROM 
                Armour a
            JOIN 
                Crafts c ON a.id_craft = c.id_craft;
        `);

        results.forEach(armour => {
            const { id_armour, name_armour, is_craftable, effect, resistance, id_craft } = armour;

            armoursData[id_armour] = {
                name: name_armour,
                isCraftable: is_craftable,
                effect : effect,
                resistance : resistance,
                craftId: id_craft
            };
        });

        console.log(armoursData);

        return armoursData;
    } catch (error) {
        console.error('Error fetching armours:', error);
    }
}

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

loadFarmablesFromMap()
loadMonsterSpawns()

//createEnemy(0, 0, undefined,'neutral', undefined, 100, 200)
//createEnemy(0, 0, 'melee','aggressive', undefined, 200, 300, undefined, [{category: 'Ressource', type: 'stick', quantity: 1, value: 0}, {category: 'Ressource', type: 'stone', quantity: 1, value: 0}, {category: 'Food', type: 'meat', quantity: 1, value: 20}])

ioServer.on('connection', (socket) => {
    
    players.push({ x: 0, y: 0, id: socket.id, inGame: false, hp: 0, lastDirection: "down"});
    
    console.log(`A player connected: ${socket.id}`);
    
    socket.on('getCraftables', () => {
        console.log(craftablesData)
        socket.emit('getCraftables', craftablesData);
    })

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
        createDrop(drop.category, drop.type, drop.quantity, drop.value, drop.x, drop.y);
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
function createFarmable(type, x, y, dropsData, maxHp) {
    const farmable = { id: generateUniqueFarmableId(), type: type, x: x, y: y, maxHp: maxHp, hp: maxHp, drops: dropsData};
    console.log(farmable)
    farmables.push(farmable);
    ioServer.emit('farmableCreated', farmable);
}

function createInitialFarmables() {
    let x = 100;
    let y = 0;

    Object.values(farmablesData).forEach(farmable => {

        // Appeler la fonction pour créer le farmable
        createFarmable(farmable.type, x, y, farmable.drops, farmable.hp);  // Passer les drops en paramètre
        x+=100;
    });
  
    
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
    console.log(farmable.drops)
    // Réapparition après un délai
    setTimeout(() => {
        createFarmable(farmable.type, farmable.x, farmable.y, farmable.drops, farmable.maxHp);
    }, FARMABLE_RESPAWN_TIME);
}

function destroyEnemy(index){
    // Informer tous les clients de la destruction
    ioServer.emit('enemyDied', enemies[index].id, );

    enemies[index].dropList.forEach(drop => {
        createDrop(drop.category, drop.type, drop.quantity, drop.value, enemies[index].x, enemies[index].y);
    });

    const enemy = enemies.splice(index, 1)[0];

    // Réapparition après un délai
    setTimeout(() => {
        createEnemy(enemy.spawnX, enemy.spawnY, enemy.type, enemy.behavior, enemy.maxHp, enemy.attackRange, enemy.searchRange, enemy.actionDelay, enemy.dropList);
    }, ENEMY_RESPAWN_TIME);
}

// Fonction pour créer une drop
function createDrop(category, type, quantity, value, x, y) {
    const drop = { id: generateUniqueDropId(), category: category, type: type, quantity: quantity, value: value, x: x, y: y };
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


function createEnemy(name, x, y, type = 'melee', behavior = 'aggressive', hp = 10, attackRange, searchRange, actionDelay = 3000, dropList=[]) {
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
        isPatrolling: true,
        dropList: dropList
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
                    // if(distanceToTarget <= enemy.minAttackRange){
                    //     //combo melee
                    //     //shootAround(enemy);
                    //     console.log('melee')
                    //     enemy.isAttacking = false
                    if(distanceToTarget <= enemy.maxAttackRange /*&& distanceToTarget > enemy.minAttackRange*/ ){
                        chooseRandomAttack(enemy)

                        //tir circulaire ou laser
                        console.log('shoot')
                        dx = 0;
                        dy = 0;
                    }
                }
                //enemy.isAttacking = false;
            }, enemy.actionDelay);
        }
    }
}

function chooseRandomAttack(enemy) {
    const bossRangedAttacks = [
        shootAround,          // Fonction pour l'attaque circulaire
        rayAttack,            // Fonction pour l'attaque en rayon
    ];

    const randomIndex = Math.floor(Math.random() * bossRangedAttacks.length);
    const selectedAttack = bossRangedAttacks[randomIndex];

    // Exécuter l'attaque choisie
    selectedAttack(enemy);
}

// Lorsque le boss attaque, on crée des projectiles autour de lui
function shootAround(enemy) {
    let offset = 0; // Décalage initial des angles
    let repetitions = 0; // Compteur pour les répétitions de l'attaque

    const shootInterval = setInterval(() => {
        // Angles pour les projectiles autour du boss
        let angles = [
            0 + offset, 
            Math.PI / 3 + offset, 
            (2 * Math.PI) / 3 + offset, 
            Math.PI + offset, 
            -(2 * Math.PI) / 3 + offset, 
            -Math.PI / 3 + offset
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

function rayAttack(enemy) {
    console.log("Le boss utilise RayAttack !");
    
    // Longueur et largeur du rayon
    const rayLength = 500;
    const rayWidth = 50;

    // Calculer la direction du rayon vers la cible
    const dx = enemy.target.x - enemy.x;
    const dy = enemy.target.y - enemy.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    // Normaliser le vecteur direction pour obtenir un déplacement unitaire
    const directionX = dx / distance;
    const directionY = dy / distance;
    
    // Calculer les points de départ et de fin du rayon
    const rayStartX = enemy.x;
    const rayStartY = enemy.y;
    const rayEndX = rayStartX + directionX * rayLength;
    const rayEndY = rayStartY + directionY * rayLength;

    console.log(rayStartX,
        rayStartY,
        rayEndX,
        rayEndY)

    // Informer les clients de l'avertissement (zone d'effet)
    ioServer.emit("rayWarning", {
        x: rayStartX,
        y: rayStartY,
        endX: rayEndX,
        endY: rayEndY,
        width: rayWidth,
        duration: 1000 // Temps avant l'attaque
    });

    // Déclencher l'attaque après l'avertissement
    setTimeout(() => {
        ioServer.emit("rayAttack", {
            x: rayStartX,
            y: rayStartY,
            endX: rayEndX,
            endY: rayEndY,
            width: rayWidth
        });

        // Vérifier si des joueurs sont touchés
        players.forEach(player => {
            if (isPlayerHitByRay(player, rayStartX, rayStartY, rayEndX, rayEndY, rayWidth)) {
                console.log(`Joueur ${player.id} touché par RayAttack !`);
                player.health -= 10;
                ioServer.emit("playerHit", {targetId: player.id, damage: 10 });
            }
        });
        enemy.isAttacking = false
    }, 1000); // Délai de 1 seconde
}

function isPlayerHitByRay(player, rayStartX, rayStartY, rayEndX, rayEndY, rayWidth) {
    const playerX = player.x;
    const playerY = player.y;

    // Calculer la distance du joueur à la ligne du rayon
    const distance = Math.abs(
        (rayEndY - rayStartY) * playerX - (rayEndX - rayStartX) * playerY + rayEndX * rayStartY - rayEndY * rayStartX
    ) / Math.sqrt((rayEndY - rayStartY) ** 2 + (rayEndX - rayStartX) ** 2);

    // Vérifier si le joueur est à l'intérieur de la largeur du rayon
    return distance <= rayWidth / 2;
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
        enemy.isPatrolling = false;
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
                    console.log('rentré dans le if')
                    createProjectile(enemy.x, enemy.y, enemy.target.x, enemy.target.y, 100, 0, enemy.id, 5)
                }
                console.log('sorti dans le if')
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
        enemy.isPatrolling = false;
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