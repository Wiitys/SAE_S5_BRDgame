export default class HealthBar {
  constructor(
    game,
    providedConfig = this.DefaultConfiguration(),
    maxHealth = 100,
    currentHealth = 100
  ) {
    this.game = game;
    this.maxHealth = maxHealth;
    this.currentHealth = currentHealth;

    // Configuration de la barre de santé
    this.setupConfiguration(providedConfig);

    // Dessin initial de la barre de santé
    this.setPosition(this.config.x, this.config.y);
    this.drawBackground();
    this.drawHealthBar();
  }

  // Configuration avec paramètres par défaut
  setupConfiguration(providedConfig) {
    this.config = this.mergeWithDefaultConfiguration(providedConfig);
  }

  mergeWithDefaultConfiguration(newConfig) {
    const defaultConfig = {
      width: 300,
      height: 30,
      x: 50,
      y: 50,
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
    const defaultConfig = {
      width: 300,
      height: 30,
      x: 100,
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
    this.background = this.game.add.graphics();
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
    this.bar = this.game.add.graphics();
    this.updateHealthBar();
    this.bar.setScrollFactor(0);
  }
}
