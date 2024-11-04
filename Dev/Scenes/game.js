import Ressource from "../Classes/Ressource.js";
import Farmable from "../Classes/Farmable.js";
import Player from "../Classes/Player.js";

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
    this.player = new Player(this, 0, 0);
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
  }

  update() {
    // Gestion des mouvements du joueur
    this.player.update();
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
