import './style.css'
import Phaser from 'phaser'
import { GameScene } from './Scenes/game.js';
import { MenuScene } from './Scenes/menu.js';

import'./Scenes/game.js'

import Ressource from './Ressource.js'
import Farmable from './Farmable.js'

class GameScene extends Phaser.Scene{
  constructor(){
    super("scene-game")
    this.player
    this.cursor
    this.playerSpeed = 200
	this.farmableGroup
	this.resources = {
		"wood": new Ressource("wood"),
		"stone": new Ressource("stone"),
		"meat": new Ressource("meat")
	}
	this.resourcesGroup
  }

  preload(){
    //load les sprites, sons, animations
    this.load.image("player", "/assets/player.png")

    //farmables
    this.load.image("tree", "/assets/tree.png");
    this.load.image("rock", "/assets/rock.png");

    //ressources
    this.load.image("wood", "/assets/wood.png");
    this.load.image("stone", "/assets/stone.png");
    this.load.image("meat", "/assets/meat.png");
  }

  create(){
    //créer les instances
    this.player = this.physics.add.image(0, 0, "player").setOrigin(0,0)
    this.player.setImmovable(true)
    this.player.body.allowGravity = false
    this.cursor = this.input.keyboard.createCursorKeys()

    this.cameras.main.startFollow(this.player, true, 0.25, 0.25);

    // Créer le groupe de farmables
    this.farmableGroup = this.physics.add.group();
    // Initialiser le groupe des ressources
      this.resourceGroup = this.physics.add.group();

    // Ajouter des farmables
    this.createFarmable('tree', 200, 200);
    this.createFarmable('tree', 300, 300);
    this.createFarmable('rock', 100, 150);
  }

  update(){
    // Gestion des mouvements du joueur
    this.handlePlayerMovement();

    // Attaquer les farmables en appuyant sur "E"
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E))) {
      // Vérifier la collision manuellement
      this.farmableGroup.children.each(farmableElement => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), farmableElement.getBounds())) {
          this.hitFarmable(this.player, farmableElement);
        }
      });
    }
  }

  handlePlayerMovement(){
    //changements (mouvements, play anims, ...)
    const {up, down, left, right} = this.cursor

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
    } else if ( down.isDown && ! up.isDown) {
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
      console.log(`${quantity} ${resourceType} ajouté. Total : ${this.resources[resourceType].quantity}`);
    }
  }

  createFarmable(type, x, y) {
    // Créer une instance farmable
    const farmableElement = this.farmableGroup.create(x, y, type);
    farmableElement.setOrigin(0, 0);
    switch(type){
      case 'tree':
        farmableElement.setDisplaySize(75, 100);
        farmableElement.ressourceDrop = 'wood'
        break;
      case 'rock':
        farmableElement.setDisplaySize(75, 75);
        farmableElement.ressourceDrop = 'stone'
        break;
      default:
        farmableElement.setDisplaySize(75, 75);
        farmableElement.ressourceDrop = 'wood'
    }
    
    // Associer un objet Farmable à l'instance
    farmableElement.farmableData = new Farmable(type, 10)
	}

	hitFarmable(player, farmableElement) {
		const farmable = farmableElement.farmableData;
    const ressourceDrop = farmableElement.ressourceDrop;

		if (farmable) {
			farmable.hit(); // Infliger des dégâts

			console.log(`HP restant pour ${farmable.type}: ${farmable.hp}`);

			if (farmable.isDestroyed()) {
				console.log(`${farmable.type} détruit !`);
				farmableElement.destroy(); // Supprimer le farmable du jeu
			}

			this.createResource(ressourceDrop, farmableElement.x + farmableElement.displayWidth / 2, farmableElement.y + farmableElement.displayHeight / 2, farmableElement.displayWidth, farmableElement.displayHeight);
      console.log()
		}
	}

	createResource(type, x, y, sizeX, sizeY) {
		// Générer des positions aléatoires autour du farmable
		const offsetX = Phaser.Math.Between(-sizeX, sizeX);  // Décalage horizontal aléatoire
		const offsetY = Phaser.Math.Between(-sizeY, sizeY);  // Décalage vertical aléatoire
		const resourceX = x + offsetX;
		const resourceY = y + offsetY;
	
		// Créer une instance de ressource dans le groupe à la position générée
		const resourceElement = this.resourceGroup.create(resourceX, resourceY, type);
    resourceElement.setDisplaySize(30, 30);
	
		// Ajouter une physique de collision pour permettre la collecte
		this.physics.add.overlap(this.player, resourceElement, (player, resource) => {
			// Quand le joueur marche sur la ressource, elle est collectée
			this.collectResource(type, 1);  // Ajouter la ressource à la collection
			resource.destroy();  // Supprimer la ressource visuelle après collecte
		}, null, this);
	}

	collectResource(type, quantity) {
        // Ajouter des ressources à la collecte globale
        if (this.resources[type]) {
            this.resources[type].add(quantity);
            console.log(`Ressource ${type} collectée: ${quantity}, total: ${this.resources[type].quantity}`);
        } else {
            console.log(`Ressource ${type} non définie.`);
        }
    }
}

//config du jeu
const config = {
  type:Phaser.WEBGL,
  width: 500,
  height: 500,
  canvas: gameCanvas,
  physics:{
    default:"arcade",
    arcade:{
      debug:true
    }
  },
  scene:[MenuScene, GameScene]
}

const game = new Phaser.Game(config)

