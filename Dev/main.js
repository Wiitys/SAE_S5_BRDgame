import './style.css'
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
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
  scene:[MenuScene, GameScene],
  autoFocus: true, // Assure que le jeu regagne le focus quand la fenêtre est réactivée
  banner: false, // (optionnel) pour désactiver la bannière dans la console
  // Permet au jeu de continuer en arrière-plan
  pauseOnBlur: false, // Empêche la pause quand l'onglet est en arrière-plan
  resumeOnFocus: true, // Reprend automatiquement quand la fenêtre est de retour
}

const game = new Phaser.Game(config)