import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";
import NetworkManager from "../NetworkManager.js";

export default class Scoreboard extends Behaviour {
    start() {
        this.refs.$board = $("#scoreboard");
        NetworkManager.on("scores", this.updateBoard.bind(this));
        NetworkManager.send("request-scores", {});
    }

    update() {
        if (InputManager.isPointerLocked()) {
            if (InputManager.getKeyDown("Tab")) {
                this.refs.$board.show();
            } else if (InputManager.getKeyUp("Tab")) {
                this.refs.$board.hide();
            }
        }
    }

    updateBoard(scores) {
        var teams = ["blue", "red"];
        this.refs.$board.find("table tbody").empty();

        for (var teamIdx in scores.teams) {
            var team = scores.teams[teamIdx];
            team.players.sort((a, b) => b.kills - a.kills);
            for (var player of team.players) {
                var $row = $("<tr>");
                var nickname = this.scene.characters[player.id].nickname;
                $row.append(`<td>${nickname}</td>`);
                $row.append(`<td>${player.kills}</td>`);
                $row.append(`<td>${player.deaths}</td>`);
                if (player.id == this.scene.characterController.refs.networkCharacter.playerId) {
                    $row.addClass("me");
                }
                this.refs.$board.find("table." + teams[teamIdx] + " tbody").append($row);
            }
        }
    }
}
