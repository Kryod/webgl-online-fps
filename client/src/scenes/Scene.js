export default class Scene extends THREE.Scene {
    constructor(app, data) {
        super();

        this.camera = new THREE.PerspectiveCamera(75, app.clientWidth / app.clientHeight, 0.25, 500.0);
        this.behaviours = [];
        app.update = this.update.bind(this);
    }

    start() {
        this.behaviours.forEach(behaviour => {
            if (behaviour.enabled === true) {
                behaviour.start();
                behaviour.started = true;
            }
        });
    }

    stop() {

    }

    update(dt) {
        this.behaviours.forEach(behaviour => {
            if (behaviour.enabled === true) {
                if (!behaviour.started) {
                    behaviour.start();
                    behaviour.started = true;
                }
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
