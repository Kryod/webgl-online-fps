import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";
import Projectile from "./Projectile.js";

export default class CharacterController extends Behaviour {
    constructor(scene, object) {
        super(scene);

        this.object = object;
    }

    start() {
        this.cameraSensitivity = 0.002;
        this.cameraMaxAngle = Math.PI / 3.0;
        this.euler = new THREE.Euler(0, 0, 0, "YXZ");
    }

    update(dt) {
        if (!InputManager.isPointerLocked()) {
            return;
        }

        if (InputManager.getButtonDown(InputManager.MOUSE_LEFT_BUTTON)) {
            var forwardVector = new THREE.Vector3();
            this.scene.camera.getWorldDirection(forwardVector);
            this.sphere = new Projectile(this.scene, 0.1, this.object.position.x, this.object.position.y, this.object.position.z, forwardVector);
        }

        this.movement = new THREE.Vector3();
        if (InputManager.getKey('z') || InputManager.getKey('w')) {
            this.movement.z -= 1.0;
        }
        if (InputManager.getKey('s')) {
            this.movement.z += 1.0;
        }
        if (InputManager.getKey('q') || InputManager.getKey('a')) {
            this.movement.x -= 1.0;
        }
        if (InputManager.getKey('d')) {
            this.movement.x += 1.0;
        }

        this.euler.setFromQuaternion(this.object.quaternion);
        var mouseMov = InputManager.mouseMovement();
        this.euler.y -= mouseMov.x * this.cameraSensitivity;
        this.euler.x -= mouseMov.y * this.cameraSensitivity;
        this.euler.x = Math.max(-this.cameraMaxAngle, Math.min(this.cameraMaxAngle, this.euler.x));
        this.object.quaternion.setFromEuler(this.euler);
    }

    position(val) {
        if (val == undefined) {
            return this.object.position;
        }

        if (Array.isArray(val)) {
            this.object.position.set(val[0], val[1], val[2]);
        } else {
            this.object.position.set(val.x, val.y, val.z);
        }
    }
}
