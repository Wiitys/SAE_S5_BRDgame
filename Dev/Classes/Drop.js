export default class Drop{
    constructor(category, type, quantity = 0, value) {
      this.category = category; // Catégorie de drop : Tool, Ressource, etc.
      this.type = type;      // Type de drop : bois, charbon, viande, etc.
      this.quantity = quantity;  // Quantité de la ressource
      this.value = value; // valeur nutritive en cas de nourriture
    }
    
    addDrop(quantity) {
      this.quantity += quantity;  // Ajouter une quantité à la ressource
    }
    
    removeDrop(quantity) {
      if (this.quantity >= quantity) {
        this.quantity -= quantity;  // Retirer une quantité si elle est disponible
      } else {
        console.log("Pas assez de drops.");
      }
    }
  }