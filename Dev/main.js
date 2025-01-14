import './styles/style.css'
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