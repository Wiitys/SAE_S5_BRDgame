import Ressource from "./Ressource.js";
import Tool from "./Tool.js";
import Craftable from "./Craftable.js";
import socket from '../Modules/socket.js';

export default class Inventory {
    // Constructeur de la classe Inventory
    // scene: référence à la scène actuelle dans laquelle l'inventaire est utilisé.
    // maxSlots: nombre maximum de slots disponibles dans l'inventaire.
    // rows: nombre de lignes d'affichage des slots.
    // cols: nombre de colonnes d'affichage des slots.
    constructor(scene, maxSlots = 15, rows = 3, cols = 5) {
        this.scene = scene;
        this.maxSlots = maxSlots;
        this.rows = rows;
        this.cols = cols;
        this.inventory = {};  // Objet contenant les éléments de l'inventaire
        this.slots = Array(maxSlots).fill(0); // Tableau des slots, initialisés à vide (0)
        this.craftSelected = null; // Élément actuellement sélectionné pour le craft
        this.callbacks = [];  // Liste des callbacks qui seront appelés lors de l'update de l'inventaire

        // Initialisation des catégories d'objets dans l'inventaire
        this.craftables = this.initializeCraftables();
        this.tools = this.initializeTools();
        this.foods = this.initializeFoods();
    }

    // Méthode pour initialiser les objets craftables de l'inventaire
    initializeCraftables() {
        return {
            stick: new Craftable("Ressource", "stick", 2, { wood: 1 }),
            plank: new Craftable("Ressource", "plank", 4, { wood: 2 }),
            ironIngot: new Craftable("Ressource", "ironIngot", 1, { ironOre: 2 }),
            woodenAxe: new Craftable("Tool", "woodenAxe", 1, { plank: 3, stick: 2 }),
            woodenPickaxe: new Craftable("Tool", "woodenPickaxe", 1, { plank: 3, stick: 2 }),
            stoneAxe: new Craftable("Tool", "stoneAxe", 1, { stone: 3, stick: 2 }),
            stonePickaxe: new Craftable("Tool", "stonePickaxe", 1, { stone: 3, stick: 2 }),
            ironSword: new Craftable("Tool", "ironSword", 1, { ironIngot: 2, stick: 2 }),
            ironAxe: new Craftable("Tool", "ironAxe", 1, { ironIngot: 3, stick: 2 }),
            ironPickaxe: new Craftable("Tool", "ironPickaxe", 1, { ironIngot: 3, stick: 2 })
        };
    }

    // Méthode pour initialiser les outils dans l'inventaire
    initializeTools() {
        return {
            woodenPickaxe: new Tool('woodenPickaxe', 60, 20, 3, 2),
            stonePickaxe: new Tool('stonePickaxe', 45, 90, 4, 3),
            woodenAxe: new Tool('woodenAxe', 30, 60, 2, 2),
            stoneAxe: new Tool('stoneAxe', 70, 90, 4, 3),
            ironSword: new Tool('ironSword', 90, 70, 0, 10),
            ironAxe: new Tool('ironAxe', 70, 90, 8, 5),
            ironPickaxe: new Tool('ironPickaxe', 45, 90, 8, 5)
        };
    }

    // Méthode pour initialiser les aliments dans l'inventaire
    initializeFoods() {
        return {
            meat: { type: 'meat', value: 20 }
        };
    }

    // Méthode pour ajouter une fonction de callback qui sera appelée lors de la mise à jour de l'inventaire
    // callback: fonction qui sera exécutée lors de l'appel à triggerUpdate
    onInventoryUpdate(callback) {
        this.callbacks.push(callback);
    }

    // Méthode qui appelle toutes les fonctions de callback inscrites
    triggerUpdate() {
        this.callbacks.forEach(callback => callback());
    }

    // Méthode pour obtenir le nombre d'éléments utilisés dans l'inventaire
    getUsedSlots() {
        return Object.keys(this.inventory).length;
    }

    // Méthode pour obtenir l'état des slots de l'inventaire
    getSlots() {
        return this.slots;
    }

    // Méthode pour obtenir la liste des objets craftables
    getCraftables() {
        return this.craftables;
    }

    // Méthode pour vérifier si l'inventaire est plein
    isFull() {
        return this.getUsedSlots() >= this.maxSlots;
    }

    // Méthode pour trouver un slot libre dans l'inventaire
    findFreeSlot() {
        return this.slots.findIndex(s => s === 0);  // Cherche un slot vide (0)
    }

