import './style.css'
import Phaser from 'phaser'

class GameScene extends Phaser.Scene{
  constructor(){
    super("scene-game")
    this.player
    this.cursor
    this.playerSpeed = 200
  }

  preload(){
    //load les sprites, sons, animations
    this.load.image("player", "\assets\player.png")
  }

  create(){
    //créer les instances
    this.player = this.physics.add.image(0, 0, "player").setOrigin(0,0)
    this.player.setImmovable(true)
    this.player.body.allowGravity = false
    this.cursor = this.input.keyboard.createCursorKeys()
  }

  update(){
    //changements (mouvements, play anims, ...)
    const {up, down, left, right} = this.cursor

    let velocityX = 0;
    let velocityY = 0;
    
    if (left.isDown && !right.isDown) {
      velocityX = -this.playerSpeed;
    } else if (right.isDown && !left.isDown) {
      velocityX = this.playerSpeed;
    }
  
    // Déplacement vertical
    if (up.isDown && !down.isDown) {
      velocityY = -this.playerSpeed;
    } else if ( down.isDown && ! up.isDown) {
      velocityY = this.playerSpeed;
    }
  
    // Si le joueur se déplace en diagonale, on normalise la vitesse
    if (velocityX !== 0 && velocityY !== 0) {
      // Pour garder la même vitesse en diagonale
      const diagonalSpeed = this.playerSpeed / Math.sqrt(2); // Normalisation
      velocityX = velocityX > 0 ? diagonalSpeed : -diagonalSpeed;
      velocityY = velocityY > 0 ? diagonalSpeed : -diagonalSpeed;
    }
  
    // Applique les vitesses au joueur
    this.player.setVelocityX(velocityX);
    this.player.setVelocityY(velocityY);
  }
}

//config du jeu
const config = {
  type:Phaser.WEBGL,
  width: 500,
  height: 500,
  canvas: gameCanvas,
  physics:{
    default:"arcade",
    arcade:{
      debug:true
    }
  },
  scene:[GameScene]
}

const game = new Phaser.Game(config)

