export default class CraftingUI {
    constructor(scene, inventory) {
        this.scene = scene;
        this.inventory = inventory; // Instance de l'inventaire du joueur
        this.craftables = this.inventory.getCraftables(); // Liste des objets craftables
        this.visible = false;
        this.scrollY = 0; // Position verticale actuelle du défilement
        this.scrollSpeed = 0.75; // Vitesse du défilement (ajustable)
        this.contentHeight = 0; // Hauteur totale du contenu
        this.viewHeight = 0; // Hauteur visible
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
        const startY = bgY + 100;
        
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
        
        //Créer une zone visible (le masque)
        const maskZone = this.scene.add.rectangle(
            bgX + bgWidth / 2,
            bgY + bgHeight / 2,
            bgWidth,
            bgHeight,
            0.5 // Transparence
        ).setOrigin(0.5).setScrollFactor(0);
        const mask = maskZone.createGeometryMask();
        this.craftingContainer.setMask(mask);
        
        // Conserver le masque dans la scène pour des ajustements futurs (facultatif)
        this.maskZone = maskZone;
        this.maskZone.setAlpha(0);
        
        this.viewHeight = screenHeight; // Hauteur visible
        this.contentHeight = this.recipeSlots.length * (128 + 20); // Hauteur totale
        this.updateCraftingUI();
    }

    updateCraftingContainerHeight(maxIndex) {
        // Recalcule la hauteur totale du conteneur en fonction de ses enfants
        this.craftingContainer.height = maxIndex * 128 + this.craftingContainer.list.reduce((totalHeight, child) => {
            return totalHeight + child.displayHeight;
        }, 0);
        console.log('Nouvelle hauteur du conteneur:', this.craftingContainer.height);
    }
    
    handleCraftingScroll(pointer, gameObjects, deltaX, deltaY) {
        if (!this.isCraftingUIActive) return; // Ignorer si le crafting n'est pas actif

        // Calcul des limites de défilement
        const maxScrollY = Math.max(0, this.craftingContainer.height - this.maskZone.height);

        this.scrollY = Phaser.Math.Clamp(
            this.scrollY + deltaY * this.scrollSpeed,
            0,
            maxScrollY
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
    
    getSlotInitialY(index) {
        const startY = 140; // Position de départ du premier slot
        const slotSize = 128; // Taille d'un slot
        const padding = 20; // Espacement entre les slots
        
        return startY + index * (slotSize + padding);
    }
    
    updateScroll() {
        // Déplacer les slots vers le haut ou le bas
        this.recipeSlots.forEach((slot, index) => {
            const slotInitialY = this.getSlotInitialY(index); // Calculer la position initiale
            const offsetY = slotInitialY - this.scrollY;
            
            // Déplace les slots uniquement s'ils sont visibles
            slot.container.setY(offsetY);
            slot.container.setVisible(
                offsetY + slot.container.height / 2 >= 0 && 
                offsetY - slot.container.height / 2 <= this.viewHeight
            );
        });
    }
    
    
    updateCraftingUI() {
        let maxIndex = 0
        this.craftingButtons = []; // Tableau pour stocker les coordonnées des boutons de craft

        this.recipeSlots.forEach((slotObj, index) => {
            const keys = Object.keys(this.craftables);
            const craftable = this.craftables[keys[index]];
            const slot = slotObj.container;
            
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
                const craftableQuantity = this.scene.add.text(iconSize/2, -slotObj.recipeBackground.height / 2 + 52, craftable.quantity, {
                    fontSize: '16px',
                    color: '#ffffff',
                }).setOrigin(0.5);
                const craftButton = this.scene.add.text(0, slotObj.recipeBackground.height / 2 - 20, 'Craft', {
                    fontSize: '16px',
                    backgroundColor: '#00ff00',
                    padding: { x: 10, y: 5 },
                    color: '#000',
                }).setOrigin(0.5).setInteractive();

                // Ajouter le bouton à une liste pour référence ultérieure
                this.craftingButtons.push({
                    craftableType: craftable.type, 
                    button: craftButton, // Référence au bouton
                    slot: slotObj // Référence au slot
                });
                
                slot.add(craftableName);
                slot.add(craftableSprite);
                slot.add(craftableQuantity);
                slot.add(craftButton);
                maxIndex = index;
            } else {
                slot.removeAll(true);
            }
        });
        
        this.updateCraftingContainerHeight(maxIndex-1)
    }

    // Gestionnaire pour vérifier si un bouton a été cliqué
    handleCraftButtonClick(pointer) {
        // Vérifier si le clic se trouve dans les coordonnées d'un bouton de craft
        this.craftingButtons.forEach((buttonObj) => {
            const craftButton = buttonObj.button;
            const slot = buttonObj.slot;

            // Calculer les coordonnées locales du clic par rapport au conteneur de crafting (en tenant compte du défilement)
            const localPointerX = pointer.x - this.craftingContainer.x;
            const localPointerY = pointer.y - this.craftingContainer.y;

            // Récupérer les coordonnées locales du bouton et vérifier si le clic est à l'intérieur des limites du bouton
            const buttonBounds = craftButton.getBounds(); // Récupère les limites du bouton
            
            if (Phaser.Geom.Rectangle.Contains(buttonBounds, localPointerX, localPointerY)) {
                // Si le clic est à l'intérieur du bouton, exécuter le craft
                const craftable = this.craftables[buttonObj.craftableType]; // Récupérer l'objet craftable correspondant
                this.performCraft(craftable); // Effectuer l'action de crafting
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
        this.scrollY = 0;
        // Activer les inputs spécifiques au crafting
        this.enableCraftingInputs();
        this.scene.children.bringToTop(this.craftingContainer);
        this.scene.player.setDepth(0);
        this.scene.player.foodometer.bar.setDepth(0);
        this.scene.player.foodometer.background.setDepth(0);
        this.maskZone.setAlpha(1);
    }
    
    hideUI() {
        this.visible = false;
        this.isCraftingUIActive = false; // Désactiver l'UI de crafting
        this.craftingContainer.setVisible(false);
        
        // Désactiver les inputs spécifiques au crafting
        this.disableCraftingInputs();
        this.scene.player.setDepth(1);
        this.scene.player.foodometer.bar.setDepth(1);
        this.scene.player.foodometer.background.setDepth(1);
        this.maskZone.setAlpha(0);
    }
    
    enableCraftingInputs() {
        // Ajouter des événements pour les clics ou les glissements sur les éléments de l'UI
        this.scene.input.on('pointerdown', (pointer) => this.handleCraftButtonClick(pointer));
        this.scene.input.on('wheel', this.handleCraftingScroll, this);
    }
    
    disableCraftingInputs() {
        // Retirer les événements pour éviter les conflits
        this.scene.input.off('pointerdown', (pointer) => this.handleCraftButtonClick(pointer));
        this.scene.input.off('wheel', this.handleCraftingScroll, this);
    }
}
