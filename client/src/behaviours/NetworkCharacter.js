import Behaviour from "./Behaviour.js";
import NetworkManager from "../NetworkManager.js";

export default class NetworkCharacter extends Behaviour {
    start() {
        this.connectToServer();
        this.refs.character = this.scene.characterController;

        this.lastMovement = new THREE.Vector3();
        this.lastRotation = 0;
    }

    update(dt) {
        var mov = this.refs.character.movement;
        var rot = -this.refs.character.euler.y;

        if (mov != undefined && rot != undefined && (!this.lastMovement.equals(mov) || this.lastRotation != rot)) {
            NetworkManager.send("input", {
                "mov": mov.toArray(),
                "rot": rot,
            });
            this.lastMovement = mov;
            this.lastRotation = rot;
        }
    }

    connectToServer() {
        var _this = this;
        NetworkManager.connect(function(mngr) {
            _this.playerId = mngr.id();

            mngr.on("state", function(state) {
                for (var id in state.players) {
                    var player = state.players[id];

                    if (id == _this.playerId) {
                        _this.refs.character.position(player.pos);
                    }
                }
            });
        });
    }
}
