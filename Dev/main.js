import './style.css'
import Phaser from 'phaser'
import { GameScene } from './Scenes/game.js';
import { MenuScene } from './Scenes/menu.js';

import'./Scenes/game.js'

//config du jeu
const config = {
  type:Phaser.WEBGL,
  width: window.innerWidth, // Utiliser la largeur de la fenêtre
  height: window.innerHeight, // Utiliser la hauteur de la fenêtre
  canvas: gameCanvas,
  pixelArt: true, 
  physics:{
    default:"arcade",
    arcade:{
      debug:true
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE, // Mode de redimensionnement dynamique
    autoCenter: Phaser.Scale.CENTER_BOTH // Centrer automatiquement le canvas
  },
  scene:[MenuScene, GameScene]
}

const game = new Phaser.Game(config)

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  game.scale.resize(width, height);
  
  game.scene.scenes.forEach(scene => {
    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.setSize(width, height);
    }
  });
});