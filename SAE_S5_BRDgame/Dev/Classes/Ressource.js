export default class Ressource{
  constructor(type, quantity = 0) {
    this.type = type;      // Type de ressource : bois, charbon, viande, etc.
    this.quantity = quantity;  // Quantité de la ressource
  }
  
  addResource(quantity) {
    this.quantity += quantity;  // Ajouter une quantité à la ressource
  }
  
  removeResource(quantity) {
    if (this.quantity >= quantity) {
      this.quantity -= quantity;  // Retirer une quantité si elle est disponible
    } else {
      console.log("Pas assez de ressources.");
    }
  }
}