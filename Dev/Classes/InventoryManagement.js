import Ressource from "./Ressource.js";
import Tool from "./Tool.js";
import Craftable from "./Craftable.js";
import socket from '../Modules/socket.js';

export default class Inventory {
    constructor(scene, maxSlots = 15, rows = 3, cols = 5) {
        this.scene = scene; // Référence à la scène Phaser
        this.maxSlots = maxSlots;
        this.rows = rows;
        this.cols = cols;
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
            ironIngot: new Craftable("Ressource", "ironIngot", 1, { moltenIron: 2 }),
            woodenAxe: new Craftable("Tool", "woodenAxe", 1, { plank: 3, stick: 2 }),
            woodenPickaxe: new Craftable("Tool", "woodenPickaxe", 1, { plank: 3, stick: 2 }),
            stoneAxe: new Craftable("Tool", "stoneAxe", 1, { stone: 3, stick: 2 }),
            stonePickaxe: new Craftable("Tool", "stonePickaxe", 1, { stone: 3, stick: 2 }),
            ironSword: new Craftable("Tool", "ironSword", 1, { ironIngot: 2, stick: 2}),
            ironAxe: new Craftable("Tool", "ironAxe", 1, { ironIngot: 3, stick: 2}),
            ironPickaxe: new Craftable("Tool", "ironPickaxe", 1, { ironIngot: 3, stick: 2}),
        };
        this.tools = {
            woodenPickaxe: new Tool('woodenPickaxe', 60, 20, 3, 2),
            stonePickaxe: new Tool('stonePickaxe', 45, 90, 4, 3),
            woodenAxe: new Tool('woodenAxe', 30, 60, 2, 2),
            stoneAxe: new Tool('stoneAxe', 70, 90, 4, 3),
            ironSword: new Tool('ironSword', 90, 70, 0, 10),
            ironAxe: new Tool('ironAxe', 70, 90, 8, 5),
            ironPickaxe: new Tool('stonePickaxe', 45, 90, 8, 5)
        };
        this.foods = {
            meat: { type: 'meat', value: 20},
        }
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
        if (this.inventory[type]) {
            // Gestion des ressources ou nourritures existantes
            if (category === "Ressource" || category === "Food") {
                this.inventory[type].item.quantity += quantity;
            } else if (category === "Tool") {
                // Permettre l'ajout d'un outil dans un autre slot
                let slot = this.slots.findIndex(s => s === 0);
                if (slot === -1) {
                    console.log("Inventaire plein, impossible d'ajouter un autre outil.");
                    return;
                }
                // Ajouter l'outil dans un nouveau slot
                this.inventory[`${type}-${slot}`] = { item: this.tools[type], slot: slot };
                this.inventory[`${type}-${slot}`].item.quantity = 1;
                this.slots[slot] = 1;
            }
        } else {
            // Trouver un slot libre pour les nouveaux objets
            let slot = this.slots.findIndex(s => s === 0);
            if (slot === -1) {
                console.log("Inventaire plein !");
                return;
            }
    
            // Ajout d'un nouvel item dans un slot libre
            if (category === "Ressource") {
                this.inventory[type] = { item: new Ressource(type, quantity), slot: slot };
            } else if (category === "Food") {
                this.inventory[type] = {
                    item: { 
                        category: category, 
                        type: this.foods[type].type, 
                        quantity: quantity, 
                        value: this.foods[type].value 
                    }, 
                    slot: slot 
                };
            } else if (category === "Tool") {
                this.inventory[type] = { item: this.tools[type], slot: slot };
                this.inventory[type].item.quantity = 1;
            }
    
            // Marquer le slot comme occupé
            this.slots[slot] = 1;
        }
    
