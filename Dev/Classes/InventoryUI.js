export default class InventoryUI {
    constructor(scene, inventory) {
        this.scene = scene;
        this.inventory = inventory;
        this.visible = false;

        this.toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.toggleKey.on('down', () => this.toggleUI());

        this.inventoryContainer = this.scene.add.container(0, 0).setVisible(false).setScrollFactor(0);

        this.scene.events.on('inventoryUpdate', this.updateInventoryUI, this);

        this.inventory.onInventoryUpdate(() => this.updateInventoryUI());


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
        
        const title = this.scene.add.text(bgX + bgWidth / 2, bgY + 20, 'Inventory', {
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);
        this.inventoryContainer.add(title);
        
        this.inventorySlots = [];
        const rows = this.inventory.rows;
        const cols = this.inventory.cols;
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
                this.inventorySlots.push({
                    rect: slot,
                    row,
                    col,
                    index: row * cols + col, // Ajout d'un index unique pour chaque slot
                });
            }
        }
    
        // Rendre le conteneur interactif avec ses dimensions statiques
        this.inventoryContainer.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, screenWidth, screenHeight),
            Phaser.Geom.Rectangle.Contains
        );
    
        // Capture les clics sur le conteneur
        this.inventoryContainer.on('pointerdown', (pointer) => {
            const slotClicked = this.getSlotClicked(pointer.x, pointer.y);
            if (slotClicked) {
                console.log(`Slot clicked! Row: ${slotClicked.row}, Col: ${slotClicked.col}, Index: ${slotClicked.index}`);
                this.highlightSlot(slotClicked);
                this.startDrag(pointer, slotClicked);  // Commence le drag à partir du slot
            } else {
                console.log(`Clicked outside slots at x=${pointer.x}, y=${pointer.y}`);
            }
        });
    
        // Ajout du conteneur à la scène
        this.scene.add.existing(this.inventoryContainer);
        
        this.updateInventoryUI();
    }
    
    getSlotClicked(x, y) {
        // Obtenez les coordonnées locales du clic par rapport au conteneur
        const localX = x - this.inventoryContainer.x;
        const localY = y - this.inventoryContainer.y;
    
        return this.inventorySlots.find((slot) => 
            Phaser.Geom.Rectangle.Contains(slot.rect.getBounds(), localX, localY)
        );
    }

    highlightSlot(slot) {
        this.inventorySlots.forEach(slotObj => {
            slotObj.rect.setStrokeStyle(2, 0xffffff); 
        });

        slot.rect.setStrokeStyle(2, 0xffff00);
    }     

    updateInventoryUI() {
        const items = Object.values(this.inventory.inventory);
    
        // Itérer sur les slots en utilisant la nouvelle structure
        this.inventorySlots.forEach((slotObj) => {
            const { rect, row, col, index } = slotObj;
            
            // Trouver l'élément associé au slot (utilisation de l'index)
            const item = items.find(i => i.slot === index);
    
            if (item) {
                // Si l'élément est déjà présent dans le slot, on met à jour son icône et sa quantité
                if (slotObj.icon) {
                    if (slotObj.icon.texture.key !== item.item.type) {
                        slotObj.icon.setTexture(item.item.type);  // Met à jour l'icône avec le type d'item
                    }
                    slotObj.icon.setDisplaySize(32, 32);
                } else {
                    // Si l'icône n'existe pas encore, on la crée
                    slotObj.icon = this.scene.add.sprite(rect.x + rect.width / 2, rect.y + rect.height / 2, item.item.type).setDisplaySize(32, 32);
                    this.inventoryContainer.add(slotObj.icon);
                }
    
                if (slotObj.text) {
                    if (parseInt(slotObj.text.text) !== item.item.quantity) {
                        slotObj.text.setText(item.item.quantity);  // Met à jour la quantité de l'item
                    }
                } else {
                    // Si le texte n'existe pas encore, on le crée
                    slotObj.text = this.scene.add.text(rect.x + rect.width*0.8, rect.y + rect.height*0.8, item.item.quantity, {
                        fontSize: '16px',
                        color: '#ffffff',
                    }).setOrigin(0.5);
                    this.inventoryContainer.add(slotObj.text);
                }
            } else {
                // Si l'élément n'est pas présent dans le slot, on détruit l'icône et le texte
                if (slotObj.icon) {
                    slotObj.icon.destroy();
                    slotObj.icon = null;
                }
                if (slotObj.text) {
                    slotObj.text.destroy();
                    slotObj.text = null;
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
        this.scene.player.setDepth(0);
    }

    hideUI() {
        this.visible = false;
        this.inventoryContainer.setVisible(false);
        this.scene.player.setDepth(1);
    }

    toggleUI() {
        if (this.visible) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }

    startDrag(pointer, slotClicked) {
        this.draggingItem = slotClicked;
        const item = this.inventory.inventory[slotClicked.index];
        if (item && item.icon) {
            this.draggedIcon = item.icon;
        }

        if (this.draggedIcon) {
            this.draggedIcon.setAlpha(0.7);
        }

        this.scene.input.on('pointermove', this.updateDrag, this);
        this.scene.input.on('pointerup', this.dropItem, this);
    }

    updateDrag(pointer) {
        if (this.draggedIcon) {
            this.draggedIcon.x = pointer.x;
            this.draggedIcon.y = pointer.y;
        }
    }

    dropItem(pointer) {
        const slotClicked = this.getSlotClicked(pointer.x, pointer.y);
        if (slotClicked) {
            console.log(`Item dropped! Row: ${slotClicked.row}, Col: ${slotClicked.col}, Index: ${slotClicked.index}`);
            this.inventory.changeSlot(this.draggingItem.index, slotClicked.index);  // Utilisation de changeSlot pour échanger les items
        }

        if (this.draggedIcon) {
            this.draggedIcon.setAlpha(1);
        }

        this.scene.input.off('pointermove', this.updateDrag, this);
        this.scene.input.off('pointerup', this.dropItem, this);
        this.draggedIcon = null;
        this.draggingItem = null;
    }
}
