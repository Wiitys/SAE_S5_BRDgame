export default class Hotbar {
    constructor(scene, HotbarManager) {
        this.scene = scene;
        this.hotbarSlots = []; // Liste des slots de la hotbar
        this.manager = HotbarManager;
        this.slotSize = 50; // Taille des slots

        this.createHotbar();
        this.updateHotbar();

        // Écouteur pour la redimension du canvas
        this.scene.scale.on('resize', this.onResize, this);

        // Écouteur pour la sélection par touches du clavier
        this.scene.input.keyboard.on('keydown', (event) => {
            if (event.key === '1') {
                this.manager.selectSlot(0);  
            } else if (event.key === '2') {
                this.manager.selectSlot(1);  
            } else if (event.key === '3') {
                this.manager.selectSlot(2);  
            } else if (event.key === '4') {
                this.selectSlot(3);  
            } else if (event.key === '5') {
                this.selectSlot(4);  
            } else if (event.key === '6') {
                this.selectSlot(5);  
            } else if (event.key === '7') {
                this.selectSlot(6); 
            } else if (event.key === '8') {
                this.selectSlot(7);  
            }
            // Ajoute d'autres touches pour les autres slots si nécessaire
        });

        this.manager.onHotbarUpdate(() => this.updateHotbar());
        this.manager.inventory.onInventoryUpdate(() => this.updateHotbar());
    }

    createHotbar() {
        const hotbarY = this.scene.cameras.main.height - this.slotSize - 10; // Position verticale avec une marge
        const totalWidth = this.manager.getNbSlots() * (this.slotSize + 4); // Largeur totale de la Hotbar
        const startX = (this.scene.cameras.main.width - totalWidth) / 2; // Départ pour centrer la Hotbar

        for (let i = 0; i < this.manager.getNbSlots(); i++) {
            const x = startX + i * (this.slotSize + 2); // Position de chaque slot

            // Crée un slot graphique
            const slot = this.scene.add.rectangle(x, hotbarY, this.slotSize, this.slotSize, 0x444444)
                .setStrokeStyle(2, i === this.selectedSlot ? 0xffff00 : 0xffffff)
                .setScrollFactor(0); // Reste fixe à l'écran

            // Texte pour le nom de l'objet (en haut)
            const nameText = this.scene.add.text(
                x - this.slotSize / 2 + 5, // Position X : à gauche dans le slot
                hotbarY - this.slotSize / 2 + 5, // Position Y : en haut
                '', {
                    fontSize: '10px',
                    fill: '#fff',
                    align: 'left',
                    wordWrap: { width: this.slotSize - 10 } // Limite la largeur du texte
                }
            ).setOrigin(0, 0).setScrollFactor(0);

            // Texte pour la quantité de l'objet (en bas à droite)
            const quantityText = this.scene.add.text(
                x + this.slotSize / 2 - 5, // Position X : coin droit du slot
                hotbarY + this.slotSize / 2 - 5, // Position Y : coin bas du slot
                '', {
                    fontSize: '12px',
                    fill: '#fff',
                    align: 'right'
                }
            ).setOrigin(1, 1).setScrollFactor(0);

            this.hotbarSlots.push({ slot, nameText, quantityText });
        }
    }

    updateHotbar() {
        // Récupère les items de l'inventaire pour les afficher dans la hotbar
        const items = this.manager.getSlots(); 

        for (let i = 0; i < this.hotbarSlots.length; i++) {
            const { nameText, quantityText, slot } = this.hotbarSlots[i];

            if (items[i]) {
                const item = items[i];
                const quantity = this.manager.inventory.inventory[item].quantity;

                // Mettre à jour le texte du nom
                nameText.setText(item);

                // Mettre à jour le texte de la quantité
                quantityText.setText(quantity > 1 ? `${quantity}` : '');
            } else {
                nameText.setText('');
                quantityText.setText('');
            }

            // Met à jour la bordure pour indiquer la sélection
            slot.setStrokeStyle(2, i === this.manager.selectedSlot ? 0xffff00 : 0xffffff);
        }
    }



    onResize(gameSize) {
        const { width, height } = gameSize;

        const hotbarY = height - this.slotSize - 10; // Nouvelle position verticale
        const totalWidth = this.hotbarSlots.length * (this.slotSize + 4); // Largeur totale de la hotbar
        const startX = (width - totalWidth) / 2; // Position de départ pour centrer

        // Repositionne tous les éléments
        for (let i = 0; i < this.hotbarSlots.length; i++) {
            const x = startX + i * (this.slotSize + 2);
            const { slot, nameText, quantityText } = this.hotbarSlots[i];

            slot.setPosition(x, hotbarY);
            nameText.setPosition(
                x - this.slotSize / 2 + 5, // Position X : à gauche dans le slot
                hotbarY - this.slotSize / 2 + 5 // Position Y : en haut
            );
            quantityText.setPosition(
                x + this.slotSize / 2 - 5, // Position X : coin droit du slot
                hotbarY + this.slotSize / 2 - 5 // Position Y : coin bas du slot
            );
        }
    }
}
