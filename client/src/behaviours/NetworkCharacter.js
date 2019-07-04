import Behaviour from "./Behaviour.js";
import Projectile from "./Projectile.js";
import InputManager from "../InputManager.js";
import NetworkManager from "../NetworkManager.js";

export default class NetworkCharacter extends Behaviour {
    constructor(scene, characterController, camera) {
        super(scene);

        this.refs.characterController = characterController;
        this.refs.camera = camera;
    }

    start() {
        this.lastMovement = new THREE.Vector3();
        this.lastRotation = 0;
    }

    update(dt) {
        var mov = this.refs.characterController.movement;
        var rot = this.refs.characterController.euler.y;

        if (InputManager.getButtonDown(InputManager.MOUSE_LEFT_BUTTON)) {
            var pos = new THREE.Vector3();
            var forwardVector = new THREE.Vector3();
            this.refs.camera.getWorldDirection(forwardVector);
            this.refs.camera.getWorldPosition(pos);
            NetworkManager.send("fire", {
                "forwardVector": forwardVector,
                "position": pos
            });

            new Projectile(this.scene, pos, forwardVector, 0.1, 20);
        }

        if (mov != undefined && rot != undefined && (!this.lastMovement.equals(mov) || this.lastRotation != rot)) {
            NetworkManager.send("input", {
                "mov": mov.toArray(),
                "rot": rot,
            });
            this.lastMovement = mov;
            this.lastRotation = rot;
        }
    }
}
