import Ressource from "./Ressource";
import Tool from "./Tool";
import Craftable from "./Craftable";
import socket from '../Modules/socket.js';

export default class Inventory {
    constructor(scene, maxSlots = 5) {
        this.scene = scene; // Référence à la scène Phaser
        this.inventory = {};
        this.inventoryText = null;
        this.maxSlots = maxSlots;
        this.craftButtons = {};
        this.craftSelected = null;
        this.craftables = {
			stick: new Craftable("Ressource", "stick", 2, {wood: 1}),
			plank: new Craftable("Ressource", "plank", 4, {wood: 2}),
			woodenAxe: new Craftable("Tool", "woodenAxe", 1, {plank: 3, stick: 2}),
			woodenPickaxe: new Craftable("Tool", "woodenPickaxe", 1, {plank: 3, stick: 2}),
			stoneAxe: new Craftable("Tool", "stoneAxe", 1, {stone: 3, stick: 2}),
			stonePickaxe: new Craftable("Tool", "stonePickaxe", 1, {stone: 3, stick: 2})
		};
        this.tools = {
            woodenPickaxe: new Tool('woodenPickaxe', 1, 60, 35, 3, 2),
            stonePickaxe: new Tool('stonePickaxe', 1, 60, 60, 4, 3),
            woodenAxe: new Tool('woodenAxe', 1, 60, 60, 2, 2),
            stoneAxe: new Tool('stoneAxe', 1, 60, 35, 4, 3),
        };
        this.itemSelected = null;
        this.itemButtons = {};
    }

    getUsedSlots() {
        return Object.keys(this.inventory).length;
    }

    isFull() {
        return this.getUsedSlots() >= this.maxSlots;
    }

    addItem(category, type, quantity) {
        if (this.inventory[type]) {
            // Augmenter la quantité si l'objet existe déjà
            this.inventory[type].quantity += quantity;
        } else if (!this.isFull()) {
            // Vérifier si l'inventaire a de la place pour un nouvel objet
            if (category === "Ressource") {
                this.inventory[type] = new Ressource(type, quantity);
            } else if (category === "Tool") {
                this.inventory[type] = this.tools[type];
            }
        } else {
            console.log("Inventaire plein, impossible d'ajouter l'objet !");
        }
    }

    removeItem(type, quantity) {
        if (this.inventory[type] && this.inventory[type].quantity >= quantity) {
            this.inventory[type].quantity -= quantity;
        } else {
            console.log(`${type} introuvable ou ${this.inventory[type]?.quantity} <= ${quantity}`);
        }

        if (this.inventory[type] && this.inventory[type].quantity <= 0) {
            delete this.inventory[type];
        }
    }

    hasItem(type, quantity) {
        return this.inventory[type] && this.inventory[type].quantity >= quantity;
    }

    getTools() {
        return Object.keys(this.inventory).filter((key) => this.inventory[key] instanceof Tool);
    }

    createUI() {
        // Texte d'inventaire
        this.inventoryText = this.scene.add.text(
            this.scene.cameras.main.width * 0.02,
            this.scene.cameras.main.height * 0.2,
            '',
            { fontSize: '16px', fill: '#fff' }
        ).setOrigin(0, 0).setScrollFactor(0);

        // Ajout d'un affichage des outils
        const tools = this.getTools();
        tools.forEach((tool, index) => {
            const button = this.scene.add.text(
                this.scene.cameras.main.width * 0.1,
                this.scene.cameras.main.height * 0.1 + index * 20,
                tool,
                { fontSize: '16px', fill: '#fff' }
            )
                .setInteractive()
                .setScrollFactor(0)
                .on('pointerdown', () => {
                    this.selectEquippedItem(tool, button)
                });

            this.itemButtons[tool] = button
        });

        // Boutons de craft
        const buttonData = [
            { label: "Stick", x: 0.25, y: 0.85, key: "stick" },
            { label: "Plank", x: 0.25, y: 0.95, key: "plank" },
            { label: "Wooden Axe", x: 0.5, y: 0.85, key: "woodenAxe" },
            { label: "Wooden Pickaxe", x: 0.5, y: 0.95, key: "woodenPickaxe" },
            { label: "Stone Axe", x: 0.75, y: 0.85, key: "stoneAxe" },
            { label: "Stone Pickaxe", x: 0.75, y: 0.95, key: "stonePickaxe" },
        ];

        buttonData.forEach(({ label, x, y, key }) => {
            const button = this.scene.add.text(
                this.scene.cameras.main.width * x,
                this.scene.cameras.main.height * y,
                label,
                { fontSize: '16px', fill: '#fff' }
            )
                .setOrigin(0.5, 0.5)
                .setInteractive()
                .setScrollFactor(0);

            button.on('pointerdown', () => {
                this.selectCraftItem(key, button);
            });

            this.craftButtons[key] = button;
        });

        // Bouton pour effectuer le craft
        const craftButton = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height * 0.8,
            'Craft',
            { fontSize: '32px', fill: '#fff' }
        )
            .setOrigin(0.5, 0.5)
            .setInteractive()
            .setScrollFactor(0);

