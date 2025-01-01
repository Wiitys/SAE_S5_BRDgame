export default class CraftingUI {
    constructor(scene, inventory) {
        this.scene = scene;
        this.inventory = inventory; // Instance de l'inventaire du joueur
        this.craftables = this.inventory.getCraftables(); // Liste des objets craftables
        this.visible = false;

        this.toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.toggleKey.on('down', () => this.toggleUI());

        this.craftingContainer = this.scene.add.container(0, 0).setVisible(false).setScrollFactor(0);

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
            0x333333
        );
        background.setStrokeStyle(2, 0xffffff);

        this.craftingContainer.add(background);
        this.craftingContainer.add(overlay);

        const title = this.scene.add.text(bgX + bgWidth / 2, bgY + 20, 'Crafting', {
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);
        this.craftingContainer.add(title);

        this.recipeSlots = [];
        const rows = 3; // Nombre de recettes visibles
        const slotSize = 128; // Taille d'une recette
        const padding = 20; // Espace entre les recettes
        const startX = bgX + padding;
        const startY = bgY + 60;

        for (let row = 0; row < rows; row++) {
            const slotY = startY + row * (slotSize + padding);

            const slot = this.scene.add.container(bgX + bgWidth / 2, slotY);

            const recipeBackground = this.scene.add.rectangle(0, 0, bgWidth * 0.9, slotSize, 0x444444);
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

        this.scene.add.existing(this.craftingContainer);
        this.updateCraftingUI();
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

    showUI() {
        this.visible = true;
        this.craftingContainer.setVisible(true);
        this.scene.children.bringToTop(this.craftingContainer);
    }

    hideUI() {
        this.visible = false;
        this.craftingContainer.setVisible(false);
    }

    toggleUI() {
        if (this.visible) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }
}
