import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";
import Projectile from "./Projectile.js";

export default class CharacterController extends Behaviour {
    constructor(scene, domElement, object) {
        super(scene);

        this.domElement = domElement;
        this.object = object;
    }

    start() {
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

        if (InputManager.getButton(InputManager.MOUSE_LEFT_BUTTON)) {
            var forwardVector = new THREE.Vector3();
            this.scene.camera.getWorldDirection(forwardVector);
            this.sphere = new Projectile(this.scene, 0.1, this.object.position.x, this.object.position.y, this.object.position.z, forwardVector);
        }

        /*var mov = new THREE.Vector3();
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
        this.object.position.y = 1.75;*/

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

        this.object.position.set(val.x, val.y, val.z);
    }
}
