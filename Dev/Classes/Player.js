import HealthBar from "../Classes/HealthBar.js";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player");
    
    // Initialisation du joueur
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.scene = scene;
    this.setOrigin(0, 0);
    this.setDisplaySize(32, 32);
    this.body.allowGravity = false;
    
    // Paramètres et contrôles du joueur
    this.playerSpeed = 200;
    this.lastDirection = "up";
    this.cursor = scene.input.keyboard.createCursorKeys();
    this.EKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Gestion de la vie
    this.playerHP = new HealthBar(scene);

    // Charger les animations
    this.loadAnimations();

    // Action de réduction de la vie avec la touche "P" pour tester la barre de vie
    scene.input.keyboard.on("keydown-P", () => {
      this.playerHP.removeHealth(10);
    });
  }

  // Définir les animations pour le joueur
  loadAnimations() {
    // Animation pour aller à gauche et à droite
    this.scene.anims.create({
      key: 'side',
      frames: this.scene.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    // Animation pour aller vers le haut
    this.scene.anims.create({
      key: 'up',
      frames: this.scene.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    // Animation pour aller vers le bas
    this.scene.anims.create({
      key: 'down',
      frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
  }

  // Gérer les mouvements du joueur
  handleMovement() {
    const { up, down, left, right } = this.cursor;
    let velocityX = 0;
    let velocityY = 0;

    if (left.isDown && !right.isDown) {
      velocityX = -this.playerSpeed;
      this.lastDirection = "left";
    } else if (right.isDown && !left.isDown) {
      velocityX = this.playerSpeed;
      this.lastDirection = "right";
    }

    if (up.isDown && !down.isDown) {
      velocityY = -this.playerSpeed;
      this.lastDirection = "up";
    } else if (down.isDown && !up.isDown) {
      velocityY = this.playerSpeed;
      this.lastDirection = "down";
    }

    if (velocityX !== 0 && velocityY !== 0) {
      const diagonalSpeed = this.playerSpeed / Math.sqrt(2);
      velocityX = velocityX > 0 ? diagonalSpeed : -diagonalSpeed;
      velocityY = velocityY > 0 ? diagonalSpeed : -diagonalSpeed;
    }

    this.setVelocity(velocityX, velocityY);

    if (velocityX === 0 && velocityY === 0) {
      this.anims.stop();
      this.updateIdleFrame();
    } else {
      this.playAnimation();
    }
  }

  playAnimation() {
    switch (this.lastDirection) {
      case "up":
        this.flipX = false;
        this.play("up", true);
        break;
      case "down":
        this.flipX = false;
        this.play("down", true);
        break;
      case "left":
        this.flipX = true;
        this.play("side", true);
        break;
      case "right":
        this.flipX = false;
        this.play("side", true);
        break;
    }
  }

  updateIdleFrame() {
    switch (this.lastDirection) {
      case "left":
      case "right":
        this.setFrame(3);
        break;
      case "down":
        this.setFrame(0);
        break;
      case "up":
        this.setFrame(6);
        break;
    }
  }

  // Interaction avec les farmables
  interactWithFarmable(farmableGroup) {
    if (Phaser.Input.Keyboard.JustDown(this.EKey)) {
      farmableGroup.children.each((farmableElement) => {
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(
            this.getBounds(),
            farmableElement.getBounds()
          )
        ) {
          this.scene.hitFarmable(this, farmableElement);
        }
      });
    }
  }

  update() {
    this.handleMovement();

    if (this.playerHP.currentHealth <= 0) {
      this.scene.scene.start("scene-menu");
    }
  }
}
