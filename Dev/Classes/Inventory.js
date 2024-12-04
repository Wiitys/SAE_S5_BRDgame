import Ressource from "./Ressource";
import Tool from "./Tool";
import Craftable from "./Craftable";
import socket from '../Modules/socket.js';

export default class Inventory {
    constructor(scene) {
        this.scene = scene;
        this.inventory = {};
        this.craftables = {
            stick: new Craftable("Ressource", "stick", 2, { wood: 1 }),
            plank: new Craftable("Ressource", "plank", 4, { wood: 2 }),
            woodenAxe: new Craftable("Tool", "woodenAxe", 1, { plank: 3, stick: 2 }),
            woodenPickaxe: new Craftable("Tool", "woodenPickaxe", 1, { plank: 3, stick: 2 }),
            stoneAxe: new Craftable("Tool", "stoneAxe", 1, { stone: 3, stick: 2 }),
            stonePickaxe: new Craftable("Tool", "stonePickaxe", 1, { stone: 3, stick: 2 }),
        };
        this.tools = {
            stoneAxe: new Tool('stoneAxe', 1, 60, 60, 3, 2),
            woodenPickaxe: new Tool('woodenPickaxe', 1, 60, 35, 3, 2),
        };
    }

    addItem(category, type, quantity) {
        if (this.inventory[type]) {
            this.inventory[type].quantity += quantity;
        } else if (category === "Ressource") {
            this.inventory[type] = new Ressource(type, quantity);
        } else if (category === "Tool") {
            this.inventory[type] = this.tools[type];
        }
    }

    removeItem(type, quantity) {
        if (this.inventory[type] && this.inventory[type].quantity >= quantity) {
            this.inventory[type].quantity -= quantity;
        } else {
            console.log(`${type} introuvable ou quantité insuffisante.`);
        }

        if (this.inventory[type] && this.inventory[type].quantity <= 0) {
            delete this.inventory[type];
        }
    }

    hasItem(type, quantity) {
        return this.inventory[type] && this.inventory[type].quantity >= quantity;
    }

    getTools() {
        return Object.keys(this.inventory).filter(key => this.inventory[key] instanceof Tool);
    }

    getCraftables() {
        return this.craftables;
    }

    craftSelectedItem(craftKey) {
        const selectedCraftable = this.craftables[craftKey];
        if (selectedCraftable && selectedCraftable.isCraftable(this)) {
            selectedCraftable.craft(this, selectedCraftable.category);
            return true;
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
    
    equipItem(key){
        this.scene.player.equipTool(this.inventory[key]);
        console.log(`Outil sélectionné : ${key}`);
    }
}