        // Déclencher les mises à jour
        this.triggerUpdate();
    }
    

    removeItem(slotIndex, quantity) {
        if (this.slots[slotIndex] === 0) {
            console.log(`Le slot ${slotIndex} est vide.`);
            return;
        }
    
        const itemKey = Object.keys(this.inventory).find(key => this.inventory[key].slot === slotIndex);
        
        if (!itemKey) {
            console.log(`Aucun objet trouvé dans le slot ${slotIndex}.`);
            return;
        }
    
        const item = this.inventory[itemKey];
        console.log(item);
    
        if(item.item.category != "Tool"){
            if (item.item.quantity >= quantity) {
                item.item.quantity -= quantity;
                console.log(`${quantity} ${item.item.type} retiré(s) du slot ${slotIndex}.`);
            } else {
                console.log(`Quantité insuffisante dans le slot ${slotIndex}. Suppression de tous les ${item.item.quantity} restants.`);
                quantity = item.item.quantity;
                item.item.quantity = 0;
            }
        }

        // Si la quantité atteint 0, on supprime l'élément
        if (item.item.quantity <= 0 || item.item.category == "Tool") {
            delete this.inventory[itemKey];
            this.slots[slotIndex] = 0; // Libère le slot
            console.log(`Slot ${slotIndex} maintenant vide.`);
        }
    
        // Déclenche un événement pour mettre à jour l'interface utilisateur ou d'autres systèmes
        this.triggerUpdate();
    }
    

    hasItem(type, quantity) {
        return this.inventory[type] && this.inventory[type].item.quantity >= quantity;
    }

    getTools() {
        return Object.keys(this.inventory).filter(key => this.inventory[key].item instanceof Tool);
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

    dropItem(itemSlot) {    
        // Trouve la clé de l'item correspondant au slot
        const itemKey = Object.keys(this.inventory).find(key => this.inventory[key].slot === itemSlot);
    
        if (!itemKey) {
            console.log(`Aucun objet trouvé dans le slot ${itemSlot}`);
            return;
        }
    
        const item = this.inventory[itemKey];
   
        // Coordonnées pour l'objet à déposer
        const x = this.scene.player.x;
        const y = this.scene.player.y;
        const displayHeight = this.scene.player.displayHeight;
        const displayWidth = this.scene.player.displayWidth;
    
        // Création des données de l'objet à déposer
        const drop = {
            category: item.item.category,
            type: item.item.type,
            quantity: item.item.quantity,
            x: x + displayWidth / 2 + Phaser.Math.Between(20, 32),
            y: y + displayHeight / 2 + Phaser.Math.Between(-32, 32),
        };    
        // Émettre l'événement pour créer le drop
        socket.emit('createDrop', drop);
        console.log("inventory : ",this.inventory)
    
        // Appelle removeItem pour mettre à jour l'inventaire
        this.removeItem(itemSlot, item.item.quantity);
    }
    
    
    
    equipItem(key){
        this.scene.player.equipTool(this.inventory[key].item);
        console.log(`Outil sélectionné : ${key}`);
    }
    
    unequipItem() {
        this.scene.player.unequipTool();
        console.log(`Outils désélectionnés`);
    }

    getItemQuantity(key) {
        return this.inventory[key].item?.quantity || 0;
    }

    getInventoryKey() {
        return Object.keys(this.inventory);   
    }

    //Méthode récupérant les slots utilisés 1 ou non 0
    getSlots() {
        return this.slots;
    }
    
    changeSlot(fromSlot, toSlot) {
        // Trouver l'item dans le slot "fromSlot"
        const fromItemKey = Object.keys(this.inventory).find(key => this.inventory[key].slot === fromSlot);
        
        if (!fromItemKey) {
            console.log(`Le slot ${fromSlot} est vide, impossible de déplacer un item.`);
            return;
        }
    
        // Trouver l'item dans le slot "toSlot" (s'il existe)
        const toItemKey = Object.keys(this.inventory).find(key => this.inventory[key].slot === toSlot);
    
        if (toItemKey) {
            // Si le slot de destination est occupé, échanger les slots entre les deux items
            console.log(`Le slot ${toSlot} est déjà occupé, échange des items.`);
            
            // Échanger les slots entre les deux items
            this.inventory[fromItemKey].slot = toSlot;
            this.inventory[toItemKey].slot = fromSlot;
    
        } else {
            // Si le slot de destination est libre, déplacer simplement l'item
            console.log(`Déplacement de l'item du slot ${fromSlot} vers le slot ${toSlot}.`);
            this.inventory[fromItemKey].slot = toSlot;
    
            // Mettre à jour les états des slots
            this.slots[toSlot] = 1;  // Le slot de destination est occupé
            this.slots[fromSlot] = 0; // Le slot de départ est libéré
        }
    
        // Déclencher la mise à jour
        this.triggerUpdate();
    
        console.log(`L'élément ${fromItemKey} a été déplacé du slot ${fromSlot} vers le slot ${toSlot}.`);
        if (toItemKey) {
            console.log(`L'élément ${toItemKey} a été déplacé du slot ${toSlot} vers le slot ${fromSlot}.`);
        }
    }
    
    
    
    
}
