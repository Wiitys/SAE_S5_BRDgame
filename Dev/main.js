import './styles/style.css'
import Phaser from 'phaser'
import { GameScene } from './Scenes/game.js';
import { MenuScene } from './Scenes/menu.js';

import'./Scenes/game.js'

//config du jeu
const config = {
  type:Phaser.WEBGL,
  width: 500,
  height: 500,
  canvas: gameCanvas,
  pixelArt: true, 
  physics:{
    default:"arcade",
    arcade:{
      debug:true
    }
  },
  scene:[MenuScene, GameScene]
}

const game = new Phaser.Game(config)