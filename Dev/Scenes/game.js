import Ressource from "../Classes/Ressource.js";
import Drop from "../Classes/Drop.js";
import Farmable from "../Classes/Farmable.js";
import Craftable from "../Classes/Craftable.js";
import Tool from "../Classes/Tool.js";
import Inventory from "../Classes/InventoryManagement.js";
import InventoryUI from '../Classes/InventoryUI';
import HotbarManagement from '../Classes/HotbarManagement.js';
import HotbarUI from '../Classes/HotbarUI.js';

import Player from "../Classes/Player.js";

import socket from '../Modules/socket.js';

var otherPlayers;
var otherPlayerSprites;
var existingFarmables;
var existingDrops;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.cursor;
    this.farmableGroup;
    this.dropsGroup;
  }
	
	preload() {
    //load les sprites, sons, animations
    this.load.spritesheet('player','/assets/MC/SpriteSheetMC.png', { frameWidth: 32, frameHeight: 32 });


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
    this.cursor = this.input.keyboard.createCursorKeys();
    this.cameras.main.startFollow(this.player, true, 0.25, 0.25);

    otherPlayers = [];
    otherPlayerSprites = [];
    existingFarmables = new Set();
    existingDrops = new Set();
    
    // Créer le groupe de farmables
    this.farmableGroup = this.physics.add.group();
    // Initialiser le groupe des drops
    this.dropsGroup = this.physics.add.group();

    this.syncFarmables();
    this.syncDrops();
    
    this.inventory = new Inventory(this);
    this.inventoryUI = new InventoryUI(this, this.inventory);
    this.hotbarManagement = new HotbarManagement(this.inventory);
    this.hotbarUI = new HotbarUI(this, this.hotbarManagement);


	// Exemple : Ajouter des ressources pour tester
	this.inventory.addItem("Ressource", "wood", 10);
	this.inventory.addItem("Ressource", "stone", 5);

    this.inventory.addItem("Tool", "stoneAxe", 1);
    this.inventory.addItem("Tool", "woodenPickaxe", 1);
    console.log(this.inventory.getInventoryKey());
    console.log(this.inventory.getSlots());
    let oui = this.inventory.getInventoryKey();
    console.log(this.inventory.inventory[oui[1]].slot);


    this.inventoryUI.updateInventoryText();


    this.tools = {
        stoneAxe: new Tool('stoneAxe', 1),
        woodenPickaxe: new Tool('woodenPickaxe', 1),
    };

    // Exemple : Équipez un outil
    this.player.equipTool('stoneAxe');
  }
  
  update() {
    // Gestion des mouvements du joueur
    this.player.update();
    this.updateOtherPlayers();
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
                this.inventoryUI.updateInventoryText();
                console.log(`${id} ${drop.category} ${drop.type} collectée: ${drop.quantity}, total: ${this.inventory.inventory[drop.type]?.quantity}`);
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

        socket.emit('updatePlayers', {y: this.player.y, x: this.player.x, hp: this.player.playerHP.currentHealth});

        socket.on('updatePlayers', (data) => {
            if(otherPlayerSprites[0] != undefined){
                for (const sprite of otherPlayerSprites) {
                    sprite.destroy(true)
                    otherPlayerSprites = [];
                }
            }
            otherPlayers = data;
        })
        
        if (otherPlayers != null) {
            for (let i = 0; i < otherPlayers.length; i++) {
                if(otherPlayers[i].id != socket.id) {
                    if (otherPlayers[i].inGame) {
                        var newPlayer = this.physics.add.image(otherPlayers[i].x, otherPlayers[i].y, "player");
                        newPlayer.setImmovable(true);
                        newPlayer.body.allowGravity = false;
                        otherPlayerSprites.push(newPlayer);
                    }
                }
            }
        }
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

}