        craftButton.on('pointerdown', () => {
            this.craftSelectedItem();
            this.updateInventoryText();
        });
    }

    updateInventoryText() {
        this.inventoryText.setText('');
        Object.keys(this.inventory).forEach((key) => {
            const { quantity } = this.inventory[key];
            this.inventoryText.appendText(`\n${key}: ${quantity}`);
        });

        Object.values(this.itemButtons).forEach(button => button.destroy());
        
        const tools = this.getTools();
        tools.forEach((tool, index) => {
            const button = this.scene.add.text(
                this.scene.cameras.main.width * 0.1,
                this.scene.cameras.main.height * 0.1 + index * 20,
                tool,
                { fontSize: '16px', fill: '#fff' }
            )
                .setInteractive()
                .setScrollFactor(0)
                .on('pointerdown', () => {
                    this.selectEquippedItem(tool, button)
                });

            this.itemButtons[tool] = button
        });
    }

    selectEquippedItem(key, button) {
        this.itemSelected = key;
        Object.values(this.itemButtons).forEach(btn => btn.setStyle({ fill: '#fff' }));
        button.setStyle({ fill: '#ff0' });

        this.scene.player.equipTool(this.inventory[key]);
        console.log(`Outil sélectionné : ${key}`);
    }

    selectCraftItem(key, button) {
        this.craftSelected = key;
        Object.values(this.craftButtons).forEach(btn => btn.setStyle({ fill: '#fff' }));
        button.setStyle({ fill: '#ff0' });
    }

    craftSelectedItem() {
        if (this.craftSelected) {
            const selectedCraftable = this.craftables[this.craftSelected];
    
            // Vérifie si l'inventaire peut contenir l'objet ou si l'objet existe déjà
            if (!this.isFull() || this.inventory[this.craftSelected]) {
                if (selectedCraftable.isCraftable(this)) {
                    selectedCraftable.craft(this, selectedCraftable.category);
                    console.log(`${this.craftSelected} a été crafté avec succès.`);
                } else {
                    console.log("L'objet sélectionné n'est pas craftable.");
                }
            } 
            // Vérifie si le craft peut libérer un slot
            else if (this.craftFreeSlot(selectedCraftable)) {
                selectedCraftable.craft(this, selectedCraftable.category);
                console.log(`${this.craftSelected} a été crafté après avoir libéré de la place.`);
            } 
            else {
                console.log("Inventaire plein, impossible de craft.");
            }
        } else {
            console.log("Aucun objet sélectionné pour le craft !");
        }
    }

    craftFreeSlot(craftable) { //
        const requiredItems = craftable.recipe;
    
        for (const [item, quantity] of Object.entries(requiredItems)) {
            if (this.inventory[item] && this.inventory[item].quantity <= quantity) {
                return true;
            }
        }
        return false;
    }

    dropInventory(x, y, displayWidth, displayHeight) {
        Object.keys(this.inventory).forEach(element => {
            const drop = {
                category: this.inventory[element].constructor.name,
                type: this.inventory[element].type,
                quantity: this.inventory[element].quantity,
                x: x + displayWidth / 2 + Phaser.Math.Between(-32, 32),
                y: y + displayHeight / 2 + Phaser.Math.Between(-32, 32),
            };

            socket.emit('createDrop', drop);
        });
    }
}
