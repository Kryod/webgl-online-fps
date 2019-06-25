export default class Behaviour {
    constructor(scene) {
        this.refs = {};
        this.scene = scene;
        this.enabled = true;
        this.addToScene();
    }

    addToScene() {
        this.scene.behaviours.push(this);
    }

    destroy() {
        this.enabled = false;

        var idx = this.scene.behaviours.indexOf(this);
        if (idx > -1) {
            this.scene.behaviours.splice(idx, 1);
        }
    }

    start() {

    }

    update(dt) {

    }
}