    // Méthode pour ajouter un élément à l'inventaire
    // category: catégorie de l'objet (Ressource, Food, Tool)
    // type: type de l'objet (ex : "wood", "meat", "woodenAxe")
    // quantity: quantité de l'objet à ajouter
    addItem(category, type, quantity) {
        console.log(this.inventory);
        if (this.inventory[type]) {
            this.handleExistingItem(category, type, quantity);
        } else {
            this.addNewItem(category, type, quantity);
        }
        this.triggerUpdate();  // Déclenche une mise à jour de l'inventaire
    }

    // Méthode pour gérer un objet déjà existant dans l'inventaire
    // category: catégorie de l'objet
    // type: type de l'objet
    // quantity: quantité à ajouter
    handleExistingItem(category, type, quantity) {
        if (category === "Ressource" || category === "Food") {
            this.inventory[type].item.quantity += quantity;
        } else if (category === "Tool") {
            const slot = this.findFreeSlot();
            if (slot === -1) {
                console.log("Inventaire plein, impossible d'ajouter un autre outil.");
                return;
            }
            this.inventory[`${type}-${slot}`] = { item: this.tools[type], slot: slot };
            this.inventory[`${type}-${slot}`].item.quantity = 1;
            this.slots[slot] = 1;
        }
    }

    // Méthode pour ajouter un nouvel objet dans l'inventaire
    // category: catégorie de l'objet
    // type: type de l'objet
    // quantity: quantité de l'objet à ajouter
    addNewItem(category, type, quantity) {
        const slot = this.findFreeSlot();
        if (slot === -1) {
            console.log("Inventaire plein !");
            return;
        }

        let newItem;
        if (category === "Ressource") {
            newItem = new Ressource(type, quantity);
        } else if (category === "Food") {
            newItem = { 
                category, 
                type: this.foods[type].type, 
                quantity, 
                value: this.foods[type].value 
            };
        } else if (category === "Tool") {
            newItem = this.tools[type];
            newItem.quantity = 1;
        }

        this.inventory[type] = { item: newItem, slot: slot };
        this.slots[slot] = 1;
    }

