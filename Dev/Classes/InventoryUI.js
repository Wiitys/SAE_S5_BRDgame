export default class InventoryUI {
    constructor(scene, inventory) {
        this.scene = scene;
        this.inventory = inventory;
        this.inventoryText = null;
        this.craftButtons = {};
        this.itemButtons = {};
        this.craftButton = null;
        this.craftSelected = null;
        this.visible = false; 

        this.initUI();
        this.hideUI();
    }

    initUI() {
        this.inventoryText = this.scene.add.text(
            this.scene.cameras.main.width * 0.02,
            this.scene.cameras.main.height * 0.2,
            '',
            { fontSize: '16px', fill: '#fff' }
        ).setOrigin(0, 0).setScrollFactor(0);

        this.createCraftButtons();

        this.createCraftButton();
    }

    createCraftButtons() {
        const buttonData = [
            { label: "Stick", x: 0.25, y: 0.85, key: "stick" },
            { label: "Plank", x: 0.25, y: 0.95, key: "plank" },
            { label: "Wooden Axe", x: 0.5, y: 0.85, key: "woodenAxe" },
            { label: "Wooden Pickaxe", x: 0.5, y: 0.95, key: "woodenPickaxe" },
            { label: "Stone Axe", x: 0.75, y: 0.85, key: "stoneAxe" },
            { label: "Stone Pickaxe", x: 0.75, y: 0.95, key: "stonePickaxe" },
        ];

        buttonData.forEach(({ label, x, y, key }) => {
            const button = this.scene.add.text(
                this.scene.cameras.main.width * x,
                this.scene.cameras.main.height * y,
                label,
                { fontSize: '16px', fill: '#fff' }
            )
                .setOrigin(0.5, 0.5)
                .setInteractive()
                .setScrollFactor(0);

            button.on('pointerdown', () => this.selectCraftItem(key, button));
            this.craftButtons[key] = button;
        });
    }

    createCraftButton() {
        this.craftButton = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height * 0.8,
            'Craft',
            { fontSize: '32px', fill: '#fff' }
        )
            .setOrigin(0.5, 0.5)
            .setInteractive()
            .setScrollFactor(0);

        this.craftButton.on('pointerdown', () => {
            const crafted = this.inventory.craftSelectedItem(this.craftSelected);
            if (crafted) {
                this.updateInventoryText();
            } else {
                console.log("Impossible de crafter cet objet.");
            }
        });
    }

    updateInventoryText() {
        this.inventoryText.setText('');
        Object.keys(this.inventory.inventory).forEach(key => {
            const { quantity } = this.inventory.inventory[key];
            this.inventoryText.appendText(`\n${key}: ${quantity}`);
        });
    }

    selectCraftItem(key, button) {
        this.craftSelected = key;
        Object.values(this.craftButtons).forEach(btn => btn.setStyle({ fill: '#fff' }));
        button.setStyle({ fill: '#ff0' });
    }

    showUI() {
        this.visible = true;
        this.craftButton.setVisible(true);
        this.inventoryText.setVisible(true);
        Object.values(this.craftButtons).forEach(btn => btn.setVisible(true));
    }

    hideUI() {
        this.visible = false;
        this.craftButton.setVisible(false);
        this.inventoryText.setVisible(false);
        Object.values(this.craftButtons).forEach(btn => btn.setVisible(false));
    }

    toggleUI() {
        if (this.visible) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }
}
