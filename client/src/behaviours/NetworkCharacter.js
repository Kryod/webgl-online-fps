import Behaviour from "./Behaviour.js";
import NetworkManager from "../NetworkManager.js";

export default class NetworkCharacter extends Behaviour {
    constructor(scene, id, characterController) {
        super(scene);

        this.playerId = id;
        this.refs.characterController = characterController;
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
        }

        var pos = new THREE.Vector3();
        if (this.prevTarget != undefined && this.nextTarget != undefined) {
            pos.lerpVectors(this.prevTarget, this.nextTarget, this.lerpProgress / 0.025);
            this.lerpProgress += dt;
            this.refs.characterController.position(pos);
        }
    }

    onNetworkState(state) {
        if (!this.enabled) {
            return;
        }

        this.prevTarget = this.nextTarget;
        if (state.players[this.playerId] === undefined) {
            return;
        }
        var pos = state.players[this.playerId].pos;
        this.nextTarget = new THREE.Vector3(pos[0], pos[1], pos[2]);
        this.lerpProgress = 0.0;
    }
}
