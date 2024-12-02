import Ressource from "../Classes/Ressource.js";
import Farmable from "../Classes/Farmable.js";
import Craftable from "../Classes/Craftable.js";
import Tool from "../Classes/Tool.js";
import Inventory from "../Classes/Inventory.js";
import Player from "../Classes/Player.js";

import socket from '../Modules/socket.js';

var otherPlayers;
var otherPlayerSprites;
var existingFarmables;
var existingResources;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.cursor;
    this.farmableGroup;
    this.resources = {
      wood: new Ressource("wood"),
      stone: new Ressource("stone"),
      meat: new Ressource("meat"),
    };
    this.resourcesGroup;
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
    existingResources = new Set();
    
    // Créer le groupe de farmables
    this.farmableGroup = this.physics.add.group();
    // Initialiser le groupe des ressources
    this.resourceGroup = this.physics.add.group();

    this.syncFarmables();
    this.syncResources();
    
    this.inventory = new Inventory(this);

	// Exemple : Ajouter des ressources pour tester
	this.inventory.addItem("Ressource", "wood", 10);
	this.inventory.addItem("Ressource", "stone", 5);

    this.inventory.addItem("Tool", "stoneAxe", 1);
    this.inventory.addItem("Tool", "woodenPickaxe", 1);

    this.inventory.createUI();
    this.inventory.updateInventoryText();

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
            farmableElement.ressourceDrop = "wood";
            break;
            case "rock":
            farmableElement.setDisplaySize(32, 32);
            farmableElement.ressourceDrop = "stone";
            break;
            default:
            farmableElement.setDisplaySize(32, 32);
            farmableElement.ressourceDrop = "wood";
        }
        
        // Associer un objet Farmable à l'instance
        farmableElement.farmableData = new Farmable(type, hp);
    }
    
    hitFarmable(player, farmableElement, damage) {
        const farmable = farmableElement.farmableData;
        const ressourceDrop = farmableElement.ressourceDrop;

        if (farmable) {
            const resourcesToGenerate = Math.min(damage, farmable.currentHp);
            for (var i = 0; i < resourcesToGenerate; i++) {
                const resource = {
                    type: ressourceDrop,
                    x: farmableElement.x + farmableElement.displayWidth / 2 + Phaser.Math.Between(-32, 32),
                    y: farmableElement.y + farmableElement.displayHeight / 2 + Phaser.Math.Between(-32, 32),
                };
                socket.emit('hitFarmable', farmableElement.id);
                socket.emit('createResource', resource);
            }
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
    
    createResource(type, x, y, id) {
        
        // Créer une instance de ressource dans le groupe à la position générée
        const resourceElement = this.resourceGroup.create(
            x,
            y,
            type
        );
        resourceElement.id = id;
        resourceElement.setDisplaySize(30, 30);
        resourceElement.resourceData = new Ressource(type, 1);
        // Ajouter une physique de collision pour permettre la collecte
        this.physics.add.overlap(
            this.player,
            resourceElement,
            () => {
                // Quand le joueur marche sur la ressource, elle est collectée
                this.collectResource(type, 1, id);
                resourceElement.destroy();
            },
            null,
            this
        );
    }
    
    collectResource(type, quantity, id) {
        // Ajouter des ressources à la collecte globale
        if (this.resources[type]) {
            this.inventory.addItem("Ressource", type, quantity)
            this.inventory.updateInventoryText();
            console.log(`${id} ${type} collectée: ${quantity}, total: ${this.inventory.inventory[type].quantity}`);
            socket.emit('collectResource', id);
        } else {
            console.log(`Ressource ${type} non définie.`);
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

    syncResources() {
        socket.off('resourceList');
        socket.off('resourceCreated');
        socket.off('resourceCollected');

        socket.emit('requestResources');

        // Recevoir les resources existants lors de la connexion
        socket.on('resourceList', (resources) => {
            console.log('Liste des resources reçue');
            resources.forEach(resource => {
                console.log('resource venant de liste reçu ' + resource.id)
                if (!existingResources.has(resource.id)) { // Vérifier si la resource existe déjà
                    this.createResource(resource.type, resource.x, resource.y, resource.id);
                    existingResources.add(resource.id); // Ajouter l'ID à l'ensemble
                }
            });
        });

        socket.on('resourceCreated', (resource) => {
            console.log('Resource créé reçue ' + resource.id);
            if (!existingResources.has(resource.id)) {
                this.createResource(resource.type, resource.x, resource.y, resource.id);
                existingResources.add(resource.id);
            }
        });
        
        socket.on('resourceCollected', (resourceId) => {
            // Logique pour détruire la ressource sur le client
            const resourceElement = this.resourceGroup.getChildren().find(resource => resource.id === resourceId);
            if (resourceElement) {
                resourceElement.destroy(); // Détruire l'élément visuel
                console.log(`Resource avec ID ${resourceId} collecté sur le client`);
                existingResources.delete(resourceId)
            }
        });
    }

}
