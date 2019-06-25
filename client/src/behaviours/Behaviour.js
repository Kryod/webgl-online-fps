export default class Behaviour {
    constructor(scene) {
        this.refs = {};
        this.scene = scene;
        this.enabled = true;
        this.addToScene(scene);
    }

    addToScene(scene) {
        scene.behaviours.push(this);
    }

    start() {

    }

    update(dt) {

    }
}
