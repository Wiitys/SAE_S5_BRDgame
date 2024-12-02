import HealthBar from "../Classes/HealthBar.js";
import Farmable from "../Classes/Farmable.js";

export default class Player extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, "player");
    
    // Initialisation du joueur
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.scene = scene;
    this.setDisplaySize(32, 32);
    this.body.allowGravity = false;
    
    // Paramètres et contrôles du joueur
    this.isPlayer = true;
    this.damageReduction = 0;
    this.playerSpeed = 200;
    this.lastDirection = "up";
    this.equippedTool = null;
    this.toolSprite = null;
    this.cursor = scene.input.keyboard.createCursorKeys();
    this.EKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.AKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);

    // Gestion de la vie
    this.playerHP = new HealthBar(scene);

    // Paramètres d'attaque en cône
    this.attackConeAngle = Phaser.Math.DegToRad(45);
    this.attackRange = 50; 
    this.attackDamageEntities = 1;
    this.attackDamageFarmables = 1;

    // Création d'un graphique pour afficher la hitbox du cône
    this.attackConeGraphic = scene.add.graphics({ lineStyle: { width: 2, color: 0xff0000 } });

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
  // Méthode de gestion d'attaque en cône
  attackCone(attackRange = this.attackRange, attackConeAngle = this.attackConeAngle, attackDamageFarmables = this.attackDamageFarmables, attackDamageEntities = this.attackDamageEntities) {

    // Calculer le centre de la hitbox du joueur
    const { centerX, centerY } = this.getBounds();

    // Obtenir l'angle d'attaque en fonction de la dernière direction
    const attackRotation = this.getAttackRotation();

    // Afficher le cône d'attaque
    this.showAttackCone(centerX, centerY, attackRotation, attackRange, attackConeAngle);

    // Liste des cibles potentielles
    const farmables = this.scene.farmableGroup.getChildren();
    
    // Vérifier les collisions dans le cône pour chaque type de cible
    farmables.forEach(target => {
      // Obtenir les coins de la bounding box de la cible
      const targetBounds = target.getBounds();
      const targetPoints = [
        { x: targetBounds.left, y: targetBounds.top },    // coin supérieur gauche
        { x: targetBounds.right, y: targetBounds.top },   // coin supérieur droit
        { x: targetBounds.right, y: targetBounds.bottom }, // coin inférieur droit
        { x: targetBounds.left, y: targetBounds.bottom }  // coin inférieur gauche
      ];

      // Vérifier si au moins un point de la bounding box est dans le cône
      const isTargetInCone = targetPoints.some(point => {
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        const distance = Phaser.Math.Distance.Between(centerX, centerY, point.x, point.y);

        // Vérifier la distance par rapport au range
        if (distance <= attackRange) {
          const TargetAngle = Math.atan2(dy, dx);
          const angleDifference = Phaser.Math.Angle.Wrap(TargetAngle - attackRotation);

          // Vérifier si le point est dans l'angle d'attaque
          return Math.abs(angleDifference) <= attackConeAngle;
        }
        return false;
      });

      // Si la bounding box de la cible est dans le cône, appliquer l'attaque
      if (isTargetInCone) {
        this.hitTarget(target, attackDamageFarmables, attackDamageEntities);
      }
    });
  }

  // Méthode pour afficher la hitbox du cône avec des paramètres passés
  showAttackCone(centerX, centerY, attackRotation, attackRange, attackConeAngle) {
    this.attackConeGraphic.clear(); // Effacer les anciens dessins

    // Définir les angles de début et de fin du cône d'attaque
    const startAngle = attackRotation - attackConeAngle / 2;
    const endAngle = attackRotation + attackConeAngle / 2;

    // Dessiner le cône
    this.attackConeGraphic.beginPath();
    this.attackConeGraphic.moveTo(centerX, centerY);
    this.attackConeGraphic.arc(centerX, centerY, attackRange, startAngle, endAngle, false);
    this.attackConeGraphic.closePath();
    this.attackConeGraphic.strokePath();

    // Effacer la hitbox après un court délai (par exemple, 200 ms)
    this.scene.time.delayedCall(200, () => this.attackConeGraphic.clear(), [], this);
  }

    // Calculer l’angle d’attaque basé sur la dernière direction
  getAttackRotation() {
    switch (this.lastDirection) {
      case "up":
        return -Math.PI / 2;
      case "down":
        return Math.PI / 2;
      case "left":
        return Math.PI;
      case "right":
        return 0;
    }
  }
  
  // Interaction avec les farmables
  interactWithFarmable(farmableGroup) {
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
  
  // Gestion des réductions de dommage
  takeDamage(attackDamage) {
    this.playerHP.removeHealth(attackDamage*(1-this.damageReduction));
  }

  // Gestion des effets d’une attaque sur une cible
  hitTarget(target, attackDamageFarmables, attackDamageEntities) {
    if(target.isEnnemy){
      //logique pour infliger des dommages aux ennemies
    }
    else if(target.isPlayer){
      target.takeDamage(attackDamageEntities); 
    }
    else{
      this.scene.hitFarmable(this, target, attackDamageFarmables);
    }
  }

  equipTool(tool) {
    this.equippedTool = tool;
    console.log(tool.type)
    // Si un outil est déjà affiché, changez son sprite
    if (this.toolSprite) {
        this.toolSprite.setTexture(this.equippedTool.type);
        this.toolSprite.setDisplaySize(12,24)
        console.log("outil changé")
    } else {
        // Sinon, créez le sprite pour l'outil
        this.toolSprite = this.scene.add.sprite(this.x + 16, this.y, this.equippedTool.type);
        this.toolSprite.setDisplaySize(12,24)
        console.log("outil créé")
    }
}

  update() {
    this.handleMovement();

    if (Phaser.Input.Keyboard.JustDown(this.AKey)) {
      if(this.equippedTool){
        this.attackCone(this.equippedTool.range, this.equippedTool.angle, this.equippedTool.farmableDamage, this.equippedTool.attackDamage)
      }else{
        this.attackCone();
      }
    }

    this.toolSprite.setPosition(this.x + 16, this.y);

    if (this.playerHP.currentHealth <= 0) {
      this.scene.scene.start("scene-menu");
    }
  }
}
