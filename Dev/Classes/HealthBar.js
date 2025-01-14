export default class HealthBar {
  constructor(
    scene,
    providedConfig = {},
    maxHealth = 100,
    currentHealth = 100
  ) {
    this.scene = scene;
    this.maxHealth = maxHealth;
    this.currentHealth = currentHealth;
    this.providedConfig = this.DefaultConfiguration()
    // Configuration de la barre de santé
    this.setupConfiguration(providedConfig);
    
    // Dessin initial de la barre de santé
    this.setPosition(this.config.x, this.config.y);
    this.drawBackground();
    this.drawHealthBar();

    // Écouteur pour la redimension du canvas
    this.scene.scale.on('resize', this.onResize, this);
  }
  
  // Configuration avec paramètres par défaut
  setupConfiguration(providedConfig) {
    this.config = this.mergeWithDefaultConfiguration(providedConfig);
  }
  
  mergeWithDefaultConfiguration(newConfig) {
    const defaultConfig = {
      width: this.scene.cameras.main.width/4,
      height: this.scene.cameras.main.height/30,
      x: this.scene.cameras.main.width/2 - (this.scene.cameras.main.width/4)/2,
      y: this.scene.cameras.main.height/30,
      background: {
        color: 0xff0000,
      },
      bar: {
        color: 0x00ff00,
      },
    };
    return this.mergeObjects(defaultConfig, newConfig);
  }
  
  DefaultConfiguration() {
    const camera = this.scene.cameras.main;
    const screenWidth = camera.width;
    const screenHeight = camera.height;
    
    const bgWidth = screenWidth * 0.8;
    const bgHeight = screenHeight * 0.8;
    const bgX = (screenWidth - bgWidth) / 2;
    const bgY = (screenHeight - bgHeight) / 2;
    
    const defaultConfig = {
      width: this.scene.cameras.main.width/4,
      height: this.scene.cameras.main.height/30,
      x: this.scene.cameras.main.width/2 - (this.scene.cameras.main.width/4)/2,
      y: 20,
      background: {
        color: 0xff0000,
      },
      bar: {
        color: 0x00ff00,
      },
    };
    return defaultConfig;
  }
  
  mergeObjects(targetObj, newObj) {
    for (const p in newObj) {
      try {
        targetObj[p] =
        newObj[p].constructor === Object
        ? this.mergeObjects(targetObj[p], newObj[p])
        : newObj[p];
      } catch (e) {
        targetObj[p] = newObj[p];
      }
    }
    return targetObj;
  }
  
  addHealth(amount) {
    this.currentHealth += amount;
    if (this.currentHealth > this.maxHealth) {
      this.currentHealth = this.maxHealth;
    }
    this.updateHealthBar();
  }
  
  removeHealth(amount) {
    if (this.currentHealth >= amount) {
      this.currentHealth -= amount;
    } else {
      this.currentHealth = 0;
      console.log("La santé est à 0.");
    }
    this.updateHealthBar();
  }
  
  updateHealthBar() {
    const healthRatio = this.currentHealth / this.maxHealth;
    this.bar.clear();
    this.bar.fillStyle(this.config.bar.color, 1);
    this.bar.fillRect(
      this.config.x,
      this.config.y,
      this.config.width * healthRatio,
      this.config.height
    );
  }
  
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  drawBackground() {
    this.background = this.scene.add.graphics();
    this.background.fillStyle(this.config.background.color, 1);
    this.background.fillRect(
      this.config.x,
      this.config.y,
      this.config.width,
      this.config.height
    );
    this.background.setScrollFactor(0);
  }
  
  drawHealthBar() {
    this.bar = this.scene.add.graphics();
    this.updateHealthBar();
    this.bar.setScrollFactor(0);
  }

  onResize(gameSize) {
    const { width, height } = gameSize;

    // Recalculer les dimensions et position en fonction de la nouvelle taille
    this.config.width = width / 4; // Largeur de la barre = 1/4 de l'écran
    this.config.height = height / 30; // Hauteur de la barre = 1/30 de l'écran
    this.config.x = (width - this.config.width) / 2; // Centrer horizontalement

    // Mettre à jour la position et les dimensions de l'arrière-plan
    this.background.clear();
    this.background.fillStyle(this.config.background.color, 1);
    this.background.fillRect(
        this.config.x,
        this.config.y,
        this.config.width,
        this.config.height
    );

    // Mettre à jour la barre de santé
    this.updateHealthBar();
}
}
