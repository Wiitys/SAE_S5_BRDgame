export default class RangedWeapon{
    constructor(type, quantity = 0, range = 200, attackDamage = 1) {
      this.type = type;      // Type de tool : bow, orb, staff, etc.
      this.quantity = quantity;  // Quantité de tools
      this.range = range;
      this.attackDamage = attackDamage;
      this.isRanged = true;
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