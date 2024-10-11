import Ressource from "./Ressource";
import Tool from "./Tool"

export default class Inventory{
    constructor() {
        this.inventory = {};      // Type de tool : pickaxe, axe, sword, etc.
    }
    
    addItem(category, type, quantity) {
        if (this.inventory[type]){
            this.inventory[type].quantity += quantity;
        } else if (category == "Ressource"){
            this.inventory[type] = new Ressource(type, quantity);
        } else if (category == "Tool"){
            this.inventory[type] = new Tool(type, quantity);
        }
    }
    
    removeItem(type, quantity) {
        if (this.inventory[type] && this.inventory[type].quantity >= quantity) {
            this.inventory[type].quantity -= quantity;  // Retirer une quantité si elle est disponible
        } else{
            console.log(`${type} introuvable ou ${this.inventory[type].quantity} <= ${quantity}`);
        }

        if (this.inventory[type] && this.inventory[type].quantity <= 0) {
            delete this.inventory[type];
        }
    }
    
    hasItem(type, quantity) {
        return (this.inventory[type] && this.inventory[type].quantity >= quantity)
    }
}