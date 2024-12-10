import Ressource from "./Ressource.js";
import Tool from "./Tool.js";
import Craftable from "./Craftable.js";
import socket from '../Modules/socket.js';

export default class Inventory {
    constructor(scene, maxSlots = 10) {
        this.scene = scene; // Référence à la scène Phaser
        this.inventory = {};
        this.slots = [];

        for(var i = 0; i < maxSlots; i++) {
            this.slots.push(0)
        }

        this.maxSlots = maxSlots;
        this.craftSelected = null;
        this.craftables = {
            stick: new Craftable("Ressource", "stick", 2, { wood: 1 }),
            plank: new Craftable("Ressource", "plank", 4, { wood: 2 }),
            woodenAxe: new Craftable("Tool", "woodenAxe", 1, { plank: 3, stick: 2 }),
            woodenPickaxe: new Craftable("Tool", "woodenPickaxe", 1, { plank: 3, stick: 2 }),
            stoneAxe: new Craftable("Tool", "stoneAxe", 1, { stone: 3, stick: 2 }),
            stonePickaxe: new Craftable("Tool", "stonePickaxe", 1, { stone: 3, stick: 2 }),
        };
        this.tools = {
            woodenPickaxe: new Tool('woodenPickaxe', 1, 60, 20, 3, 2),
            stonePickaxe: new Tool('stonePickaxe', 1, 45, 90, 4, 3),
            woodenAxe: new Tool('woodenAxe', 1, 30, 60, 2, 2),
            stoneAxe: new Tool('stoneAxe', 1, 70, 90, 4, 3),
        };
        this.itemSelected = null;
        this.callbacks = []; 
    }

    onInventoryUpdate(callback) {
        this.callbacks.push(callback);
    }

    triggerUpdate() {
        this.callbacks.forEach(callback => callback());
    }
    

    getUsedSlots() {
        return Object.keys(this.inventory).length;
    }

    isFull() {
        return this.getUsedSlots() >= this.maxSlots;
    }

    addItem(category, type, quantity) {

        let slot = this.slots.findIndex(s => s === 0);
        if (slot === -1) {
            console.log("Inventaire plein !");
            return;
        }

        if (this.inventory[type]) {
            // Augmenter la quantité si l'objet existe déjà
            this.inventory[type].item.quantity += quantity;
            //console.log(this.inventory[type].item.quantity)
        } else if (category === "Ressource") {
            this.inventory[type] = {item: new Ressource(type, quantity), slot: slot};
        } else if (category === "Tool") {
            this.inventory[type] = {item: this.tools[type], slot: slot};
        }
        this.slots[slot] = 1;
        this.triggerUpdate();
    }

    removeItem(type, quantity) {
        if (this.inventory[type] && this.inventory[type].item.quantity >= quantity) {
            this.inventory[type].item.quantity -= quantity;
        } else {
            console.log(`${type} introuvable ou quantité insuffisante.`);
        }

        if (this.inventory[type] && this.inventory[type].item.quantity <= 0) {
            delete this.inventory[type];
        }
        this.triggerUpdate();
    }

    hasItem(type, quantity) {
        return this.inventory[type] && this.inventory[type].item.quantity >= quantity;
    }

    getTools() {
        return Object.keys(this.inventory).filter(key => this.inventory[key].item instanceof Tool);
    }


    selectEquippedItem(key, button) {
        this.itemSelected = key;
        Object.values(this.itemButtons).forEach(btn => btn.setStyle({ fill: '#fff' }));
        this.unequipButton.setStyle({fill: '#fff'});
        button.setStyle({ fill: '#ff0' });

        this.scene.player.equipTool(this.inventory[key].item);
        console.log(`Outil sélectionné : ${key}`);
    }

    unequipItem(button) {
        this.itemSelected = null;
        Object.values(this.itemButtons).forEach(btn => btn.setStyle({ fill: '#fff' }));
        button.setStyle({ fill: '#ff0' });

        this.scene.player.unequipTool();
        console.log(`Outils désélectionnés`);
    }

    getCraftables() {
        return this.craftables;
    }

    craftSelectedItem(craftSelected) {
        if (craftSelected) {
            const selectedCraftable = this.craftables[craftSelected];
    
            // Vérifie si l'inventaire peut contenir l'objet ou si l'objet existe déjà
            if (!this.isFull() || this.inventory[craftSelected]) {
                if (selectedCraftable.isCraftable(this)) {
                    selectedCraftable.craft(this, selectedCraftable.category);
                    console.log(`${craftSelected} a été crafté avec succès.`);
                    return true;
                } else {
                    console.log("L'objet sélectionné n'est pas craftable.");
                }
            } 
            // Vérifie si le craft peut libérer un slot
            else if (this.craftFreeSlot(selectedCraftable)) {
                selectedCraftable.craft(this, selectedCraftable.category);
                console.log(`${craftSelected} a été crafté après avoir libéré de la place.`);
            } 
            else {
                console.log("Inventaire plein, impossible de craft.");
            }
        } else {
            console.log("Aucun objet sélectionné pour le craft !");
        }
        return false;
    }

    craftFreeSlot(craftable) {
        const requiredItems = craftable.recipe;
    
        for (const [item, quantity] of Object.entries(requiredItems)) {
            if (this.inventory[item] && this.inventory[item].item.quantity <= quantity) {
                return true;
            }
        }
        return false;
    }

    dropInventory(x, y, displayWidth, displayHeight) {
        Object.keys(this.inventory).forEach(element => {
            const drop = {
                category: this.inventory[element].item.constructor.name,
                type: this.inventory[element].item.type,
                quantity: this.inventory[element].item.quantity,
                x: x + displayWidth / 2 + Phaser.Math.Between(-32, 32),
                y: y + displayHeight / 2 + Phaser.Math.Between(-32, 32),
            };

            socket.emit('createDrop', drop);
        });
    }
    
    equipItem(key){
        this.scene.player.equipTool(this.inventory[key].item);
        console.log(`Outil sélectionné : ${key}`);
    }

    getItemQuantity(key) {
        return this.inventory[key].item?.quantity || 0;
    }
    
}
