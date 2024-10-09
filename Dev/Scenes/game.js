export class GameScene extends Phaser.Scene{
    constructor(){
      super("scene-game")
    }
  
    preload(){
      //load les sprites, sons, animations
    }
  
    create(){
      //créer les instances
      this.add.text(200, 300, 'Jeu en cours...', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
    }
  
    update(){
      //changements (mouvements, play anims, ...)
    }
  }
