import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";

export default class CharacterController extends Behaviour {
    constructor(scene, domElement, object) {
        super();

        this.domElement = domElement;
        this.object = object;
        this.addToScene(scene);
        this.initialize();
    }

    addToScene(scene) {
        scene.behaviours.push(this);
    }

    initialize() {
        this.movementSpeed = 10.0;
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

        var mov = new THREE.Vector3();
        if (InputManager.getKey('z') || InputManager.getKey('w')) {
            mov.z -= 1.0;
        }
        if (InputManager.getKey('s')) {
            mov.z += 1.0;
        }
        if (InputManager.getKey('q') || InputManager.getKey('a')) {
            mov.x -= 1.0;
        }
        if (InputManager.getKey('d')) {
            mov.x += 1.0;
        }
        mov.normalize();
        mov.multiplyScalar(dt * this.movementSpeed);
        this.object.translateX(mov.x);
        this.object.translateZ(mov.z);
        this.object.position.y = 1.75;

        this.euler.setFromQuaternion(this.object.quaternion);
        mov = InputManager.mouseMovement();
        this.euler.y -= mov.x * this.cameraSensitivity;
        this.euler.x -= mov.y * this.cameraSensitivity;
        this.euler.x = Math.max(-this.cameraMaxAngle, Math.min(this.cameraMaxAngle, this.euler.x));
        this.object.quaternion.setFromEuler(this.euler);
    }
}
