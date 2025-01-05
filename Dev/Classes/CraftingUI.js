export default class CraftingUI {
    constructor(scene, inventory) {
        this.scene = scene;
        this.inventory = inventory; // Instance de l'inventaire du joueur
        this.craftables = this.inventory.getCraftables(); // Liste des objets craftables
        this.visible = false;
        this.scrollY = 0; // Position verticale actuelle du défilement
        this.scrollSpeed = 0.75; // Vitesse du défilement (ajustable)
        this.isCraftingUIActive = false;
        this.toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.toggleKey.on('down', () => this.toggleUI());

        this.craftingContainer = this.scene.add.container(0, 0).setVisible(false).setScrollFactor(0);

        this.initUI();
    }

    initUI() {
        const camera = this.scene.cameras.main;
        const screenWidth = camera.width;
        const screenHeight = camera.height;
    
        const bgWidth = screenWidth * 0.8;
        const bgHeight = screenHeight * 0.8;
        const bgX = (screenWidth - bgWidth) / 2;
        const bgY = (screenHeight - bgHeight) / 2;
    
        const background = this.scene.add.rectangle(
            bgX + bgWidth / 2,
            bgY + bgHeight / 2,
            bgWidth,
            bgHeight,
            0x333333
        );
        background.setStrokeStyle(2, 0xffffff);
    
        this.craftingContainer.add(background);
    
        const title = this.scene.add.text(bgX + bgWidth / 2, bgY + 20, 'Crafting', {
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);
        this.craftingContainer.add(title);
    
        this.recipeSlots = [];
        this.slotHeight = 128; // Hauteur d'un slot
        const rows = 10; // Total des recettes (débordera l'écran)
        const padding = 20;
        const startX = bgX + padding;
        const startY = bgY + 60;
    
        for (let row = 0; row < rows; row++) {
            const slotY = startY + row * (this.slotHeight + padding);
    
            const slot = this.scene.add.container(bgX + bgWidth / 2, slotY);
    
            const recipeBackground = this.scene.add.rectangle(0, 0, bgWidth * 0.9, this.slotHeight, 0x444444);
            recipeBackground.setStrokeStyle(2, 0xffffff);
            recipeBackground.setOrigin(0.5);
    
            slot.add(recipeBackground);
    
            this.craftingContainer.add(slot);
            this.recipeSlots.push({
                container: slot,
                recipeBackground,
                index: row,
            });
        }
    
        this.contentHeight = rows * (this.slotHeight + padding); // Calculer la hauteur totale
        this.viewHeight = bgHeight; // Hauteur visible
        this.updateCraftingUI();
    }

    handleCraftingScroll(pointer, gameObjects, deltaX, deltaY) {
        if (!this.isCraftingUIActive) return; // Ignorer si le crafting n'est pas actif
    
        this.scrollY = Phaser.Math.Clamp(
            this.scrollY + deltaY * this.scrollSpeed,
            0,
            this.contentHeight - this.viewHeight
        );
        this.updateScroll();
    }

    handleCraftingClick(pointer) {
        if (!this.isCraftingUIActive) return; // Ignorer si le crafting n'est pas actif

        // Vérifiez si le clic est sur un élément de l'UI
        const clickedElement = this.recipeSlots.find(slot => 
            slot.recipeBackground.getBounds().contains(pointer.x, pointer.y)
        );

        if (clickedElement) {
            this.selectCraftable(clickedElement.index); // Exemple d'action
        }
    }

    updateScroll() {
        this.recipeSlots.forEach((slot, index) => {
            const slotY = index * (this.slotHeight + 20) - this.scrollY;
            slot.container.y = slotY;
        });

        console.log(this.scrollY)
    }
    

    updateCraftingUI() {
        this.recipeSlots.forEach((slotObj, index) => {
            console.log(slotObj)
            const keys = Object.keys(this.craftables);
            const craftable = this.craftables[keys[index]];
            console.log(craftable)
            const slot = slotObj.container;

            slot.removeAll(true);

            if (craftable) {
                const iconSize = 32;
                let offsetX = -slotObj.recipeBackground.width / 2 + iconSize;

                Object.entries(craftable.recipe).forEach(([ingredient, quantity], i) => {
                    const ingredientSprite = this.scene.add.sprite(offsetX, 0, ingredient).setDisplaySize(iconSize, iconSize);
                    const ingredientText = this.scene.add.text(
                        offsetX + iconSize / 2,
                        iconSize / 2,
                        `${quantity}`,
                        { fontSize: '16px', color: '#ffffff' }
                    ).setOrigin(1);

                    offsetX += iconSize + 10;

                    slot.add(ingredientSprite);
                    slot.add(ingredientText);
                });

                const craftableName = this.scene.add.text(0, -slotObj.recipeBackground.height / 2 + 20, craftable.type, {
                    fontSize: '18px',
                    color: '#ffffff',
                }).setOrigin(0.5);
                
                const craftableSprite = this.scene.add.sprite(0, -slotObj.recipeBackground.height / 2 + 10 + iconSize, craftable.type).setDisplaySize(iconSize, iconSize);
                const craftButton = this.scene.add.text(0, slotObj.recipeBackground.height / 2 - 20, 'Craft', {
                    fontSize: '16px',
                    backgroundColor: '#00ff00',
                    padding: { x: 10, y: 5 },
                    color: '#000',
                }).setOrigin(0.5).setInteractive();

                craftButton.on('pointerdown', () => this.performCraft(craftable));

                slot.add(craftableName);
                slot.add(craftableSprite);
                slot.add(craftButton);
            }
        });
    }

    performCraft(craftable) {
        if (craftable.isCraftable(this.inventory)) {
            craftable.craft(this.inventory);
            this.scene.events.emit('craftingUpdate');
            console.log(`Crafted: ${craftable.type}`);
        } else {
            console.log('Not enough resources!');
        }
    }

    toggleUI() {
        if (this.visible) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }

    showUI() {
        this.visible = true;
        this.isCraftingUIActive = true; // Activer l'UI de crafting
        this.craftingContainer.setVisible(true);
    
        // Activer les inputs spécifiques au crafting
        this.enableCraftingInputs();
    }
    
    hideUI() {
        this.visible = false;
        this.isCraftingUIActive = false; // Désactiver l'UI de crafting
        this.craftingContainer.setVisible(false);
    
        // Désactiver les inputs spécifiques au crafting
        this.disableCraftingInputs();
    }
    
    enableCraftingInputs() {
        // Ajouter des événements pour les clics ou les glissements sur les éléments de l'UI
        this.scene.input.on('pointerdown', this.handleCraftingClick, this);
        this.scene.input.on('wheel', this.handleCraftingScroll, this);
    }
    
    disableCraftingInputs() {
        // Retirer les événements pour éviter les conflits
        this.scene.input.off('pointerdown', this.handleCraftingClick, this);
        this.scene.input.off('wheel', this.handleCraftingScroll, this);
    }
}
