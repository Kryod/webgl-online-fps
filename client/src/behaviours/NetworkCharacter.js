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
    }
}
