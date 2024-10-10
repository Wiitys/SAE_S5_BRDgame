import Ressource from "../Classes/Ressource.js";
import Farmable from "../Classes/Farmable.js";
import HealthBar from "../Classes/HealthBar.js";
import Craftable from "../Classes/Craftable.js";
import Tool from "../Classes/Tool.js";

export class GameScene extends Phaser.Scene {
	constructor() {
		super("scene-game");
		this.player;
		this.cursor;
		this.playerSpeed = 200;
		this.playerHP;
		this.farmableGroup;
		this.resourcesGroup;
		this.resources = {};
		this.tools = {};
		this.craftables = {
			stick: new Craftable("ressource", "stick", 2, {wood: 1}),
			plank: new Craftable("ressource", "plank", 4, {wood: 2}),
			woodenAxe: new Craftable("item", "woodenAxe", 1, {plank: 3, stick: 2}),
			woodenPickaxe: new Craftable("item", "woodenPickaxe", 1, {plank: 3, stick: 2}),
			stoneAxe: new Craftable("item", "stoneAxe", 1, {stone: 3, stick: 2}),
			stonePickaxe: new Craftable("item", "stonePickaxe", 1, {stone: 3, stick: 2})
		};
		this.craftSelected;
		this.inventoryText;
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
		this.player = this.physics.add.image(0, 0, "player").setOrigin(0, 0);
		this.player.setImmovable(true);
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
		
		const inventoryTitleText = this.add.text(0, 0, 'Inventaire', { fontSize: '24px', fill: '#fff' })
		.setOrigin(0,0)
		.setPosition(this.cameras.main.width * 0.02, this.cameras.main.height *0.15)
		.setScrollFactor(0);
		
		this.inventoryText = this.add.text(0, 0, '', { fontSize: '16px', fill: '#fff' })
		.setOrigin(0,0)
		.setPosition(this.cameras.main.width * 0.02, this.cameras.main.height *0.20)
		.setScrollFactor(0);
		
		Object.keys(this.resources).forEach((element) => {
			this.inventoryText.appendText("\n" + element + " " + this.resources[element].quantity)
		});
		
		const craftButton = this.add.text(200, 300, 'Craft', { fontSize: '32px', fill: '#fff' })
		.setOrigin(0.5,0.5)
		.setPosition(this.cameras.main.width / 2, this.cameras.main.height *0.8)
		.setInteractive()
		.setScrollFactor(0);
		
		const selectStickButton = this.add.text(200, 300, 'Stick', { fontSize: '16px', fill: '#fff' })
		.setOrigin(0.5,0.5)
		.setPosition(this.cameras.main.width * 0.25, this.cameras.main.height *0.85)
		.setInteractive()
		.setScrollFactor(0);
		
		const selectPlankButton = this.add.text(200, 300, 'Plank', { fontSize: '16px', fill: '#fff' })
		.setOrigin(0.5,0.5)
		.setPosition(this.cameras.main.width * 0.25, this.cameras.main.height *0.95)
		.setInteractive()
		.setScrollFactor(0);
		
		const selectWoodenAxeButton = this.add.text(200, 300, 'woodenAxe', { fontSize: '16px', fill: '#fff' })
		.setOrigin(0.5,0.5)
		.setPosition(this.cameras.main.width * 0.5, this.cameras.main.height *0.85)
		.setInteractive()
		.setScrollFactor(0);
		
		const selectWoodenPickaxeButton = this.add.text(200, 300, 'woodenPickaxe', { fontSize: '16px', fill: '#fff' })
		.setOrigin(0.5,0.5)
		.setPosition(this.cameras.main.width * 0.5, this.cameras.main.height *0.95)
		.setInteractive()
		.setScrollFactor(0);
		
		const selectStoneAxeButton = this.add.text(200, 300, 'stoneAxe', { fontSize: '16px', fill: '#fff' })
		.setOrigin(0.5,0.5)
		.setPosition(this.cameras.main.width * 0.75, this.cameras.main.height *0.85)
		.setInteractive()
		.setScrollFactor(0);
		
		const selectStonePickaxeButton = this.add.text(200, 300, 'stonePickaxe', { fontSize: '16px', fill: '#fff' })
		.setOrigin(0.5,0.5)
		.setPosition(this.cameras.main.width * 0.75, this.cameras.main.height *0.95)
		.setInteractive()
		.setScrollFactor(0);
		
		craftButton.on('pointerdown', () => {
			this.craftingLogic()
		});
		
		selectStickButton.on('pointerdown', () => {
			this.craftSelected = "stick";
			selectStickButton.setStyle({ fill: '#ff0' });
			selectPlankButton.setStyle({ fill: '#fff' });
			selectWoodenAxeButton.setStyle({ fill: '#fff' });
			selectWoodenPickaxeButton.setStyle({ fill: '#fff' });
			selectStoneAxeButton.setStyle({ fill: '#fff' });
			selectStonePickaxeButton.setStyle({ fill: '#fff' });
		});
		
		selectPlankButton.on('pointerdown', () => {
			this.craftSelected = "plank";
			selectStickButton.setStyle({ fill: '#fff' });
			selectPlankButton.setStyle({ fill: '#ff0' });
			selectWoodenAxeButton.setStyle({ fill: '#fff' });
			selectWoodenPickaxeButton.setStyle({ fill: '#fff' });
			selectStoneAxeButton.setStyle({ fill: '#fff' });
			selectStonePickaxeButton.setStyle({ fill: '#fff' });
		});
		
		selectWoodenAxeButton.on('pointerdown', () => {
			this.craftSelected = "woodenAxe";
			selectStickButton.setStyle({ fill: '#fff' });
			selectPlankButton.setStyle({ fill: '#fff' });
			selectWoodenAxeButton.setStyle({ fill: '#ff0' });
			selectWoodenPickaxeButton.setStyle({ fill: '#fff' });
			selectStoneAxeButton.setStyle({ fill: '#fff' });
			selectStonePickaxeButton.setStyle({ fill: '#fff' });
		});
		
		selectWoodenPickaxeButton.on('pointerdown', () => {
			this.craftSelected = "woodenPickaxe";
			selectStickButton.setStyle({ fill: '#fff' });
			selectPlankButton.setStyle({ fill: '#fff' });
			selectWoodenAxeButton.setStyle({ fill: '#fff' });
			selectWoodenPickaxeButton.setStyle({ fill: '#ff0' });
			selectStoneAxeButton.setStyle({ fill: '#fff' });
			selectStonePickaxeButton.setStyle({ fill: '#fff' });
		});
		
		selectStoneAxeButton.on('pointerdown', () => {
			this.craftSelected = "stoneAxe";
			selectStickButton.setStyle({ fill: '#fff' });
			selectPlankButton.setStyle({ fill: '#fff' });
			selectWoodenAxeButton.setStyle({ fill: '#fff' });
			selectWoodenPickaxeButton.setStyle({ fill: '#fff' });
			selectStoneAxeButton.setStyle({ fill: '#ff0' });
			selectStonePickaxeButton.setStyle({ fill: '#fff' });
		});
		
		selectStonePickaxeButton.on('pointerdown', () => {
			this.craftSelected = "stonePickaxe";
			selectStickButton.setStyle({ fill: '#fff' });
			selectPlankButton.setStyle({ fill: '#fff' });
			selectWoodenAxeButton.setStyle({ fill: '#fff' });
			selectWoodenPickaxeButton.setStyle({ fill: '#fff' });
			selectStoneAxeButton.setStyle({ fill: '#fff' });
			selectStonePickaxeButton.setStyle({ fill: '#ff0' });
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
		
		this.inventoryText.setText('');
		Object.keys(this.resources).forEach((element) => {
			this.inventoryText.appendText("\n" + element + " " + this.resources[element].quantity)
		});
		Object.keys(this.tools).forEach((element) => {
			this.inventoryText.appendText("\n" + element + " " + this.tools[element].quantity)
		});
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
		if (!(type in this.resources))
			switch (type){
			case "wood":
			this.resources.wood = new Ressource(type)
			break;
			case "stone":
			this.resources.stone = new Ressource(type)
			break;
			default:
			break;
		}
		
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
	
	craftingLogic(){
		switch (this.craftSelected) {
			case "stick":
				if (!this.craftables["stick"].isCraftable(this.resources)){
					break;
				}
				if(!("stick" in this.resources)){
					this.resources.stick = new Ressource("stick")
				}
				this.craftables["stick"].craft(this.resources, this.resources)
				break;
			case "plank":
				if (!this.craftables["plank"].isCraftable(this.resources)){
					break;
				}
				if(!("plank" in this.resources)){
					this.resources.plank = new Ressource("plank")
				}
				this.craftables["plank"].craft(this.resources, this.resources)
				break;
			case "woodenAxe":
				if (!this.craftables["woodenAxe"].isCraftable(this.resources)){
					break;
				}
				if(!("woodenAxe" in this.tools)){
					this.tools.woodenAxe = new Tool("woodenAxe")
				}
				this.craftables["woodenAxe"].craft(this.resources, this.tools)
				break;
			case "woodenPickaxe":
				if (!this.craftables["woodenPickaxe"].isCraftable(this.resources)){
					break;
				}
				if(!("woodenPickaxe" in this.tools)){
					this.tools.woodenPickaxe = new Tool("woodenPickaxe")
				}
				this.craftables["woodenPickaxe"].craft(this.resources, this.tools)
				break;
			case "stoneAxe":
				if (!this.craftables["stoneAxe"].isCraftable(this.resources)){
					break;
				}
				if(!("stoneAxe" in this.tools)){
					this.tools.stoneAxe = new Tool("stoneAxe")
				}
				this.craftables["stoneAxe"].craft(this.resources, this.tools)
				break;
			case "stonePickaxe":
				if (!this.craftables["stonePickaxe"].isCraftable(this.resources)){
					break;
				}
				if(!("stonePickaxe" in this.tools)){
					this.tools.stonePickaxe = new Tool("stonePickaxe")
				}
				this.craftables["stonePickaxe"].craft(this.resources, this.tools)
				break;
			default:
				break;
		}
	}
}
