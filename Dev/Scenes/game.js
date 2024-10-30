import Ressource from "../Classes/Ressource.js";
import Farmable from "../Classes/Farmable.js";
import HealthBar from "../Classes/HealthBar.js";
import Ennemi from "../Classes/Ennemi.js";

var playerList = [];

export class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.cursor;
    this.playerSpeed = 200;
    this.farmableGroup;
    this.resources = {
      wood: new Ressource("wood"),
      stone: new Ressource("stone"),
      meat: new Ressource("meat"),
    };
    this.resourcesGroup;
    this.playerHP;
    this.ennemiMelee;
  }

  preload() {
    //load les sprites, sons, animations

    //Player
    this.load.spritesheet('player','/assets/MC/SpriteSheetMC.png', { frameWidth: 32, frameHeight: 32 });

    //Ennemis
    this.load.image("ennemi", "/assets/ennemi.png");
	  this.load.image("projectileTexture", "/assets/projectileTexture.png");
    this.load.image("meleeTexture", "/assets/meleeTexture.png");

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
	playerList.push(this.player)
    // Animation pour la direction "side"
    this.anims.create({
      key: 'side', 
      frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    // Animation pour aller vers le haut
    this.anims.create({
      key: 'up', 
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    // Animation pour aller vers le bas
    this.anims.create({
      key: 'down', 
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }), 
      frameRate: 10,
      repeat: -1
    });
    
    this.lastDirectionPlayer = 'up';


    //créer les instances
    this.player = this.physics.add.sprite(0, 0, "player");
    //this.player.setImmovable(true);
    this.player.body.allowGravity = false;
    this.cursor = this.input.keyboard.createCursorKeys();

    this.cameras.main.startFollow(this.player, true, 0.25, 0.25);

    // Créer le groupe de farmables
    this.farmableGroup = this.physics.add.group();
    // Initialiser le groupe des ressources
    this.resourceGroup = this.physics.add.group();

    // Ajouter des farmables
    this.createFarmable("tree", 200, 200);
    this.createFarmable("tree", 300, 300);
    this.createFarmable("rock", 100, 150);

    this.player.setDisplaySize(32, 32);

    this.playerHP = new HealthBar(this);

    this.input.keyboard.on("keydown-P", () => {
      this.playerHP.removeHealth(10);
    });

    this.ennemiRanged = new Ennemi(this, 400, 300, 'ennemi', 'ranged', 100, 50, 150, 300, 2000);
    this.ennemiMelee = new Ennemi(this, 400, 300, 'ennemi');
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

    this.ennemiRanged.getClosestTarget(this.player)
    this.ennemiMelee.getClosestTarget(this.player)
  }

  handlePlayerMovement() {
    //changements (mouvements, play anims, ...)
    const { up, down, left, right } = this.cursor;

    let velocityX = 0;
    let velocityY = 0;

    if (left.isDown && !right.isDown) {
      velocityX = -this.playerSpeed;
      this.lastDirectionPlayer = 'left';
    } else if (right.isDown && !left.isDown) {
      velocityX = this.playerSpeed;
      this.lastDirectionPlayer = 'right';
    }

    // Déplacement vertical
    if (up.isDown && !down.isDown) {
      velocityY = -this.playerSpeed;
      this.lastDirectionPlayer = 'up';

    } else if (down.isDown && !up.isDown) {
      velocityY = this.playerSpeed;
      this.lastDirectionPlayer = 'down';  
    }

    if (this.lastDirectionPlayer === 'up') {
      this.player.flipX = false;
      this.player.play('up', true);
    } else if (this.lastDirectionPlayer === 'down') {
      this.player.flipX = false;
        this.player.play('down', true); 
    } else if (this.lastDirectionPlayer === 'left') {
        this.player.flipX = true; 
        this.player.play('side', true); 
    } else if (this.lastDirectionPlayer === 'right') {
        this.player.flipX = false;
        this.player.play('side', true); 
    }

    // Si le joueur se déplace en diagonale, on normalise la vitesse
    if (velocityX !== 0 && velocityY !== 0) {
      // Pour garder la même vitesse en diagonale
      const diagonalSpeed = this.playerSpeed / Math.sqrt(2); // Normalisation
      velocityX = velocityX > 0 ? diagonalSpeed : -diagonalSpeed;
      velocityY = velocityY > 0 ? diagonalSpeed : -diagonalSpeed;
    }

        // Si aucune touche n'est pressée, arrêter l'animation
        if (velocityX === 0 && velocityY === 0) {
          this.player.anims.stop();  
          switch(this.lastDirectionPlayer){
            case 'left':
              this.player.setFrame(3);
              break;
            case 'right':
              this.player.setFrame(3);
              break;
            case 'down':
              this.player.setFrame(0);
              break;
            default:
              this.player.setFrame(6);
          }
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

  createFarmable(type, x, y) {
    // Créer une instance farmable
    const farmableElement = this.farmableGroup.create(x, y, type, 0);
    farmableElement.setOrigin(0, 0);

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
    farmableElement.farmableData = new Farmable(type, 10);
  }

  hitFarmable(player, farmableElement) {
    const farmable = farmableElement.farmableData;
    const ressourceDrop = farmableElement.ressourceDrop;

    if (farmable) {
      farmable.hit(); // Infliger des dégâts

      console.log(`HP restant pour ${farmable.type}: ${farmable.currentHp}`);

      if (!farmable.hasSwapped && farmable.isHalfHp()) {
        console.log(`${farmable.type} half hp !`);
        this.farmableHalfHp(farmableElement, farmable.type);
      }

      if (farmable.isDestroyed()) {
        console.log(`${farmable.type} détruit !`);
        farmableElement.destroy(); // Supprimer le farmable du jeu
      }

      this.createResource(
        ressourceDrop,
        farmableElement.x + farmableElement.displayWidth / 2,
        farmableElement.y + farmableElement.displayHeight / 2,
        farmableElement.displayWidth,
        farmableElement.displayHeight
      );
      console.log();
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
}
