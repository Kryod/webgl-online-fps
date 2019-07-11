import Behaviour from "./Behaviour.js";
import NetworkManager from "../NetworkManager.js";

export default class KillFeed extends Behaviour {
    start() {
        this.refs.$feed = $("#kill-feed");
        this.scores = {};
        NetworkManager.on("scores", this.onScores.bind(this));
        NetworkManager.on("kill", this.onNetworkKillFeed.bind(this));
    }

    showKill(killer, killed) {
        var $entry = $("<div class=\"entry\"></div>");
        $entry.append(`<span class="${killer.color}">${killer.nickname}</span>`);
        $entry.append("<img src=\"img/gun.png\">");
        $entry.append(`<span class="${killed.color}">${killed.nickname}</span>`);

        this.refs.$feed.append($entry);

        setTimeout(function() {
            $entry.animate({
                "opacity": 0.0,
            }, 300, function() {
                $entry.animate({
                    "height": 0.0
                }, 200, function() {
                    $entry.remove();
                });
            });
        }, 3000);
    }

    onNetworkKillFeed(kill) {
        var killer = "";
        var killed = "";
        var teams = ["blue", "red"];
        var killerTeam = 0;
        var killedTeam = 0;
        for (var teamIdx in this.scores.teams) {
            for (var player of this.scores.teams[teamIdx].players) {
                if (player.id == kill.by) {
                    killerTeam = teamIdx;
                }
                if (player.id == kill.killed) {
                    killedTeam = teamIdx;
                }
            }
        }

        for (var id in this.scene.characters) {
            if (!this.scene.characters.hasOwnProperty(id)) {
                continue;
            }

            var character = this.scene.characters[id];
            if (id == kill.by) {
                killer = character.nickname;
            }
            if (id == kill.killed) {
                killed = character.nickname;
            }
        }

        if (killer == "" || killed == "") {
            return;
        }

        this.showKill({
            "nickname": killer,
            "color": teams[killerTeam],
        }, {
            "nickname": killed,
            "color": teams[killedTeam],
        });
    }

    onScores(scores) {
        this.scores = scores;
    }
}
