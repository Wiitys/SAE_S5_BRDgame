export default class HotbarManager {
    constructor(inventory, nbSlots = 8) {
        this.inventory = inventory;
        this.nbSlots = nbSlots;
        this.selectedSlot = 0;
        this.callbacks = [];
    }

    // Méthode pour ajouter un écouteur
    onHotbarUpdate(callback) {
        this.callbacks.push(callback);
    }

    // Méthode pour déclencher les callbacks
    triggerUpdate() {
        this.callbacks.forEach(callback => callback());
    }

    getNbSlots() {
        return this.nbSlots;
    }

    selectSlot(index) {
        const slots = this.inventory.getInventoryKey(); // Utilise la méthode centralisée pour les slots
        if (index >= 0 && index < slots.length) {
            this.selectedSlot = index; // Change le slot sélectionné
            this.triggerUpdate();
            const itemKey = slots[index]; // Récupère la clé de l'item
            if (itemKey) {
                this.inventory.equipItem(itemKey); // Équipe l'objet correspondant
            }
        } else {
            console.warn(`Index de slot invalide : ${index}`);
        }
    }
    

    getSelectedItem() {
        const slots = this.getSlots();
        return slots[this.selectedSlot] || null;
    }
}
