import Ressource from "../Classes/Ressource.js";
import Drop from "../Classes/Drop.js";
import Farmable from "../Classes/Farmable.js";
import Craftable from "../Classes/Craftable.js";
import Tool from "../Classes/Tool.js";
import Inventory from "../Classes/Inventory.js";
import Player from "../Classes/Player.js";
import Ennemi from "../Classes/Ennemi.js";
import OtherPlayer from "../Classes/OtherPlayer.js"
import socket from '../Modules/socket.js';

var existingFarmables;
var existingDrops;
var existingProjectiles;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.cursor;
    this.farmableGroup;
    this.dropsGroup;
    this.projectiles;
    this.otherPlayers;
    this.playersGroup;
    this.otherPlayersGroup;
  }
	
	preload() {
    //load les sprites, sons, animations
    this.load.spritesheet('player','/assets/MC/SpriteSheetMC.png', { frameWidth: 32, frameHeight: 32 });

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
    this.load.image("meat", "/assets/meat.png");

    //tools
    this.load.image('stoneAxe', 'assets/tools/stoneAxe.png');
    this.load.image('woodenPickaxe', 'assets/tools/woodenPickaxe.png');
  }
	
	create() {

    //créer les instances
    this.player = new Player(this, 0, 0);
    this.player.id = socket.id
    this.cursor = this.input.keyboard.createCursorKeys();
    this.cameras.main.startFollow(this.player, true, 0.25, 0.25);

    this.otherPlayers = [];
    this.playersGroup = this.physics.add.group();
    this.playersGroup.add(this.player);

    this.otherPlayersGroup = this.physics.add.group();

    existingFarmables = new Set();
    existingDrops = new Set();
    existingProjectiles = new Set();
    
    // Créer le groupe de farmables
    this.farmableGroup = this.physics.add.group();
    // Initialiser le groupe des drops
    this.dropsGroup = this.physics.add.group();
    // Initialiser le groupe des projectiles
    this.projectiles = this.physics.add.group();

    this.syncFarmables();
    this.syncDrops();
    this.syncProjectiles();
    
    this.inventory = new Inventory(this);

	// Exemple : Ajouter des ressources pour tester
	this.inventory.addItem("Ressource", "wood", 10);
	this.inventory.addItem("Ressource", "stone", 5);

    this.inventory.addItem("Tool", "stoneAxe", 1);
    this.inventory.addItem("Tool", "woodenPickaxe", 1);

    this.inventory.createUI();
    this.inventory.updateInventoryText();

    this.ennemiRanged = new Ennemi(this, 400, 300, 'ennemi', 'ranged', 'neutral', 100, 50, 150, 300, 2000);
    this.ennemiMelee = new Ennemi(this, 400, 300, 'ennemi', 'melee', 'aggressive');
  }
  
  update() {
    // Gestion des mouvements du joueur
    this.player.update();
    this.updateOtherPlayers();
    this.ennemiRanged.getClosestTarget(this.player)
    this.ennemiMelee.getClosestTarget(this.player)
   }
    
    createFarmable(type, x, y, id, hp) {
        // Créer une instance farmable
        const farmableElement = this.farmableGroup.create(x, y, type, 0);
        farmableElement.setOrigin(0, 0);
        farmableElement.id = id;
        
        switch (type) {
            case "tree":
            farmableElement.setDisplaySize(32, 32);
            farmableElement.category = "Ressource";
            farmableElement.dropType = "wood";
            break;
            case "rock":
            farmableElement.setDisplaySize(32, 32);
            farmableElement.category = "Ressource";
            farmableElement.dropType = "stone";
            break;
            default:
            farmableElement.setDisplaySize(32, 32);
            farmableElement.category = "Ressource";
            farmableElement.dropType = "wood";
        }
        
        // Associer un objet Farmable à l'instance
        farmableElement.farmableData = new Farmable(type, hp);
    }
    
    hitFarmable(player, farmableElement, damage) {
        const farmable = farmableElement.farmableData;
        const category = farmableElement.category;
        const dropType = farmableElement.dropType;

        if (farmable) {
            const dropQuantity = Math.min(damage, farmable.currentHp);
            console.log(dropQuantity)
            const drop = {
                category: category,
                type: dropType,
                quantity: dropQuantity,
                x: farmableElement.x + farmableElement.displayWidth / 2 + Phaser.Math.Between(-32, 32),
                y: farmableElement.y + farmableElement.displayHeight / 2 + Phaser.Math.Between(-32, 32),
            };
            socket.emit('hitFarmable', farmableElement.id);
            socket.emit('createDrop', drop);
        }
    }
    
    farmableHalfHp(farmableElement, type){
        switch (type) {
            case "tree":
            farmableElement.setFrame(1);
            break;
            case "rock":
            //farmableElement.setFrame(1);  pas encore fait
            break;
            default:
            farmableElement.setFrame(1);
        }
    }
    
    createDrop(category, type, quantity, x, y, id) {

        // Créer une instance de drop dans le groupe à la position générée
        const dropElement = this.dropsGroup.create(
            x,
            y,
            type,
        );
        dropElement.id = id;
        dropElement.setDisplaySize(30, 30);
        dropElement.dropData = new Drop(category, type, quantity);
        // Ajouter une physique de collision pour permettre la collecte
        this.physics.add.overlap(
            this.player,
            dropElement,
            () => {
                // Quand le joueur marche sur le drop, elle est collectée
                this.collectDrop(dropElement.dropData, dropElement.id);
                dropElement.destroy();
            },
            null,
            this
        );
    }
    
    collectDrop(drop, id) {
        // Ajouter des drops à la collecte globale
        if (drop.type) {
            this.inventory.addItem(drop.category, drop.type, drop.quantity)
            this.inventory.updateInventoryText();
            console.log(`${id} ${drop.category} ${drop.type} collectée: ${drop.quantity}, total: ${this.inventory.inventory[drop.type].quantity}`);
            socket.emit('collectDrop', id);
        } else {
            console.log(`drop ${drop.type} non définie.`);
        }
    }
    
    updateOtherPlayers() {
        // Nettoyage des anciens listeners pour éviter les doublons
        socket.off('updatePlayers');
        socket.off('playerHit');
    
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
    
                    if (!otherPlayer) {
                        // Création d'un nouveau joueur s'il n'existe pas encore
                        const sprite = this.physics.add.image(playerData.x, playerData.y, "player");
                        sprite.setImmovable(true);
                        sprite.body.allowGravity = false;
                        sprite.id = playerData.id;
    
                        // Ajout de l'instance OtherPlayer
                        otherPlayer = new OtherPlayer(this, sprite, playerData.id);
                        this.otherPlayers.push(otherPlayer);
                        this.playersGroup.add(sprite);
                        this.otherPlayersGroup.add(sprite);
                    }
    
                    // Met à jour les données et le sprite du joueur
                    otherPlayer.update(playerData);
                }
            });
    
            // Supprime les joueurs qui ne sont plus dans la liste reçue
            this.otherPlayers = this.otherPlayers.filter(otherPlayer => {
                const exists = data.some(p => p.id === otherPlayer.id);
                if (!exists) {
                    otherPlayer.destroy(); // Nettoie le sprite et autres ressources
                }
                return exists;
            });
        });

        socket.on('playerHit', ({ targetId, damage }) => {
            console.log("player hit")
            console.log(damage)
            if (targetId === socket.id) {
                
                // Si c'est le joueur actuel, mettre à jour ses HP
                this.player.takeDamage(damage)
                console.log(`Vous avez été touché ! Points de vie restants : ${damage}`);
        
                // Vérifier si le joueur est mort
                if (this.player.playerHP.currentHealth <= 0) {
                    console.log('Vous êtes mort !');
                }
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
                    this.createFarmable(farmable.type, farmable.x, farmable.y, farmable.id, farmable.hp);
                    existingFarmables.add(farmable.id); // Ajouter l'ID à l'ensemble
                    console.log('farmable trouvé')
                }
            });
        });
        
        socket.on('farmableCreated', (farmable) => {
            console.log('Farmable créé reçu ' + farmable.id);
            if (!existingFarmables.has(farmable.id)) {
                this.createFarmable(farmable.type, farmable.x, farmable.y, farmable.id, farmable.hp);
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
                    this.createDrop(drop.category, drop.type, drop.quantity, drop.x, drop.y, drop.id);
                    existingDrops.add(drop.id); // Ajouter l'ID à l'ensemble
                }
            });
        });

        socket.on('dropCreated', (drop) => {
            console.log('Drop créé reçu ' + drop.id);
            if (!existingDrops.has(drop.id)) {
                this.createDrop(drop.category, drop.type, drop.quantity, drop.x, drop.y, drop.id);
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
        socket.off('projectileCreated');

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
                            if (ownerId === socket.id) {
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


                // Gestion des collisions avec les joueurs
                

                // Détruire le projectile après un délai s'il ne touche rien
                this.time.delayedCall(3000, () => {
                    if (projectile.active) {
                        projectile.destroy();
                        existingProjectiles.delete(id)
                    }
                });
            }
        });
    }
}
