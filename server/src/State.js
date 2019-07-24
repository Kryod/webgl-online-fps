class State {
    constructor() {
        this.players = {};
        this.reset();
    }

    reset() {
        this.bodies = {};
        this.projectiles = {};
        this.gameOver = false;
    }

    getPlayersArray() {
        return Object.values(this.players);
    }

    getProjectilesArray() {
        return Object.values(this.projectiles);
    }

    strip() {
        var stripped = {
            "players": {},
            "projectiles": {},
        };

        for (var player of this.getPlayersArray()) {
            stripped.players[player.id] = player.data.strip();
        }

        for (var proj of this.getProjectilesArray()) {
            stripped.projectiles[proj.id] = proj.strip();
        }

        {
            var pos = this.bodies["ball"].position;
            stripped["ball"] = [ pos.x, pos.y, pos.z ];
        }

        return stripped;
    }
}

module.exports = State;
