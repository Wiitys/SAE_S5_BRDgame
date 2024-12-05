export default class Farmable{
  constructor(type, maxHp = 10) {
    this.type = type;                   // Type de Farmable : arbre, rocher, ...
    this.maxHp = maxHp;                 // Hp max du farmable
    this.currentHp = maxHp;
    this.hasSwapped = false;
  }
  
  set(type, maxHp, currentHp){
    this.type = type;
    this.maxHp = maxHp;
    this.currentHp = currentHp;
  }
  
  hit() {
    this.currentHp--;
  }
  
  isHalfHp() {
    if(this.currentHp <= this.maxHp/2 && this.currentHp > 0){
      this.hasSwapped = true
    }
    return (this.currentHp <= this.maxHp/2 && this.currentHp > 0)
  }
  
  isDestroyed() {
    return this.currentHp <= 0;
  }
}