export default class HotbarManager {
    constructor(inventory) {
        this.inventory = inventory;
        this.nbSlots = this.inventory.cols;
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

    getLastRowSlots() {
        const slots = this.inventory.getSlots();
        const totalSlots = slots.length;
        const lastRowStart = totalSlots - this.nbSlots;
        return slots.slice(lastRowStart);
    }
    

    getLastRowInventoryKeys() {
        const lastRowSlots = this.getLastRowSlots(); 
        const totalSlots = this.inventory.getSlots().length; 
        const lastRowStart = totalSlots - this.nbSlots; 
    
        const lastRowKeys = lastRowSlots.map((_, index) => {
            const globalSlotIndex = lastRowStart + index; 
            const itemKey = Object.keys(this.inventory.inventory).find(key => 
                this.inventory.inventory[key].slot === globalSlotIndex
            );
            return itemKey || null; 
        });
    
        return lastRowKeys;
    }
    
    

    selectSlot(index) {
        const slots = this.getLastRowInventoryKeys(); // Utilise la méthode centralisée pour les slots
        if (index >= 0 && index < slots.length) {
            this.selectedSlot = index; // Change le slot sélectionné
            this.triggerUpdate();
            const itemKey = slots[index]; // Récupère la clé de l'item
            if (itemKey && itemKey != null) {
                this.inventory.equipItem(itemKey); // Équipe l'objet correspondant
            } else{
                this.inventory.unequipItem();
            }
        } else {
            console.warn(`Index de slot invalide : ${index}`);
        }
    }
    

    getSelectedItem() {
        const slots = this.getActiveInventoryKeys();
        return slots[this.selectedSlot] || null;
    }
}
