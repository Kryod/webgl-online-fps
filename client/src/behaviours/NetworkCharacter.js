import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";
import NetworkManager from "../NetworkManager.js";

export default class NetworkCharacter extends Behaviour {
    constructor(scene, id, characterController, camera) {
        super(scene);

        this.playerId = id;
        this.refs.characterController = characterController;
        this.refs.camera = camera;
    }

    start() {
        this.lastMovement = new THREE.Vector3();
        this.lastRotation = 0;

        this.prevTarget = new THREE.Vector3();
        this.nextTarget = new THREE.Vector3();
        this.lerpProgress = 0.0;

        NetworkManager.on("state", this.onNetworkState.bind(this));
    }

    update(dt) {
        if (this.refs.characterController.isLocalPlayer) {
            var mov = this.refs.characterController.movement;
            var rot = this.refs.characterController.euler.y;

            if (mov != undefined && rot != undefined && (!this.lastMovement.equals(mov) || this.lastRotation != rot)) {
                NetworkManager.send("input", {
                    "mov": mov.toArray(),
                    "rot": rot,
                });
                this.lastMovement = mov;
                this.lastRotation = rot;
            }

            if (InputManager.getButtonDown(InputManager.MOUSE_LEFT_BUTTON)) {
                var pos = new THREE.Vector3();
                var forwardVector = new THREE.Vector3();
                this.refs.camera.getWorldDirection(forwardVector);
                this.refs.camera.getWorldPosition(pos);
                forwardVector = forwardVector.multiplyScalar(5);
                NetworkManager.send("fire", {
                    "forwardVector": forwardVector,
                });
            }
        }

        var pos = new THREE.Vector3();
        if (this.prevTarget != undefined && this.nextTarget != undefined) {
            pos.lerpVectors(this.prevTarget, this.nextTarget, this.lerpProgress / 0.025);
            this.lerpProgress += dt;
            this.refs.characterController.position(pos);
        }
    }

    onNetworkState(state) {
        this.prevTarget = this.nextTarget;
        var pos = state.players[this.playerId].pos;
        this.nextTarget = new THREE.Vector3(pos[0], pos[1], pos[2]);
        this.lerpProgress = 0.0;
    }
}
