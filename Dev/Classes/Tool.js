export default class Tool{
    constructor(type, quantity = 0, range = 60, angle = 45, farmableDamage = 1, attackDamage = 1) {
      this.type = type;      // Type de tool : pickaxe, axe, sword, etc.
      this.quantity = quantity;  // Quantité de tools
      this.range = range;
      this.angle = Phaser.Math.DegToRad(angle);
      this.farmableDamage = farmableDamage;
      this.attackDamage = attackDamage;
      this.isRanged = false;
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