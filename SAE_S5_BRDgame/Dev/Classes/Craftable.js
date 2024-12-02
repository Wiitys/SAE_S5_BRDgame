export default class Craftable{
    constructor(category, type, quantity = 0, recipe = {}) {
        this.category = category;   // Tool OU Ressource
        this.type = type;           // Type de Craftable : épée, stick, pioche, etc.
        this.quantity = quantity;   // Quantité par craft
        this.recipe = recipe;       // Dictionnaire de la recette du craft
    }

    isCraftable(playerInventory) {
        for (const [ingredient, amount] of Object.entries(this.recipe)) {
            if (!playerInventory.inventory[ingredient] || playerInventory.inventory[ingredient].quantity < amount) {
                return false; // Pas assez de ressources
            }
        }
        return true; // Toutes les ressources sont disponibles
    }

    craft(playerInventory, category) {
        if (!this.isCraftable(playerInventory)) {
            console.log("Pas assez de ressources.");
            return 0; // Indique que le craft a échoué
        }

        // Si toutes les ressources sont disponibles, effectue le craft
        for (const [ingredient, amount] of Object.entries(this.recipe)) {
            playerInventory.removeItem(ingredient, amount); // Retire les ressources de l'inventaire
        }
        playerInventory.addItem(category, this.type, this.quantity);

        console.log(`Crafted ${this.quantity} ${this.type}(s)!`);
    }
}