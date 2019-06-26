import Behaviour from "./Behaviour.js";
import NetworkManager from "../NetworkManager.js";

export default class NetworkCharacter extends Behaviour {
    constructor(scene, characterController) {
        super(scene);

        this.refs.characterController = characterController;
    }

    start() {
        this.lastMovement = new THREE.Vector3();
        this.lastRotation = 0;

        this.prevTarget = new THREE.Vector3();
        this.nextTarget = new THREE.Vector3();
        this.lerpProgress = 0.0;
    }

    update(dt) {
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

        var pos = new THREE.Vector3();
        pos.lerpVectors(this.prevTarget, this.nextTarget, this.lerpProgress / 0.025);
        this.lerpProgress += dt;
        this.refs.characterController.position(pos);
    }

    onNetworkState(state) {
        this.prevTarget = this.nextTarget;
        var pos = state.players[this.playerId].pos;
        this.nextTarget = new THREE.Vector3(pos[0], pos[1], pos[2]);
        this.lerpProgress = 0.0;
    }
}
