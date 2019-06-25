import Behaviour from "./Behaviour.js";
import NetworkManager from "../NetworkManager.js";

export default class NetworkCharacter extends Behaviour {
    start() {
        this.connectToServer();
        this.refs.character = this.scene.characterController;
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
