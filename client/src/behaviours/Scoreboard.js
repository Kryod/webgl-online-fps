import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";
import NetworkManager from "../NetworkManager.js";

export default class Scoreboard extends Behaviour {
    start() {
        this.refs.$board = $("#scoreboard");
        this.refs.$scores = $("#score .score");
        this.refs.$time = $("#score .time");
        this.time = 0;
        this.shown = false;

        $("#score").show();
        NetworkManager.on("scores", this.updateBoard.bind(this));
        NetworkManager.send("request-scores", {});
        this.clockInterval = null;
    }

    update() {
        if (InputManager.isPointerLocked()) {
            if (InputManager.getKeyDown("Tab")) {
                this.show();
            } else if (InputManager.getKeyUp("Tab")) {
                this.hide();
            }
        }
    }

    show() {
        this.shown = true;
        this.refs.$board.show();
    }

    hide() {
        this.shown = false;
        this.refs.$board.hide();
    }

    updateBoard(scores) {
        this.scores = scores;

        var teams = ["blue", "red"];
        this.refs.$board.find("table tbody").empty();
        this.time = Math.round(scores.time);
        this.refs.$time.text(this.time);

        if (this.clockInterval != null) {
            clearInterval(this.clockInterval);
        }
        this.clockInterval = setInterval(this.updateClock.bind(this), 1000);

        for (var teamIdx in scores.teams) {
            var team = scores.teams[teamIdx];

            $(this.refs.$scores[teamIdx]).text(team.score);

            team.players.sort((a, b) => b.kills - a.kills);
            for (var player of team.players) {
                if (!this.scene.characters.hasOwnProperty(player.id)) {
                    continue;
                }

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

    updateClock() {
        this.time--;
        if (this.time >= 0) {
            this.refs.$time.text(this.time);
        } else {
            this.time = 0;
        }
    }
}
