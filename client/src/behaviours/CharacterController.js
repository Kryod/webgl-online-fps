import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";

export default class CharacterController extends Behaviour {
    constructor(scene, domElement, object) {
        super(scene);

        this.domElement = domElement;
        this.object = object;
    }

    start() {
        this.cameraSensitivity = 0.002;
        this.cameraMaxAngle = Math.PI / 3.0;
        this.pointerLocked = false;
        this.euler = new THREE.Euler(0, 0, 0, "YXZ");
        this.domElement.requestPointerLock = this.domElement.requestPointerLock ||
                                             this.domElement.mozRequestPointerLock ||
                                             this.domElement.webkitRequestPointerLock;
        $("#webgl").on("mousedown", this.onClicked.bind(this));
        $(document).on("pointerlockchange mozpointerlockchange webkitpointerlockchange", this.onPointerLockChanged.bind(this));
    }

    onClicked(e) {
        if (this.pointerLocked || e.button != InputManager.MOUSE_LEFT_BUTTON) {
            return;
        }
        this.domElement.requestPointerLock();
    }

    onPointerLockChanged(e) {
        this.pointerLocked = document.pointerLockElement === this.domElement ||
                             document.mozPointerLockElement === this.domElement ||
                             document.webkitPointerLockElement === this.domElement;
    }

    update(dt) {
        if (!this.pointerLocked) {
            return;
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
