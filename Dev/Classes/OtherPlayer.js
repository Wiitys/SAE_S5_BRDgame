export default class OtherPlayer {
    constructor(scene, id, x=0, y=0) {
        
        this.scene = scene;
        this.id = id;
        this.lastDirection = "down";
    }
}