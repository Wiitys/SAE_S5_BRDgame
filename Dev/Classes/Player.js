import HealthBar from "./HealthBar.js";
import socket from "../Modules/socket.js"

export default class Player extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, "player");
    
    // Initialisation du joueur
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.scene = scene;
    this.setDisplaySize(32, 32);
    this.body.allowGravity = false;
    this.setDepth(1);
    this.id = socket.id
    // Paramètres et contrôles du joueur
    this.isPlayer = true;
    this.damageReduction = 0;
    this.playerSpeed = 200;
    this.lastDirection = "up";
    this.equippedTool = null;
    this.toolSprite = null;
    this.isAttackEnabled = true;
    this.cursor = scene.input.keyboard.createCursorKeys();
    this.EKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.scene.input.on("pointerdown", (pointer) => {
      if (this.isAttackEnabled && pointer.leftButtonDown()) {
        this.handleInteraction();
      }
    });

    

    // Gestion de la vie
    this.playerHP = new HealthBar(scene);

    const config = {
      width: this.scene.cameras.main.width/4,
      height: this.scene.cameras.main.height/40,
      x: this.scene.cameras.main.width/2 - (this.scene.cameras.main.width/4)/2,
      y: 100,
      background: {
        color: 0xff0000,
      },
      bar: {
        color: 0xf7bc00,
      },
    };
    this.foodometer = new HealthBar(scene, config, 45, 45);
    this.startHungerManagement();

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

    this.scene.anims.create({
      key: 'slash',
      frames: this.anims.generateFrameNumbers('sword_slash', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0
    });
  }

  handleInteraction(){
    if(this.equippedTool){
      switch (this.equippedTool.category){
        case 'Tool':
          this.handleAttack()
          break;
        case 'Food':
          this.eatFood()
          break;
        case 'Ressource':
          //??
        default:
          this.attackCone();
          break;
      }
    } else {
      this.attackCone();
    }
  }

  handleAttack() {
    if (this.equippedTool) {
      if (!this.equippedTool.isRanged) {
        this.attackCone(this.equippedTool.range, this.equippedTool.angle, this.equippedTool.farmableDamage, this.equippedTool.attackDamage);
      } else {
        this.rangedAttack(this.equippedTool.range, this.equippedTool.attackDamage);
      }
    } else {
      this.attackCone();
    }
  }

  // Gérer les mouvements du joueur
  handleMovement() {
    const { up, down, left, right } = this.cursor;
    let velocityX = 0;
    let velocityY = 0;

    if (left.isDown && !right.isDown) {
      velocityX = -this.playerSpeed;
      this.lastDirection = "left";
      this.updateServerDirection();
    } else if (right.isDown && !left.isDown) {
      velocityX = this.playerSpeed;
      this.lastDirection = "right";
      this.updateServerDirection();
    }

    if (up.isDown && !down.isDown) {
      velocityY = -this.playerSpeed;
      this.lastDirection = "up";
      this.updateServerDirection();
    } else if (down.isDown && !up.isDown) {
      velocityY = this.playerSpeed;
      this.lastDirection = "down";
      this.updateServerDirection();
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
  
  // Méthode pour informer le serveur
  updateServerDirection() {
    socket.emit("playerDirectionChanged", {
        id: this.id, // Identifiant du joueur
        lastDirection: this.lastDirection,
    });
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
  attackCone(
      attackRange = this.attackRange, 
      attackConeAngle = this.attackConeAngle, 
      attackDamageFarmables = this.attackDamageFarmables, 
      attackDamageEntities = this.attackDamageEntities
    ) {
        // Calculer le centre de la hitbox du joueur
        const { centerX, centerY } = this.getBounds();
    
        // Obtenir l'angle d'attaque en fonction de la dernière direction
        const [attackRotation, mouseX, mouseY] = this.getAttackRotation();
    
        // Calculer la position de l'animation (sommet du cône au centre du personnage)
        const animationX = centerX;
        const animationY = centerY;
    
        // Largeur du cône à sa portée maximale (arc arrondi)
        const coneWidthAtRange = 2 * Math.tan(attackConeAngle / 2) * attackRange;
    
        // Ajuster l'échelle de l'animation
        const animationScaleX = attackRange / 32; // Ajuster selon la hauteur (portée)
        const animationScaleY = coneWidthAtRange / 32; // Ajuster selon la largeur du cône
    
        // **Afficher l'animation d'attaque**
        const slash = this.scene.add.sprite(animationX, animationY, 'sword_slash');
        
        // Origine du sprite au sommet du cône
        slash.setOrigin(0, 0.5); // Centre horizontalement, sommet du cône (en haut) pour que la base s'étende dans la direction de l'attaque
        slash.setRotation(attackRotation); // Faire pivoter l'animation pour qu'elle pointe dans la bonne direction
        slash.setScale(animationScaleX, animationScaleY); // Ajuster l'échelle en fonction du cône
        slash.play('slash'); // Jouer l'animation définie
    
        // Détruire le sprite après l'animation
        slash.on('animationcomplete', () => {
            slash.destroy();
        });
    
        // **Afficher le cône d'attaque pour le débogage**
        //this.showAttackCone(centerX, centerY, attackRotation, attackRange, attackConeAngle);
    
        // Vérifier les collisions dans le cône
        const farmables = this.scene.farmableGroup.getChildren();
        farmables.forEach(target => {
            const targetBounds = target.getBounds();
            const targetPoints = [
                { x: targetBounds.left, y: targetBounds.top },
                { x: targetBounds.right, y: targetBounds.top },
                { x: targetBounds.right, y: targetBounds.bottom },
                { x: targetBounds.left, y: targetBounds.bottom }
            ];
    
            const isTargetInCone = targetPoints.some(point => {
                const dx = point.x - centerX;
                const dy = point.y - centerY;
                const distance = Phaser.Math.Distance.Between(centerX, centerY, point.x, point.y);
    
                if (distance <= attackRange) {
                    const targetAngle = Math.atan2(dy, dx);
                    const angleDifference = Math.abs(Phaser.Math.Angle.Wrap(targetAngle - attackRotation));
                    return angleDifference <= attackConeAngle / 2;
                }
                return false;
            });
    
            if (isTargetInCone) {
                this.hitTarget(target, attackDamageFarmables, attackDamageEntities);
            }
        });
    }

  rangedAttack(attackRange, attackDamageEntities) {

    // Calculer le centre de la hitbox du joueur
    const { centerX, centerY } = this.getBounds();

    //const projectile = this.scene.projectiles.create(centerX, centerY, 'projectileTexture'); // Sprite pour le projectile
    
    // Obtenir l'angle d'attaque en fonction de la dernière direction
    const [attackRotation, mouseX, mouseY] = this.getAttackRotation();

    // Définir la vitesse de déplacement
    const speed = 150; // pixels par seconde

    // Synchronisation avec le serveur
    socket.emit('createProjectile', {
      x: centerX,
      y: centerY,
      targetX: mouseX,
      targetY: mouseY,
      speed: speed,
      rotation: attackRotation,
      ownerId: socket.id,
      attackDamageEntities: attackDamageEntities
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
    const pointer = this.scene.input.activePointer; // Récupère la position de la souris
    const camera = this.scene.cameras.main; // Récupère la caméra principale

    // Convertir les coordonnées écran de la souris en coordonnées monde ajustées à la caméra
    const pointerWorldX = camera.scrollX + pointer.x; 
    const pointerWorldY = camera.scrollY + pointer.y; 

    // Calculer la différence entre le joueur et la souris en coordonnées monde
    const dx = pointerWorldX - this.x;
    const dy = pointerWorldY - this.y;

    // Retourner l'angle entre le joueur et la souris
    return [Math.atan2(dy, dx), pointerWorldX, pointerWorldY];
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
      console.log(target)
      this.scene.hitFarmable(target, attackDamageFarmables);
    }
  }

  equipTool(tool) {
    this.equippedTool = tool;
    console.log(tool.type)
    console.log(tool.isRanged)
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

  unequipTool() {
    this.equippedTool = null;
    
    if(this.toolSprite){
      this.toolSprite.destroy();
      this.toolSprite = null;
    }
  }

  hungerManagement() {
    if(this.foodometer.currentHealth > 0) {
      this.foodometer.removeHealth(1)
    } else {
      this.playerHP.removeHealth(4)
    }
  }

  startHungerManagement() {
    this.foodometer.bar.setDepth(1);
    this.foodometer.background.setDepth(1);

    this.hungerInterval = setInterval(() => {
        this.hungerManagement();
    }, 10000); // 10 000 ms = 10 secondes

    this.regenInterval = setInterval(() => {
      if(this.foodometer.currentHealth >= 0.9*this.foodometer.maxHealth){
        this.playerHP.addHealth(4)
      }
    }, 4000); // 10 000 ms = 10 secondes
  }

  stopHungerManagement() {
    clearInterval(this.hungerInterval); // Arrête l'intervalle
  }

  eatFood() {
    if(this.equippedTool.value && this.equippedTool.quantity > 0){
      this.foodometer.addHealth(this.equippedTool.value);
      this.equippedTool.quantity--;
      this.scene.inventory.playerEat(this.equippedTool.type, 1);
    }

    if(this.equippedTool.quantity == 0){
      this.unequipTool()
    }
  }

  update() {
    this.handleMovement();

    if(this.equippedTool){
      this.toolSprite.setPosition(this.x + 16, this.y);
    }
    
    if (this.playerHP.currentHealth <= 0) {
      this.scene.inventory.dropInventory(this.x, this.y, this.displayWidth, this.displayHeight)
      this.scene.scene.start("scene-menu");
    }

    

    if(this.scene.inventoryUI.visible || this.scene.craftingUI.visible){
      if(this.depth != 0){
        this.setDepth(0);
        this.foodometer.bar.setDepth(0);
        this.foodometer.background.setDepth(0);
      }

      if(this.isAttackEnabled){
        this.isAttackEnabled = false;
        console.log("Attack enabled:", this.isAttackEnabled);
      }
    
    } else if (!this.scene.inventoryUI.visible && !this.scene.craftingUI.visible) {
      if(this.depth != 1){
        this.setDepth(1);
        this.foodometer.bar.setDepth(1);
        this.foodometer.background.setDepth(1);
      }
      
      if(!this.isAttackEnabled){
        this.isAttackEnabled = true;
        console.log("Attack enabled:", this.isAttackEnabled);
      }
      
    }
  }
}
