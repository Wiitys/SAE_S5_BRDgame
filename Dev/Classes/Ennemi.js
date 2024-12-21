export default class Ennemi extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, type = 'melee', behavior = 'neutral', hp = 100, speed = 50, attackRange = 100, searchRange = 200, actionDelay = 3000) {
        super(scene, x, y, texture);

        // Ajout à la scène
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.spawnX = x;
        this.spawnY = y;
        this.type = type;
        this.behavior = behavior;
        this.attackRange = attackRange; //portée à laquelle l'attaque est lancée
        this.maxAttackRange = attackRange*1.33; //portée max avant de cancel le lancement de l'attaque
        this.minAttackRange = attackRange*0.66; //portée min avant de forcer l'arrêt
        this.searchRange = searchRange;
        this.hp = hp; // Points de vie
        this.speed = speed; // Vitesse de déplacement
        this.isAttacking = false;
        this.actionDelay = actionDelay;
        this.target;
        this.targetList;
        this.distanceToTarget;
        this.isHit = false;
        this.isFleeing

        // Points de patrouille définis
        this.patrolPoints = [
            { x: x + 100, y: y },
            { x: x + 100, y: y + 100 },
            { x: x, y: y + 100 },
            { x: x, y: y } // Retour à la position de départ
        ];
        this.currentPatrolIndex = 0;
        this.isPatrolling = true;

        if (type === 'melee') {
            this.meleeEffects = scene.physics.add.group();
        }
        else {
            this.projectiles = scene.physics.add.group();
        }

        // Paramètres de base
        //this.setCollideWorldBounds(true); // Ne pas sortir du cadre de la carte
    }

    // Méthode pour gérer les comportements
    behaviorManagement() {
        switch (this.behavior) {
            case 'aggressive' :
                this.aggressiveBehavior();
                break;
            case 'neutral' :
                this.neutralBehavior();
                break;
            case 'passive' :
                this.passiveBehavior();
                break;
        }
    }

    // Méthode pour gérer le comportement aggressif
    aggressiveBehavior() {
        // Calcule la distance entre l'ennemi et le joueur
        this.distanceToTarget = Phaser.Math.Distance.Between(
            this.x + this.width / 2, this.y + this.height / 2,  // Centre de l'ennemi
            this.target.x + this.target.width / 2, this.target.y + this.target.height / 2 // Centre du joueur
        );

        const distanceSpawnToPlayer = Phaser.Math.Distance.Between(
            this.spawnX, this.spawnY,                                 // Point d'apparition
            this.target.x + this.target.width / 2, this.target.y + this.target.height / 2 // Centre du joueur
        );

        if (distanceSpawnToPlayer > this.searchRange && !this.isHit) {
            //console.log(`joueur sorti de la zone de recherche, retour au point d'apparition`)
            this.patrol();
            
        // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
        } else if (this.distanceToTarget >= this.attackRange || this.isHit) {
            this.isPatrolling = false;
            
            //console.log("joueur trouvé, poursuite lancée")
            this.scene.physics.moveToObject(this, this.target, this.speed);

        // Arrête l'ennemi s'il est à moins de sa range du joueur
        } else if (this.distanceToTarget < this.attackRange) {
            this.scene.physics.moveToObject(this, this.target, this.speed);
            if (!this.isAttacking) {
                console.log(`attaque lancée dans ${this.actionDelay/1000} sec`)
                this.attackWithDelay(); // Commence l'attaque après l'arrêt
            }
            if (this.distanceToTarget < this.minAttackRange) {
                this.body.setVelocity(0);
            }
        }

        // Vérifie si l'ennemi a atteint le point d'apparition
        const distanceToSpawn = Phaser.Math.Distance.Between(this.x, this.y, this.spawnX, this.spawnY);
        if (distanceToSpawn < 5 && this.distanceToTarget > this.searchRange) { // Seuil de distance pour considérer qu'il est arrivé
            this.body.setVelocity(0); // Arrête l'ennemi quand il est au point d'apparition
        }
    }

    // Méthode pour gérer le comportement neutre
    neutralBehavior() {
        // Calcule la distance entre l'ennemi et le joueur
        this.distanceToTarget = Phaser.Math.Distance.Between(
            this.x + this.width / 2, this.y + this.height / 2,  // Centre de l'ennemi
            this.target.x + this.target.width / 2, this.target.y + this.target.height / 2 // Centre du joueur
        );

        const distanceSpawnToPlayer = Phaser.Math.Distance.Between(
            this.spawnX, this.spawnY,                                 // Point d'apparition
            this.target.x + this.target.width / 2, this.target.y + this.target.height / 2 // Centre du joueur
        );

        if (!this.isHit) {
            //console.log(`patroling`)
            this.patrol();
            
        // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
        } else if (this.distanceToTarget >= this.attackRange && this.isHit) {
            this.isPatrolling = false;
            
            //console.log("pursuit")
            this.scene.physics.moveToObject(this, this.target, this.speed);

        // Arrête l'ennemi s'il est à moins de sa range du joueur
        } else if (this.distanceToTarget < this.attackRange && this.isHit) {
            this.scene.physics.moveToObject(this, this.target, this.speed);
            if (!this.isAttacking) {
                console.log(`attaque lancée dans ${this.actionDelay/1000} sec`)
                this.attackWithDelay(); // Commence l'attaque après l'arrêt
            }
            if (this.distanceToTarget < this.minAttackRange) {
                this.body.setVelocity(0);
            }
        }

        // Vérifie si l'ennemi a atteint le point d'apparition
        const distanceToSpawn = Phaser.Math.Distance.Between(this.x, this.y, this.spawnX, this.spawnY);
        if (distanceToSpawn < 5 && this.distanceToTarget > this.searchRange) { // Seuil de distance pour considérer qu'il est arrivé
            this.body.setVelocity(0); // Arrête l'ennemi quand il est au point d'apparition
        }
    }

    // Méthode pour gérer le comportement passif
    passiveBehavior() {
        // Calcule la distance entre l'ennemi et le joueur
        this.distanceToTarget = Phaser.Math.Distance.Between(
            this.x + this.width / 2, this.y + this.height / 2,  // Centre de l'ennemi
            this.target.x + this.target.width / 2, this.target.y + this.target.height / 2 // Centre du joueur
        );

        const distanceSpawnToPlayer = Phaser.Math.Distance.Between(
            this.spawnX, this.spawnY,                                 // Point d'apparition
            this.target.x + this.target.width / 2, this.target.y + this.target.height / 2 // Centre du joueur
        );

        if (!this.isFleeing) {
            //console.log(`joueur sorti de la zone de recherche, retour au point d'apparition`)
            this.patrol();
            
        // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
        } else if (this.isHit) {
            this.isPatrolling = false;
            
            console.log("joueur aggressif, fuite lancée")
            this.flee()
        }
    }

    // Méthode pour gérer la fuite lorsqu'attaqué
    flee() {
        // Calcul de la direction opposée
        const dx = this.x - this.target.x;
        const dy = this.y - this.target.y;

        // Normalisation du vecteur pour conserver la direction
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const directionX = dx / magnitude;
        const directionY = dy / magnitude;

        // Applique la vitesse dans la direction opposée
        this.setVelocity(directionX * this.speed, directionY * this.speed);

        // Durée de la fuite avant de s'arrêter ou de changer de comportement
        this.isFleeing = true;
        this.scene.time.delayedCall(this.actionDelay*3, () => {  // Arrête la fuite après 1 seconde
            this.setVelocity(0);
            this.isFleeing = false;
        });
    }

    patrol() {
        if (!this.isPatrolling) {
            this.isPatrolling = true;
            this.body.setVelocity(0);
        }

        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        this.scene.physics.moveTo(this, targetPoint.x, targetPoint.y, this.speed);

        // Vérifie si l'ennemi a atteint le point de patrouille
        const distanceToPoint = Phaser.Math.Distance.Between(this.x, this.y, targetPoint.x, targetPoint.y);
        if (distanceToPoint < 5) {
            // Passe au point de patrouille suivant
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        }
    }

    // Méthode pour subir des dégâts
    takeDamage(amount) {
        this.hp -= amount;
        this.isHit = true;
        this.scene.time.delayedCall(this.actionDelay*3, () => {
            this.isHit = false
        });
        if (this.hp <= 0) {
            this.destroy(); // Détruit l'ennemi s'il n'a plus de points de vie
        }
    }

    // Méthode d'attaque avec délai
    attackWithDelay() {
        this.isAttacking = true;

        // Attend avant d'attaquer
        this.scene.time.delayedCall(this.actionDelay, () => {
            this.attack(); // Appelle la méthode d'attaque réelle
            this.isAttacking = false; // Permet de relancer une attaque après le délai
        });
    }

    //IMPORTANT gestion de l'attaque, animation, etc à gérer
    attack() {
        
        if(this.distanceToTarget < this.maxAttackRange) {

            const directionX = this.target.x - this.x;
            const directionY = this.target.y - this.y;
            const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);

            // Normalise le vecteur direction pour garder la même vitesse dans toutes les directions
            const normalizedX = directionX / magnitude;
            const normalizedY = directionY / magnitude;

            switch (this.type){
                case 'melee':
                    const meleeX = this.x + normalizedX * 60; // Ajuste "20" pour la distance de l'attaque
                    const meleeY = this.y + normalizedY * 60;
                    console.log("attaque lancée");
                    this.meleeAttack(meleeX, meleeY)
                    break;

                case 'ranged':
                    const projectileX = this.x + normalizedX * 20;
                    const projectileY = this.y + normalizedY * 20;
                    console.log("attaque lancée");
                    this.launchProjectile(projectileX, projectileY)
                    break;

                default:
                    break;
            }
            
        } else {
            console.log("le joueur est sorti de la portée d'attaque") 
        }
    }

    meleeAttack(x, y) {
        const effect = this.meleeEffects.create(x, y, 'meleeTexture'); // Sprite pour le projectile
    
        // Gérer la collision avec chaque cible dans `this.targetList`
        this.scene.physics.add.collider(effect, this.target, () => {
            // Actions lors de la collision avec la cible
            if (this.target.takeDamage) {
                this.target.takeDamage(10); // Inflige des dégâts si la cible a une méthode `takeDamage`
            }
            effect.body.enable = false;
            console.log('cible touchée')
        });
    
        // Détruire le projectile après un délai s'il ne touche rien
        this.scene.time.delayedCall(500, () => {
            if (effect.active) {
                effect.destroy();
            }
        });
    }

    launchProjectile(x, y) {
        const projectile = this.projectiles.create(x, y, 'projectileTexture'); // Sprite pour le projectile
        this.scene.physics.moveTo(projectile, this.target.x, this.target.y, 100); // Vitesse du projectile
    
        // Gérer la collision avec chaque cible dans `this.targetList`
        this.scene.physics.add.collider(projectile, this.target, () => {
            // Actions lors de la collision avec la cible
            if (this.target.takeDamage) {
                this.target.takeDamage(10); // Inflige des dégâts si la cible a une méthode `takeDamage`
            }
            projectile.destroy(); // Détruit le projectile après avoir touché la cible
            console.log('cible touchée')
        });
    
        // Détruire le projectile après un délai s'il ne touche rien
        this.scene.time.delayedCall(3000, () => {
            if (projectile.active) {
                projectile.destroy();
            }
        });
    }

    // launchProjectile() {
    //     const projectile = this.projectiles.create(this.x, this.y, 'projectileTexture'); // Sprite pour le projectile
    //     this.scene.physics.moveTo(projectile, this.target, 300); // Vitesse du projectile
    
    //     // Gérer la collision avec chaque cible dans `this.targetList`
    //     this.targetList.forEach(target => {
    //         this.scene.physics.add.collider(projectile, target, () => {
    //             // Actions lors de la collision avec la cible
    //             if (target.takeDamage) {
    //                 target.takeDamage(10); // Inflige des dégâts si la cible a une méthode `takeDamage`
    //             }
    //             projectile.destroy(); // Détruit le projectile après avoir touché la cible
    //             console.log('cible touchée')
    //         });
    //     });
    
    //     // Détruire le projectile après un délai s'il ne touche rien
    //     this.scene.time.delayedCall(3000, () => {
    //         if (projectile.active) {
    //             projectile.destroy();
    //         }
    //     });
    // }

    // //IMPORTANT à travailler, une fois class Player faite
    // getClosestTarget(playerList) {
    //     let minDistance = Infinity;
    
    //     playerList.forEach(player => {
    //         const distance = Phaser.Math.Distance.Between(
    //             this.x + this.width / 2, this.y + this.height / 2, // Centre de l'ennemi
    //             player.x + player.width / 2, player.y + player.height / 2 // Centre du joueur
    //         );
    
    //         // Si la distance est inférieure à la distance minimale enregistrée
    //         if (distance < minDistance) {
    //             minDistance = distance;
    //             this.target = player; // Met à jour la cible la plus proche
    //         }
    //     });

    //     this.moveTowards()
    // }

    getClosestTarget(player) {
        this.distanceToTarget = Phaser.Math.Distance.Between(
            this.x + this.width / 2, this.y + this.height / 2, // Centre de l'ennemi
            player.x + player.width / 2, player.y + player.height / 2 // Centre du joueur
            );

        this.target = player; // Met à jour la cible la plus proche

        this.behaviorManagement()
    }
}