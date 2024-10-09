export default class Farmable{
  constructor(type, hp = 10) {
    this.type = type;      // Type de ressource : bois, charbon, viande, etc.
    this.hp = hp;  // Quantité de la ressource
  }

  set(type, hp){
      this.type = type;
      this.hp = hp;
  }

  hit() {
    this.hp--;
  }

  isDestroyed() {
    return this.hp <= 0;
  }
}