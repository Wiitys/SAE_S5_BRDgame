export default class Ennemi extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, hp = 100, speed = 50, type = 'melee', attackRange = 50, searchRange = 200, actionDelay = 3000) {
        super(scene, x, y, texture);

        // Ajout à la scène
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.spawnX = x;
        this.spawnY = y;
        this.type = type;
        this.attackRange = attackRange;
        this.searchRange = searchRange;
        this.hp = hp; // Points de vie
        this.speed = speed; // Vitesse de déplacement
        this.isAttacking = false;
        this.actionDelay = actionDelay;

        // Paramètres de base
        //this.setCollideWorldBounds(true); // Ne pas sortir du cadre de la carte
    }

    // Méthode pour déplacer l'ennemi
    moveTowards(player, playerHP) {
        // Calcule la distance entre l'ennemi et le joueur
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.x + this.width / 2, this.y + this.height / 2,  // Centre de l'ennemi
            player.x + player.width / 2, player.y + player.height / 2 // Centre du joueur
        );

        const distanceSpawnToPlayer = Phaser.Math.Distance.Between(
            this.spawnX, this.spawnY,                                 // Point d'apparition
            player.x + player.width / 2, player.y + player.height / 2 // Centre du joueur
        );

        if (distanceSpawnToPlayer > this.searchRange) {
            console.log(`joueur sorti de la zone de recherche, retour au point d'apparition`)
            this.scene.physics.moveTo(this, this.spawnX, this.spawnY, this.speed);
            
        // Si l'ennemi est à plus de sa range du joueur, il continue de se déplacer
        } else if (distanceToPlayer >= this.attackRange && distanceToPlayer <= this.searchRange) {
            console.log("joueur trouvé, poursuite lancée")
            this.scene.physics.moveToObject(this, player, this.speed);

        // Arrête l'ennemi s'il est à moins de sa range du joueur
        } else if (distanceToPlayer < this.attackRange){    
            this.body.setVelocity(0);
            if (!this.isAttacking) {
                console.log(`attaque lancée dans ${this.actionDelay/1000} sec`)
                this.attackWithDelay(playerHP); // Commence l'attaque après l'arrêt
            }
        }

        // Vérifie si l'ennemi a atteint le point d'apparition
        const distanceToSpawn = Phaser.Math.Distance.Between(this.x, this.y, this.spawnX, this.spawnY);
        if (distanceToSpawn < 5 && distanceToPlayer > this.searchRange) { // Seuil de distance pour considérer qu'il est arrivé
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
    attackWithDelay(playerHP) {
        this.isAttacking = true;

        // Attend avant d'attaquer
        this.scene.time.delayedCall(this.actionDelay, () => {
            this.attack(playerHP); // Appelle la méthode d'attaque réelle
            this.isAttacking = false; // Permet de relancer une attaque après le délai
        });
    }

    //IMPORTANT gestion de l'attaque, animation, etc à gérer
    attack(playerHP) {
        if(this.body.velocity.x == 0 && this.body.velocity.y == 0) {
            console.log("attaque lancée");
            playerHP.removeHealth(10);
        } else {
            console.log("le joueur est sorti de la portée d'attaque") 
        }
    }

    //IMPORTANT à travailler, une fois class Player faite
    getClosestTarget(playerList) {
        return 0
    }
}