import Tool from './Tool.js'

export default class Hotbar {
    constructor(scene, HotbarManager) {
        this.scene = scene;
        this.hotbarSlots = []; // Liste des slots de la hotbar
        this.manager = HotbarManager;
        this.slotSize = 50; // Taille des slots
        this.visible = true;
        this.toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.toggleKey.on('down', () => this.toggleUI());

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
                this.manager.selectSlot(3);
            } else if (event.key === '5') {
                this.manager.selectSlot(4);
            } else if (event.key === '6') {
                this.manager.selectSlot(5); 
            } else if (event.key === '7') {
                this.manager.selectSlot(6);
            } else if (event.key === '8') {
                this.manager.selectSlot(7); 
            }
            // Ajoute d'autres touches pour les autres slots si nécessaire
        });

        this.manager.onHotbarUpdate(() => this.updateHotbar());
        this.manager.inventory.onInventoryUpdate(() => this.updateHotbar());
    }

    createHotbar() {
        const hotbarY = this.scene.cameras.main.height - this.slotSize - 10; // Position verticale avec une marge
        const slotSpacing = 4; // Espace entre les slots
        const totalWidth = this.manager.getNbSlots() * this.slotSize + (this.manager.getNbSlots() - 1) * slotSpacing; // Largeur totale de la Hotbar avec espaces
        const startX = (this.scene.cameras.main.width - totalWidth) / 2 + this.slotSize/2; // Point de départ pour centrer la Hotbar
    
        for (let i = 0; i < this.manager.getNbSlots(); i++) {
            const x = startX + i * (this.slotSize + slotSpacing); // Position X de chaque slot
    
            // Crée un slot graphique
            const slot = this.scene.add.rectangle(x, hotbarY, this.slotSize, this.slotSize, 0x444444)
                .setStrokeStyle(2, i === this.selectedSlot ? 0xffff00 : 0xffffff)
                .setScrollFactor(0); // Reste fixe à l'écran
    
            const itemSprite = this.scene.add.sprite(x, hotbarY, '').setDisplaySize(32, 32).setScrollFactor(0);
    
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
    
            this.hotbarSlots.push({ slot, itemSprite, quantityText });
        }
    }

    updateHotbar() {
        // Récupère les items de l'inventaire pour les afficher dans la hotbar
        const items = this.manager.getLastRowInventoryKeys(); 
        console.log("updateHotbar",items);

        for (let i = 0; i < this.hotbarSlots.length; i++) {
            const { itemSprite, quantityText, slot } = this.hotbarSlots[i];

            if (items[i]) {
                const item = items[i];
                const itemData = this.manager.inventory.inventory[item].item;
                const quantity = this.manager.inventory.inventory[item].item.quantity;

                itemSprite.setTexture(itemData.type);
                itemSprite.setDisplaySize(32, 32);
                itemSprite.setVisible(true);


                // Mettre à jour le texte de la quantité
                quantityText.setText(quantity > 1 || !(this.manager.inventory.inventory[item].item instanceof Tool) ? `${quantity}` : '');
            } else {
                itemSprite.setTexture(''); 
                itemSprite.setVisible(false);
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
        const startX = (width - totalWidth) / 2 + this.slotSize/2; // Position de départ pour centrer
        // Repositionne tous les éléments
        for (let i = 0; i < this.hotbarSlots.length; i++) {
            const x = startX + i * (this.slotSize + 2);
            const { slot, itemSprite, quantityText } = this.hotbarSlots[i];

            slot.setPosition(x, hotbarY);
            itemSprite.setPosition(
                x,
                hotbarY
            );
            quantityText.setPosition(
                x + this.slotSize / 2 - 5, // Position X : coin droit du slot
                hotbarY + this.slotSize / 2 - 5 // Position Y : coin bas du slot
            );
        }
    }

    showUI() {
        this.visible = true;
        this.hotbarSlots.forEach(({ slot, itemSprite, quantityText }) => {
            slot.visible = true;
            if (!itemSprite.texture || itemSprite.texture.key === '') {
                itemSprite.visible = true;
            }            
            quantityText.visible = true;
        });
    }

    hideUI() {
        this.visible = false;
        this.hotbarSlots.forEach(({ slot, itemSprite, quantityText }) => {
            slot.visible = false;
            itemSprite.visible = false;
            quantityText.visible = false;
        });
    }

    toggleUI() {
        if (this.visible) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }
}
