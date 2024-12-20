export default class OtherPlayer {
    constructor(scene, sprite, id) {
        this.scene = scene;
        this.sprite = sprite;
        this.id = id;
    }

    update(data) {
        // Mets à jour la position du sprite
        this.sprite.setPosition(data.x, data.y);
    }

    destroy() {
        this.sprite.destroy();
    }
}