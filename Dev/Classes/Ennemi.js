export default class Ennemi extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, type = 'melee', hp = 100, speed = 50, attackRange = 50, searchRange = 200, actionDelay = 3000) {
        super(scene, x, y, texture);

        // Ajout à la scène
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.spawnX = x;
        this.spawnY = y;
        this.type = type;
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

        if (type === 'ranged') {
            this.projectiles = scene.physics.add.group();
        }

        // Paramètres de base
        //this.setCollideWorldBounds(true); // Ne pas sortir du cadre de la carte
    }

    // Méthode pour déplacer l'ennemi
    moveTowards() {
        // Calcule la distance entre l'ennemi et le joueur
        this.distanceToTarget = Phaser.Math.Distance.Between(
            this.x + this.width / 2, this.y + this.height / 2,  // Centre de l'ennemi
            this.target.x + this.target.width / 2, this.target.y + this.target.height / 2 // Centre du joueur
        );

        const distanceSpawnToPlayer = Phaser.Math.Distance.Between(
            this.spawnX, this.spawnY,                                 // Point d'apparition
            this.target.x + this.target.width / 2, this.target.y + this.target.height / 2 // Centre du joueur
        );

        if (distanceSpawnToPlayer > this.searchRange) {
            console.log(`joueur sorti de la zone de recherche, retour au point d'apparition`)
            this.scene.physics.moveTo(this, this.spawnX, this.spawnY, this.speed);
            
        // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
        } else if (this.distanceToTarget >= this.attackRange && this.distanceToTarget <= this.searchRange) {
            console.log("joueur trouvé, poursuite lancée")
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

    // Méthode pour subir des dégâts
    takeDamage(amount) {
        this.hp -= amount;
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
            switch (this.type){
                case 'melee':
                    //console.log("attaque lancée");
                    //playerHP.removeHealth(10);
                    //animations d'attaque de melee
                    break;

                case 'ranged':
                    console.log("attaque lancée");
                    this.launchProjectile()
                    break;

                default:
                    break;
            }
            
        } else {
            console.log("le joueur est sorti de la portée d'attaque") 
        }
    }

    launchProjectile() {
        const projectile = this.projectiles.create(this.x, this.y, 'projectileTexture'); // Sprite pour le projectile
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

        this.moveTowards()
    }
}