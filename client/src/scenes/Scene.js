export default class Scene extends THREE.Scene {
    constructor(app) {
        super();

        this.camera = new THREE.PerspectiveCamera(75, app.clientWidth / app.clientHeight, 0.25, 500.0);
        this.behaviours = [];
        app.update = this.update.bind(this);
    }

    update(dt) {
        this.behaviours.forEach(behaviour => {
            if (behaviour.enabled === true) {
                behaviour.update(dt);
            }
        });
    }

    onClientResized(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    addBehaviour(behaviour) {
        this.behaviours.push(behaviour);
    }
}
