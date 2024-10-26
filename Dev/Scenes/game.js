import { io } from 'socket.io-client';

import Ressource from '../Classes/Ressource.js'
import Farmable from '../Classes/Farmable.js'
import HealthBar from "../Classes/HealthBar.js";

var socket = io('http://localhost:3000');
var otherPlayers = [];
var otherPlayerSprites = [];
var existingFarmables = new Set();
var existingResources = new Set();

export class GameScene extends Phaser.Scene{
  constructor(){
    super("scene-game")
    this.player
    this.cursor
    this.playerSpeed = 200
    this.farmableGroup
    this.resources = {
      wood: new Ressource("wood"),
      stone: new Ressource("stone"),
      meat: new Ressource("meat"),
    };
    this.resourcesGroup;
    this.playerHP;
  }

  preload() {
    //load les sprites, sons, animations
    this.load.image("player", "/assets/player.png");

    //farmables
    this.load.spritesheet('tree', '/assets/treeSpritesheet.png', {
      frameWidth: 32,  // largeur de chaque frame
      frameHeight: 32  // hauteur de chaque frame
    });
    this.load.image("rock", "/assets/rock.png");

    //ressources
    this.load.image("wood", "/assets/wood.png");
    this.load.image("stone", "/assets/stone.png");
    this.load.image("meat", "/assets/meat.png");
  }

  create() {

    //créer les instances
    this.player = this.physics.add.image(0, 0, "player");
    this.player.setImmovable(true);
    this.player.body.allowGravity = false;
    this.cursor = this.input.keyboard.createCursorKeys();

    this.cameras.main.startFollow(this.player, true, 0.25, 0.25);

    // Créer le groupe de farmables
    this.farmableGroup = this.physics.add.group();
    // Initialiser le groupe des ressources
    this.resourceGroup = this.physics.add.group();

    this.syncFarmables();

    this.player.setDisplaySize(32, 32);

    this.playerHP = new HealthBar(this);

    this.input.keyboard.on("keydown-P", () => {
      this.playerHP.removeHealth(10);
    });
  }

  update() {
    // Gestion des mouvements du joueur
    this.handlePlayerMovement();

    // Attaquer les farmables en appuyant sur "E"
    if (
      Phaser.Input.Keyboard.JustDown(
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
      )
    ) {
      // Vérifier la collision manuellement
      this.farmableGroup.children.each((farmableElement) => {
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(
            this.player.getBounds(),
            farmableElement.getBounds()
          )
        ) {
          this.hitFarmable(this.player, farmableElement);
        }
      });
    }
    if (this.playerHP.currentHealth <= 0) {
      this.scene.start("scene-menu");
    }

    this.updateOtherPlayers();
  }

  handlePlayerMovement() {
    //changements (mouvements, play anims, ...)
    const { up, down, left, right } = this.cursor;

    let velocityX = 0;
    let velocityY = 0;

    if (left.isDown && !right.isDown) {
      velocityX = -this.playerSpeed;
    } else if (right.isDown && !left.isDown) {
      velocityX = this.playerSpeed;
    }

    // Déplacement vertical
    if (up.isDown && !down.isDown) {
      velocityY = -this.playerSpeed;
    } else if (down.isDown && !up.isDown) {
      velocityY = this.playerSpeed;
    }

    // Si le joueur se déplace en diagonale, on normalise la vitesse
    if (velocityX !== 0 && velocityY !== 0) {
      // Pour garder la même vitesse en diagonale
      const diagonalSpeed = this.playerSpeed / Math.sqrt(2); // Normalisation
      velocityX = velocityX > 0 ? diagonalSpeed : -diagonalSpeed;
      velocityY = velocityY > 0 ? diagonalSpeed : -diagonalSpeed;
    }

    // Applique les vitesses au joueur
    this.player.setVelocity(velocityX, velocityY);
  }

  // Méthode pour collecter une ressource
  collectResource(resourceType, quantity) {
    if (this.resources[resourceType]) {
      this.resources[resourceType].add(quantity);
      console.log(
        `${quantity} ${resourceType} ajouté. Total : ${this.resources[resourceType].quantity}`
      );
    }
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

  hitFarmable(player, farmableElement) {
    const farmable = farmableElement.farmableData;
    const ressourceDrop = farmableElement.ressourceDrop;

    
    if (farmable) {
      socket.emit('hitFarmable', farmableElement.id);

      this.createResource(
        ressourceDrop,
        farmableElement.x + farmableElement.displayWidth / 2,
        farmableElement.y + farmableElement.displayHeight / 2,
        farmableElement.displayWidth,
        farmableElement.displayHeight
      );
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

  createResource(type, x, y, sizeX, sizeY) {
    // Générer des positions aléatoires autour du farmable
    const offsetX = Phaser.Math.Between(-sizeX, sizeX); // Décalage horizontal aléatoire
    const offsetY = Phaser.Math.Between(-sizeY, sizeY); // Décalage vertical aléatoire
    const resourceX = x + offsetX;
    const resourceY = y + offsetY;

    // Créer une instance de ressource dans le groupe à la position générée
    const resourceElement = this.resourceGroup.create(
      resourceX,
      resourceY,
      type
    );
    resourceElement.setDisplaySize(30, 30);

    // Ajouter une physique de collision pour permettre la collecte
    this.physics.add.overlap(
      this.player,
      resourceElement,
      (player, resource) => {
        // Quand le joueur marche sur la ressource, elle est collectée
        this.collectResource(type, 1); // Ajouter la ressource à la collection
        resource.destroy(); // Supprimer la ressource visuelle après collecte
      },
      null,
      this
    );
  }

  collectResource(type, quantity) {
    // Ajouter des ressources à la collecte globale
    if (this.resources[type]) {
      this.resources[type].add(quantity);
      console.log(
        `Ressource ${type} collectée: ${quantity}, total: ${this.resources[type].quantity}`
      );
    } else {
      console.log(`Ressource ${type} non définie.`);
    }
  }

  updateOtherPlayers(){
    socket.emit('updatePlayers', {y: this.player.y, x: this.player.x});
    socket.on('updatePlayers', function(data) {
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
        if (otherPlayers[i].id != socket.id) {
          var newPlayer = this.physics.add.image(otherPlayers[i].x, otherPlayers[i].y, "player");
          newPlayer.setImmovable(true);
          newPlayer.body.allowGravity = false;
          otherPlayerSprites.push(newPlayer);
        }
      }
    }
  }

  syncFarmables() {
    // Recevoir les farmables existants lors de la connexion
    socket.on('farmableList', (farmables) => {
        console.log('Liste des farmables reçue');
        farmables.forEach(farmable => {
          console.log('Farmable venant de liste reçu ' + farmable.id)
          if (!existingFarmables.has(farmable.id)) { // Vérifier si le farmable existe déjà
            this.createFarmable(farmable.type, farmable.x, farmable.y, farmable.id, farmable.hp);
            existingFarmables.add(farmable.id); // Ajouter l'ID à l'ensemble
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

    socket.emit('requestFarmables');

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
    });

    socket.on('farmableDestroyed', (farmableId) => {
      // Logique pour détruire le farmable sur le client
      const farmableElement = this.farmableGroup.getChildren().find(farmable => farmable.id === farmableId);
      if (farmableElement) {
          farmableElement.destroy(); // Détruire l'élément visuel
          console.log(`Farmable avec ID ${farmableId} détruit sur le client`);
      }
    });
  }
}
