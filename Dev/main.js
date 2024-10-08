import './style.css'
import Phaser from 'phaser'
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
    this.load.image("tree", "/assets/tree.png");
    this.load.image("wood", "/assets/wood.png");
    this.load.image("rock", "/assets/rock.png");
    this.load.image("meat", "/assets/meat.png");
  }

  create(){
    //créer les instances
    this.player = this.physics.add.image(0, 0, "player").setOrigin(0,0)
    this.player.setImmovable(true)
    this.player.body.allowGravity = false
    this.cursor = this.input.keyboard.createCursorKeys()

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
      this.farmableGroup.children.each(farmableSprite => {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), farmableSprite.getBounds())) {
          this.hitFarmable(this.player, farmableSprite);
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
    // Créer un sprite farmable
    const farmableSprite = this.farmableGroup.create(x, y, type);
    farmableSprite.setOrigin(0, 0);
    switch(type){
      case 'tree':
        farmableSprite.setDisplaySize(75, 100);
        farmableSprite.ressourceDrop = 'wood'
        break;
      case 'rock':
        farmableSprite.setDisplaySize(75, 75);
        farmableSprite.ressourceDrop = 'stone'
        break;
      default:
        farmableSprite.setDisplaySize(75, 75);
        farmableSprite.ressourceDrop = 'wood'
    }
    
    // Associer un objet Farmable au sprite
    farmableSprite.farmableData = new Farmable(type, 10)
	}

	hitFarmable(player, farmableSprite) {
		const farmable = farmableSprite.farmableData;
    const ressourceDrop = farmableSprite.ressourceDrop;

		if (farmable) {
			farmable.hit(); // Infliger des dégâts

			console.log(`HP restant pour ${farmable.type}: ${farmable.hp}`);

			if (farmable.isDestroyed()) {
				console.log(`${farmable.type} détruit !`);
				farmableSprite.destroy(); // Supprimer le farmable du jeu
			}

			this.createResource(ressourceDrop, farmableSprite.x, farmableSprite.y);
		}
	}

	createResource(type, x, y) {
		// Générer des positions aléatoires autour du farmable
		const offsetX = Phaser.Math.Between(-30, 30);  // Décalage horizontal aléatoire
		const offsetY = Phaser.Math.Between(-30, 30);  // Décalage vertical aléatoire
		const resourceX = x + offsetX;
		const resourceY = y + offsetY;
	
		// Créer un sprite de ressource dans le groupe à la position générée
		const resourceSprite = this.resourceGroup.create(resourceX, resourceY, type);
		resourceSprite.setOrigin(0, 0);
	
		// Ajouter une physique de collision pour permettre la collecte
		this.physics.add.overlap(this.player, resourceSprite, (player, resource) => {
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
  scene:[GameScene]
}

const game = new Phaser.Game(config)

