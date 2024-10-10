import Ressource from "./Ressource";
import Tool from "./Tool"

export default class Craftable{
    constructor(category, type, quantity = 0, recipe = {}) {
        this.category = category;   // Item OU Ressource
        this.type = type;           // Type de Craftable : épée, stick, pioche, etc.
        this.quantity = quantity;   // Quantité par craft
        this.recipe = recipe;       // Dictionnaire de la recette du craft
    }

    isCraftable(inventory) {
        for (const [ingredient, amount] of Object.entries(this.recipe)) {
            if (!inventory[ingredient] || inventory[ingredient].quantity < amount) {
                return false; // Pas assez de ressources
            }
        }
        return true; // Toutes les ressources sont disponibles
    }

    craft(resources, inventory) {
        if (!this.isCraftable(resources)) {
            console.log('Pas assez de ressources.');
            return 0; // Indique que le craft a échoué
        }

        // Si toutes les ressources sont disponibles, effectue le craft
        for (const [ingredient, amount] of Object.entries(this.recipe)) {
            resources[ingredient].remove(amount); // Retire les ressources de l'inventaire
        }
        inventory[this.type].add(this.quantity);

        console.log(`Crafted ${this.quantity} ${this.type}(s)!`);
        return this.quantity; // Renvoie la quantité créée
    }
}