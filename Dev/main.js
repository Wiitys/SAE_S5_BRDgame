import './style.css'
import Phaser from 'phaser'

class GameScene extends Phaser.Scene{
  constructor(){
    super("scene-game")
  }

  preload(){
    //load les sprites, sons, animations
  }

  create(){
    //créer les instances
  }

  update(){
    //changements (mouvements, play anims, ...)
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
    debug:true
  },
  scene:[GameScene]
}

const game = new Phaser.Game(config)

