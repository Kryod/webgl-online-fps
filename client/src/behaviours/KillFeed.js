import Behaviour from "./Behaviour.js";

export default class KillFeed extends Behaviour {
    start() {
        this.refs.$feed = $("#kill-feed");
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
}
