export default class InventoryUI {
    constructor(scene, inventory) {
        this.scene = scene;
        this.inventory = inventory;
        this.visible = false;

        this.toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.toggleKey.on('down', () => this.toggleUI());

        this.inventoryContainer = this.scene.add.container(0, 0).setVisible(false).setScrollFactor(0);

        this.initUI();
    }

    initUI() {

        const camera = this.scene.cameras.main;
        const screenWidth = camera.width;
        const screenHeight = camera.height;

        const overlay = this.scene.add.rectangle(
            screenWidth / 2,
            screenHeight / 2,
            screenWidth,
            screenHeight,
            0x000000,
            0.8
        );

        // Fond d'écran de l'inventaire
        const bgWidth = screenWidth * 0.8;
        const bgHeight = screenHeight * 0.8;
        const bgX = (screenWidth - bgWidth) / 2;
        const bgY = (screenHeight - bgHeight) / 2;

        const background = this.scene.add.rectangle(
            bgX + bgWidth / 2,
            bgY + bgHeight / 2,
            bgWidth,
            bgHeight,
            0x333333,
        );
        background.setStrokeStyle(2, 0xffffff);

        this.inventoryContainer.add(background);
        this.inventoryContainer.add(overlay);

        // Titre de l'inventaire
        const title = this.scene.add.text(bgX + bgWidth / 2, bgY + 20, 'Inventory', {
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);
        this.inventoryContainer.add(title);

        // Slots d'inventaire
        this.inventorySlots = [];
        const rows = 3;
        const cols = 5;
        const slotSize = 64;
        const padding = 10;
        const startX = bgX + (bgWidth - (cols * slotSize + (cols - 1) * padding)) / 2;
        const startY = bgY + 60;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const slotX = startX + col * (slotSize + padding);
                const slotY = startY + row * (slotSize + padding);

                const slot = this.scene.add.rectangle(slotX, slotY, slotSize, slotSize, 0x444444);
                slot.setStrokeStyle(2, 0xffffff);
                slot.setOrigin(0);

                this.inventoryContainer.add(slot);
                this.inventorySlots.push(slot);
            }
        }

        // Mise à jour de l'inventaire
        this.updateInventoryUI();
    }

    updateInventoryUI() {
        const items = Object.values(this.inventory.inventory);
    
        this.inventorySlots.forEach((slot, index) => {
            const item = items.find(i => i.slot === index);
    
            if (item) {    
                if (slot.icon) {
                    if (slot.icon.texture.key !== item.item.type) {
                        slot.icon.setTexture(item.item.type);
                    }
                } else {
                    slot.icon = this.scene.add.sprite(slot.x + 32, slot.y + 32, item.item.type).setDisplaySize(32, 32);
                    this.inventoryContainer.add(slot.icon);
                }
    
                if (slot.text) {
                    if (parseInt(slot.text.text) !== item.item.quantity) {
                        slot.text.setText(item.item.quantity);
                    }
                } else {
                    slot.text = this.scene.add.text(slot.x + 48, slot.y + 48, item.item.quantity, {
                        fontSize: '16px',
                        color: '#ffffff',
                    }).setOrigin(0.5);
                    this.inventoryContainer.add(slot.text);
                }
    
            } else {
                if (slot.icon) {
                    slot.icon.destroy();
                    slot.text.destroy();
                    slot.icon = null;
                    slot.text = null;
                }
            }
        });
    }
    
    

    selectItem(key, icon) {
        // Logique pour la sélection d'un objet (sans craft)
        console.log(`Item sélectionné : ${key}`);

        // Reset tous les styles
        this.inventorySlots.forEach(slot => {
            if (slot.icon) {
                slot.icon.setTint(0xffffff);
            }
        });

        // Mettre en évidence l'icône sélectionnée
        icon.setTint(0xffff00);
    }

    showUI() {
        this.visible = true;
        this.inventoryContainer.setVisible(true);
        this.scene.children.bringToTop(this.inventoryContainer);
    }

    hideUI() {
        this.visible = false;
        this.inventoryContainer.setVisible(false);
    }

    toggleUI() {
        if (this.visible) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }
}
