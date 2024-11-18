export default class Tool{
    constructor(type, quantity = 0) {
      this.type = type;      // Type de tool : pickaxe, axe, sword, etc.
      this.quantity = quantity;  // Quantité de tools
    }
    
    addTool(quantity) {
      this.quantity += quantity;  // Ajouter une quantité à la ressource
    }
    
    removeTool(quantity) {
      if (this.quantity >= quantity) {
        this.quantity -= quantity;  // Retirer une quantité si elle est disponible
      } else {
        console.log("Pas assez de ressources.");
      }
    }
  }