    // Méthode pour retirer un objet de l'inventaire
    // slotIndex: index du slot à partir duquel l'élément doit être retiré
    // quantity: quantité d'éléments à retirer
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
        this.updateOrRemoveItem(item, itemKey, slotIndex, quantity);
        this.triggerUpdate();
    }

    // Méthode pour mettre à jour ou supprimer un objet de l'inventaire après l'avoir retiré
    // item: objet à mettre à jour ou retirer
    // itemKey: clé de l'objet dans l'inventaire
    // slotIndex: index du slot
    // quantity: quantité à retirer
    updateOrRemoveItem(item, itemKey, slotIndex, quantity) {
        if (item.item.category !== "Tool") {
            item.item.quantity -= quantity;
            if (item.item.quantity <= 0) {
                this.removeSlot(itemKey, slotIndex);
            }
        } else {
            this.removeSlot(itemKey, slotIndex);
        }
    }

    // Méthode pour supprimer un objet du slot de l'inventaire
    // itemKey: clé de l'objet dans l'inventaire
    // slotIndex: index du slot à vider
    removeSlot(itemKey, slotIndex) {
        delete this.inventory[itemKey];
        this.slots[slotIndex] = 0;
        console.log(`Slot ${slotIndex} maintenant vide.`);
    }

    // Méthode pour vérifier si un élément est disponible dans l'inventaire en fonction de sa quantité
    // type: type de l'objet
    // quantity: quantité de l'objet à vérifier
    hasItem(type, quantity) {
        return this.inventory[type] && this.inventory[type].item.quantity >= quantity;
    }

    // Méthode pour fabriquer un objet sélectionné
    // craftSelected: type de l'objet à fabriquer
    craftSelectedItem(craftSelected) {
        if (!craftSelected) {
            console.log("Aucun objet sélectionné pour le craft !");
            return false;
        }

        const selectedCraftable = this.craftables[craftSelected];

        if ((this.isFull() && !this.inventory[craftSelected]) && !this.craftFreeSlot(selectedCraftable)) {
            console.log("Inventaire plein, impossible de craft.");
            return false;
        }

        if (selectedCraftable.isCraftable(this)) {
            selectedCraftable.craft(this, selectedCraftable.category);
            console.log(`${craftSelected} a été crafté avec succès.`);
            return true;
        }

        console.log("L'objet sélectionné n'est pas craftable.");
        return false;
    }

    // Méthode pour vérifier s'il y a un slot libre pour fabriquer un objet
    // craftable: objet à fabriquer
    craftFreeSlot(craftable) {
        return Object.entries(craftable.recipe).some(([item, quantity]) => 
            this.inventory[item] && this.inventory[item].item.quantity <= quantity
        );
    }

    // Méthode pour faire tomber un élément de l'inventaire à un endroit donné
    // x, y: coordonnées où l'élément sera lâché
    // displayWidth, displayHeight: dimensions de l'écran ou de l'affichage
    dropInventory(x, y, displayWidth, displayHeight) {
        Object.values(this.inventory).forEach(({ item }) => {
            this.emitDrop(item, x, y, displayWidth, displayHeight);
        });
    }

    // Méthode pour émettre un événement de chute d'objet à un endroit donné
    // item: l'objet à faire tomber
    // x, y, displayWidth, displayHeight: coordonnées et dimensions de l'affichage
    emitDrop(item, x, y, displayWidth, displayHeight) {
        const drop = {
            category: item.constructor.name,
            type: item.type,
            quantity: item.quantity,
            x: x + displayWidth / 2 + Phaser.Math.Between(-32, 32),
            y: y + displayHeight / 2 + Phaser.Math.Between(-32, 32)
        };
        socket.emit('createDrop', drop);
    }

    // Méthode pour faire tomber un objet d'un slot spécifique
    // itemSlot: slot contenant l'objet à faire tomber
    dropItem(itemSlot) {
        const itemKey = Object.keys(this.inventory).find(key => this.inventory[key].slot === itemSlot);
        if (!itemKey) {
            console.log(`Aucun objet trouvé dans le slot ${itemSlot}`);
            return;
        }

        const item = this.inventory[itemKey].item;
        const { x, y, displayHeight, displayWidth } = this.scene.player;

        this.emitDrop(item, x, y, displayWidth, displayHeight);
        this.removeItem(itemSlot, item.quantity);
    }

    // Méthode pour équiper un outil à partir de l'inventaire
    // key: clé de l'outil dans l'inventaire
    equipItem(key) {
        this.scene.player.equipTool(this.inventory[key].item);
        console.log(`Outil sélectionné : ${key}`);
    }

    // Méthode pour déséquiper un outil actuellement équipé
    unequipItem() {
        this.scene.player.unequipTool();
        console.log(`Outils désélectionnés`);
    }

    //Méthode pour gérer l'inventaire lorsque le player mange
    // type : type de Food de l'aliment mangé
    // quantity : le nombre d'aliment mangé
    playerEat(type, quantity){
        const itemKey = Object.keys(this.inventory).find(key => this.inventory[key].item.type === type && this.inventory[key].item.category === "Food");

        if (itemKey) {
            const slotIndex = this.inventory[itemKey].slot;
    
            this.removeItem(slotIndex, quantity);
    
        } else {
            console.log("Aliment non trouvé.");
        }

    }

    playerCraft(category, type, quantity){
        const itemKey = Object.keys(this.craftables).find(key => this.craftables[key].type === type);
        let items = []
        let amounts = []

        if (itemKey) {
            for (const [ingredient, amount] of Object.entries(this.craftables[type].recipe)) {
                const itemToRemove = Object.keys(this.inventory).find(key => this.inventory[key].item.type === ingredient && this.inventory[key].item.quantity >= amount);
                
                if(!itemToRemove) return
                items.push(itemToRemove);
                amounts.push(amount);
            }

            for(let i=0; i<items.length; i++){
                console.log(i)
                console.log(items[i])
                const slotIndex = this.inventory[items[i]].slot
                this.removeItem(slotIndex, amounts[i]);
            }

            this.addItem(category, type, quantity)
        } else {
            console.log("Craftable non trouvé.");
        }

    }

    // Méthode pour échanger les objets entre deux slots
    // fromSlot: slot à partir duquel déplacer un objet
    // toSlot: slot vers lequel déplacer l'objet
    changeSlot(fromSlot, toSlot) {
        const fromItemKey = Object.keys(this.inventory).find(key => this.inventory[key].slot === fromSlot);
        if (!fromItemKey) {
            console.log(`Le slot ${fromSlot} est vide.`);
            return;
        }

        const toItemKey = Object.keys(this.inventory).find(key => this.inventory[key].slot === toSlot);

        if (toItemKey) {
            [this.inventory[fromItemKey].slot, this.inventory[toItemKey].slot] = 
                [this.inventory[toItemKey].slot, this.inventory[fromItemKey].slot];
        } else {
            this.inventory[fromItemKey].slot = toSlot;
            this.slots[toSlot] = 1;
            this.slots[fromSlot] = 0;
        }

        this.triggerUpdate();
    }
}
