import Ressource from "../Classes/Ressource.js";
import Drop from "../Classes/Drop.js";
import Farmable from "../Classes/Farmable.js";
import Craftable from "../Classes/Craftable.js";
import Tool from "../Classes/Tool.js";
import Inventory from "../Classes/InventoryManagement.js";
import InventoryUI from '../Classes/InventoryUI';
import HotbarManagement from '../Classes/HotbarManagement.js';
import HotbarUI from '../Classes/HotbarUI.js';
import CraftingUI from '../Classes/CraftingUI.js'

import Player from "../Classes/Player.js";
import Ennemi from "../Classes/Ennemi.js";
import OtherPlayer from "../Classes/OtherPlayer.js"
import socket from '../Modules/socket.js';

var otherPlayers;
var otherPlayerSprites;
var existingFarmables;
var existingDrops;
var existingProjectiles;
var existingEnemies;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.cursor;
    this.farmableGroup;
    this.dropsGroup;
    this.projectiles;
    this.otherPlayers;
    this.playersGroup;
    this.enemiesGroup;
    this.backgroundMusicPlaying = false;
  }
	
	preload() {
    this.load.image('tiles', '/assets/map/Tiles.png');
    this.load.tilemapTiledJSON('map', '/assets/map/map.json');
    //load les sprites, sons, animations
    this.load.spritesheet('player','/assets/MC/SpriteSheetMC.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sword_slash', '/assets/SwordSlash.png', {frameWidth: 32, frameHeight: 32 });
    

    //Ennemis
    this.load.image("ennemi", "/assets/ennemi.png");
    this.load.image("projectileTexture", "/assets/projectileTexture.png");
    this.load.image("meleeTexture", "/assets/meleeTexture.png");

    //farmables
    this.load.spritesheet('tree', '/assets/treeSpritesheet.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image("rock", "/assets/rock.png");

    //ressources
    this.load.image("wood", "/assets/wood.png");
    this.load.image("stone", "/assets/stone.png");
    this.load.image("stick", "/assets/stick.png");
    this.load.image("plank", "/assets/plank.png");
    this.load.image("ironIngot", "/assets/ironIngot.png");
    this.load.image("iron", "/assets/iron.png");
    this.load.image("gold", "/assets/gold.png");
    this.load.image("meat", "/assets/meat.png");
    this.load.image("apple", "/assets/apple.png");

    //tools
    this.load.image('stoneAxe', '/assets/tools/stoneAxe.png');
    this.load.image('woodenPickaxe', '/assets/tools/woodenPickaxe.png');

    // Charger les sons
    this.load.audio('backgroundMusic', '/assets/Audio/backgroundMusic.wav');
  }
    
  create() {
        const map = this.make.tilemap({ key: 'map', tileWidth:16, tileHeigt: 16});
        
        const tileset = map.addTilesetImage('Tiles1', 'tiles'); // Correspond au nom du tileset dans Tiled
        
        const backgroundLayer = map.createLayer('top', tileset, 0, 0);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        //créer les instances
        this.player = new Player(this, 20, 20);
        this.player.setCollideWorldBounds(true);
        this.cursor = this.input.keyboard.createCursorKeys();
        this.cameras.main.startFollow(this.player, true, 0.25, 0.25);
        
        this.otherPlayers = [];
        this.playersGroup = this.physics.add.group();
        this.playersGroup.add(this.player);
        
        this.enemiesGroup = this.physics.add.group();
        
        existingFarmables = new Set();
        existingDrops = new Set();
        existingProjectiles = new Set();
        existingEnemies = new Set();
        
        // Créer le groupe de farmables
        this.farmableGroup = this.physics.add.group();
        // Initialiser le groupe des drops
        this.dropsGroup = this.physics.add.group();
        // Initialiser le groupe des projectiles
        this.projectiles = this.physics.add.group();
        
        this.syncFarmables();
        this.syncDrops();
        this.syncProjectiles();
        this.syncEnemies()
        
        this.inventory = new Inventory(this);
        this.inventoryUI = new InventoryUI(this, this.inventory);
        this.craftingUI = new CraftingUI(this, this.inventory);
        this.hotbarManagement = new HotbarManagement(this.inventory);
        this.hotbarUI = new HotbarUI(this, this.hotbarManagement);
        
        // Exemple : Ajouter des ressources pour tester
        this.inventory.addItem("Ressource", "wood", 10, 0);
        this.inventory.addItem("Ressource", "stone", 5, 0);
        
        this.inventory.addItem("Tool", "stoneAxe", 1);
        this.inventory.addItem("Tool", "woodenPickaxe", 1);
        
        this.createMeat(50,50)
        
        this.backgroundMusic = this.sound.add('backgroundMusic', {
            volume: 0.33, // Ajuster le volume
            loop: true,  // Activer la boucle
        });
    }
    
    update() {
        // Gestion des mouvements du joueur
        this.player.update();
        this.updateOtherPlayers();
        
        if (!this.backgroundMusicPlaying) {
            this.backgroundMusic.play();
            this.backgroundMusicPlaying = true; // Empêcher de rejouer
        }
    }
    
    createEnemy(x, y, type, id) {
        // Créer une instance farmable
        const enemy = this.enemiesGroup.create(x, y, type);
        enemy.setOrigin(0.5, 0.5);
        enemy.id = id;
        
        if(type == 'boss'){
            enemy.setScale(2,2)
        }
        console.log(enemy)
    }
    
    createFarmable(type, x, y, id, hp, drops) {
        // Créer une instance farmable
        const farmableElement = this.farmableGroup.create(x, y, type, 0);
        farmableElement.setOrigin(0.5, 0.5);
        farmableElement.setDisplaySize(32, 32);
        farmableElement.id = id;
        farmableElement.drops = drops;
        farmableElement.farmableData = new Farmable(type, hp);
    }
    
    hitFarmable(farmableElement, damage) {
        const farmable = farmableElement.farmableData;
        const drops = farmableElement.drops;
        let randomDrop = {};
        let finalDrops = {};

        if (farmable) {
            const dropQuantity = Math.min(damage, farmable.currentHp);

            // Pour chaque "hit", choisir un drop aléatoire
            for (let i = 0; i < dropQuantity; i++) {
                randomDrop = drops[Phaser.Math.Between(0, drops.length - 1)];
                
                // Si le drop existe déjà, on incrémente sa quantité
                if (finalDrops[randomDrop.dropType]) {
                    finalDrops[randomDrop.dropType].quantity++;
                } else {
                    // Sinon, on l'ajoute et on initialise sa quantité
                    finalDrops[randomDrop.dropType] = {
                        dropType: randomDrop.dropType,
                        dropCategory: randomDrop.dropCategory,
                        quantity: 1,
                        dropValue: randomDrop.dropValue
                    };
                }
            }

            Object.values(finalDrops).forEach(farmableDrop => {

                const drop = {
                    category: farmableDrop.dropCategory,
                    type: farmableDrop.dropType,
                    quantity: farmableDrop.quantity,
                    value: farmableDrop.dropValue,
                    x: farmableElement.x + farmableElement.displayWidth / 2 + Phaser.Math.Between(-32, 32),
                    y: farmableElement.y + farmableElement.displayHeight / 2 + Phaser.Math.Between(-32, 32),
                };

                socket.emit('hitFarmable', farmableElement.id);
                socket.emit('createDrop', drop);
            });
        }
    }
    
    createMeat(x, y) {
        const category = 'Food';
        const dropType = 'meat';
        
        const dropQuantity = 1;
        const drop = {
            category: category,
            type: dropType,
            quantity: dropQuantity,
            x: x,
            y: y,
        };
        socket.emit('createDrop', drop);
    }
    
    farmableHalfHp(farmableElement, type){
        switch (type) {
            case "tree":
            farmableElement.setFrame(1);
            break;
            case "rock":
            farmableElement.setFrame(1);
            break;
            default:
            break;
        }
    }
    
    createDrop(category, type, quantity, value, x, y, id) {
        
        // Créer une instance de drop dans le groupe à la position générée
        const dropElement = this.dropsGroup.create(
            x,
            y,
            type,
        );
        dropElement.id = id;
        dropElement.setDisplaySize(30, 30);
        dropElement.dropData = new Drop(category, type, quantity, value);
        // Ajouter une physique de collision pour permettre la collecte
        this.physics.add.overlap(
            this.player,
            dropElement,
            () => {
                // Quand le joueur marche sur le drop, elle est collectée
                // Tente de collecter le drop
                if (this.collectDrop(dropElement.dropData, dropElement.id)) {
                    dropElement.destroy();
                } else {
                    dropElement.setTint(0xff0000); // Rougir temporairement pour indiquer l'échec
                    this.time.delayedCall(200, () => dropElement.clearTint());
                }
            },
            null,
            this
        );
    }
    
    collectDrop(drop, id) {
        // Ajouter des drops à la collecte globale
        if (drop.type) {
            if (!this.inventory.isFull() || this.inventory.inventory[drop.type]) {
                this.inventory.addItem(drop.category, drop.type, drop.quantity);
                console.log(`${id} ${drop.category} ${drop.type} collectée: ${drop.quantity}, total: ${this.inventory.inventory[drop.type].item?.quantity}`);
                socket.emit('collectDrop', id);
                return true;
            } else {
                console.log(`Impossible de collecter ${drop.type}, inventaire plein.`);
                return false;
            }
        } else {
            console.log(`Drop ${drop.type} non défini.`);
            return false;
        }
    }
    
    updateOtherPlayers(){
        socket.off('updatePlayers');
        socket.off('playerHit');
        socket.off("updatePlayerDirection")
        
        // Envoie la position et les HP du joueur actuel au serveur
        socket.emit('updatePlayers', {
            x: this.player.x,
            y: this.player.y,
            hp: this.player.playerHP.currentHealth
        });
        
        // Écoute des mises à jour des joueurs depuis le serveur
        socket.on('updatePlayers', (data) => {
            // Parcourt les données des autres joueurs
            data.forEach((playerData) => {
                if (playerData.id !== socket.id) {
                    // Vérifie si ce joueur existe déjà dans la liste
                    let otherPlayer = this.otherPlayers.find(p => p.id === playerData.id);
                    
                    // Recherche si un sprite avec cet ID existe déjà
                    let existingSprite = this.playersGroup.getChildren().find(p => p.id === playerData.id);
                    
                    if (!existingSprite && playerData.inGame) {
                        // Si aucun sprite n'existe, on en crée un nouveau
                        const playerSprite = this.playersGroup.create(playerData.x, playerData.y, 'player');
                        playerSprite.body.allowGravity = false;
                        playerSprite.id = playerData.id;
                        
                        otherPlayer = new OtherPlayer(this, playerData.id);
                        this.otherPlayers.push(otherPlayer);
                        
                        console.log(`Ajout d'un nouveau sprite avec id ${playerData.id}`);
                    } else if (existingSprite) {
                        // Si le sprite existe déjà, on met juste à jour ses coordonnées
                        
                        if(playerData.x == existingSprite.x && playerData.y == existingSprite.y){
                            existingSprite.anims.pause();
                            const frames = {
                                "right": 3,
                                "left": 3,
                                "down": 0,
                                "up": 6
                            };
                            existingSprite.setFrame(frames[otherPlayer.lastDirection]);
                        } else {
                            existingSprite.anims.resume();
                            switch (otherPlayer.lastDirection) {
                                case "up":
                                existingSprite.flipX = false;
                                existingSprite.play("up", true);
                                break;
                                case "down":
                                existingSprite.flipX = false;
                                existingSprite.play("down", true);
                                break;
                                case "left":
                                existingSprite.flipX = true;
                                existingSprite.play("side", true);
                                break;
                                case "right":
                                existingSprite.flipX = false;
                                existingSprite.play("side", true);
                                break;
                            }
                        }
                        
                        existingSprite.x = playerData.x;
                        existingSprite.y = playerData.y;
                        
                    }
                }
            });
            
            
            
            // Supprime les joueurs qui ne sont plus dans la liste reçue
            for (let i = this.otherPlayers.length - 1; i >= 0; i--) { // Parcours inversé pour éviter les décalages
                const otherPlayer = this.otherPlayers[i];
                const playerSprite = this.playersGroup.getChildren().find(p => p.id === otherPlayer.id)
                const exists = data.some(p => p.id === otherPlayer.id);
                if (!exists) {
                    // Retire l'élément du tableau
                    this.otherPlayers.splice(i, 1);
                    this.playersGroup.remove(playerSprite)
                }
            }
        });
        
        socket.on('playerHit', ({ targetId, damage }) => {
            console.log("player hit")
            console.log(damage)
            if (targetId === socket.id) {
                
                // Si c'est le joueur actuel, mettre à jour ses HP
                this.player.takeDamage(damage)
                console.log(`Vous avez été touché ! Points de vie restants : ${this.player.playerHP.currentHealth}`);
                
                // Vérifier si le joueur est mort
                if (this.player.playerHP.currentHealth <= 0) {
                    console.log('Vous êtes mort !');
                }
            }
        });
        
        
        // Gère les directions des autres joueurs
        socket.on("updatePlayerDirection", (data) => {
            const { id, lastDirection } = data;
            
            // Récupère le joueur correspondant dans la liste des joueurs
            const otherPlayer = this.otherPlayers.find(p => p.id === id);
            
            if (otherPlayer) {
                // Met à jour la direction
                otherPlayer.lastDirection = lastDirection;
            }
            
            
        });
        
    }
    
    syncFarmables() {
        socket.off('farmableList');
        socket.off('farmableCreated');
        socket.off('farmableHit');
        socket.off('farmableDestroyed');
        
        socket.emit('requestFarmables');
        
        // Recevoir les farmables existants lors de la connexion
        socket.on('farmableList', (farmables) => {
            console.log('Liste des farmables reçue');
            farmables.forEach(farmable => {
                console.log('Farmable venant de liste reçu ' + farmable.id)
                if (!existingFarmables.has(farmable.id)) { // Vérifier si le farmable existe déjà
                    this.createFarmable(farmable.type, farmable.x, farmable.y, farmable.id, farmable.hp, farmable.drops);
                    existingFarmables.add(farmable.id); // Ajouter l'ID à l'ensemble
                    console.log('farmable trouvé')
                }
            });
        });
        
        socket.on('farmableCreated', (farmable) => {
            console.log('Farmable créé reçu ' + farmable.id);
            if (!existingFarmables.has(farmable.id)) {
                this.createFarmable(farmable.type, farmable.x, farmable.y, farmable.id, farmable.hp, farmable.drops);
                existingFarmables.add(farmable.id);
            }
        });
        
        socket.on('farmableHit', (farmableId) => {
            // Logique pour détruire le farmable sur le client
            const farmableElement = this.farmableGroup.getChildren().find(farmable => farmable.id === farmableId);
            if (farmableElement) {
                const farmable = farmableElement.farmableData;
                farmable.hit(); // réduire les hp
                console.log(`Farmable avec ID ${farmableId} hit sur le client hp=${farmable.currentHp} `);
                
                if (!farmable.hasSwapped && farmable.isHalfHp()) {
                    console.log(`${farmable.type} half hp !`);
                    this.farmableHalfHp(farmableElement, farmable.type);
                }
            }
            console.log(existingFarmables)
        });
        
        socket.on('farmableDestroyed', (farmableId) => {
            // Logique pour détruire le farmable sur le client
            const farmableElement = this.farmableGroup.getChildren().find(farmable => farmable.id === farmableId);
            if (farmableElement) {
                farmableElement.destroy(); // Détruire l'élément visuel
                console.log(`Farmable avec ID ${farmableId} détruit sur le client`);
                existingFarmables.delete(farmableId)
            }
            console.log(existingFarmables)
        });
    }
    
    syncDrops() {
        socket.off('dropList');
        socket.off('dropCreated');
        socket.off('dropCollected');
        
        socket.emit('requestDrops');
        
        // Recevoir les drops existants lors de la connexion
        socket.on('dropList', (drops) => {
            console.log('Liste des drops reçue');
            drops.forEach(drop => {
                console.log('resource venant de liste reçu ' + drop.id)
                if (!existingDrops.has(drop.id)) { // Vérifier si la resource existe déjà
                    this.createDrop(drop.category, drop.type, drop.quantity, drop.value, drop.x, drop.y, drop.id);
                    existingDrops.add(drop.id); // Ajouter l'ID à l'ensemble
                }
            });
        });
        
        socket.on('dropCreated', (drop) => {
            console.log('Drop créé reçu ' + drop.id);
            if (!existingDrops.has(drop.id)) {
                this.createDrop(drop.category, drop.type, drop.quantity, drop.value, drop.x, drop.y, drop.id);
                existingDrops.add(drop.id);
            }
        });
        
        socket.on('dropCollected', (dropId) => {
            // Logique pour détruire la drop sur le client
            const dropElement = this.dropsGroup.getChildren().find(drop => drop.id === dropId);
            if (dropElement) {
                dropElement.destroy(); // Détruire l'élément visuel
                console.log(`Resource avec ID ${dropId} collecté sur le client`);
                existingDrops.delete(dropId)
            }
        });
    }
    
    syncProjectiles(){
        
        //ajouter les projectiles déjà présent lors de la connection
        
        socket.off('projectileCreated');
        socket.off("rayWarning")
        socket.off("rayAttack")
        
        socket.on('projectileCreated', (projectileData) => {
            const { id, x, y, targetX, targetY, speed, ownerId } = projectileData;
            if (!existingProjectiles.has(id)) {
                existingProjectiles.add(id);
                
                // Ajout du projectile au groupe local
                const projectile = this.projectiles.create(x, y, 'projectileTexture');
                this.physics.moveTo(projectile, targetX, targetY, speed);
                
                this.playersGroup.getChildren().forEach(player => {
                    console.log(`playerid = ${player.id} & ownerid = ${ownerId}`)
                    if (player.id !== ownerId) {
                        this.physics.add.overlap(projectile, player, (projectile, targetPlayer) => {
                            if (ownerId === socket.id || (targetPlayer.id === socket.id && ownerId.includes('enemy'))) {
                                console.log(`projectileId: ${id},
                                    targetId: ${targetPlayer.id},
                                    targetType: 'player'`)
                                    
                                    socket.emit('projectileHit', {
                                        projectileId: id,
                                        targetId: targetPlayer.id,
                                        targetType: 'player',
                                    });
                                }
                                
                                projectile.destroy();
                                existingProjectiles.delete(id);
                            });
                        }
                    });
                    
                    this.enemiesGroup.getChildren().forEach(enemy => {
                        console.log(`enemyid = ${enemy.id} & ownerid = ${ownerId}`)
                        if (enemy.id !== ownerId) {
                            this.physics.add.overlap(projectile, enemy, (projectile, targetEnemy) => {
                                if (ownerId === socket.id) {
                                    socket.emit('projectileHit', {
                                        projectileId: id,
                                        targetId: targetEnemy.id,
                                        targetType: 'enemy',
                                    });
                                }
                                console.log(targetEnemy.hp)
                                projectile.destroy();
                                existingProjectiles.delete(id);
                            });     
                        }
                    });
                    
                    // Détruire le projectile après un délai s'il ne touche rien
                    this.time.delayedCall(3000, () => {
                        if (projectile.active) {
                            projectile.destroy();
                            existingProjectiles.delete(id)
                        }
                    });
                }
            });

            socket.on("rayWarning", (data) => {
                const graphics = this.add.graphics();
                graphics.fillStyle(0xff0000, 0.25);
            
                // Calcul de l'angle et de la distance
                const angle = Phaser.Math.Angle.Between(data.x, data.y, data.endX, data.endY);
                const distance = Phaser.Math.Distance.Between(data.x, data.y, data.endX, data.endY);
            
                // Position et rotation manuelles
                graphics.setPosition(data.x, data.y);
                graphics.rotateCanvas(angle);
            
                // Dessiner le rectangle centré
                graphics.fillRect(0, -data.width / 2, distance, data.width);
            
                // Supprimer le graphique après la durée
                setTimeout(() => graphics.destroy(), data.duration);
            });
            
            socket.on("rayAttack", (data) => {
                const graphics = this.add.graphics();
                graphics.fillStyle(0xff0000, 1);
            
                // Calcul de l'angle et de la distance
                const angle = Phaser.Math.Angle.Between(data.x, data.y, data.endX, data.endY);
                const distance = Phaser.Math.Distance.Between(data.x, data.y, data.endX, data.endY);
            
                // Position et rotation manuelles
                graphics.setPosition(data.x, data.y);
                graphics.rotateCanvas(angle);
            
                // Dessiner le rectangle centré
                graphics.fillRect(0, -data.width / 2, distance, data.width);
            
                // Supprimer le graphique après la durée
                setTimeout(() => graphics.destroy(), 500);
            });
            
            
        }

        syncEnemies(){
            socket.off('updateEnemies')
            socket.off('updateEnemyTarget')
            socket.off('enemyList')
            socket.off('enemyCreated')
            socket.emit('requestEnemies');
            
            socket.on('enemyList', (enemies) => {
                console.log('Liste des enemis reçue');
                enemies.forEach(enemy => {
                    console.log('enemi venant de liste reçu ' + enemy.id)
                    if (!existingEnemies.has(enemy.id)) { // Vérifier si la resource existe déjà
                        this.createEnemy(enemy.x, enemy.y, enemy.type, enemy.id);
                        existingEnemies.add(enemy.id); // Ajouter l'ID à l'ensemble
                    }
                });
            });
            
            socket.on('enemyCreated', (enemy) => {
                console.log('enemi créé ' + enemy.id)
                if (!existingEnemies.has(enemy.id)) { // Vérifier si la resource existe déjà
                    this.createEnemy(enemy.x, enemy.y, enemy.type, enemy.id);
                    existingEnemies.add(enemy.id); // Ajouter l'ID à l'ensemble
                }
            })
            
            socket.on('updateEnemies', (enemies) => {
                enemies.forEach(enemyInstance => {
                    const enemy = this.enemiesGroup.getChildren().find(e => e.id === enemyInstance.id);
                    
                    if (enemy) {
                        enemy.x = enemyInstance.x;
                        enemy.y = enemyInstance.y;
                        enemy.hp = enemyInstance.hp;
                        enemy.target = enemyInstance.targetId; // Mise à jour de la cible si nécessaire
                    }
                })
            });
            
            socket.on('updateEnemyTarget', (data) => {
                const enemy = this.enemiesGroup.getChildren().find(e => e.id === data.id);
                const target = this.playersGroup.getChildren().find(p => p.id === data.targetId);
                if (enemy) {
                    enemy.target = target;
                }
            });
            
            socket.on('enemyDied', (id) => {
                const enemy = this.enemiesGroup.getChildren().find(e => e.id === id);
                
                if (enemy) {
                    existingEnemies.delete(enemy.id)
                    enemy.destroy();
                }
            });
        }
    }
    
    