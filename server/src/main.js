const server = require("http").createServer();
const io = require("socket.io")(server);

players = {};

io.on("connection", client => {
    client.data = {
        "position": { "x": -10, "y": 1.75, "z": 5 },
    };
    players[client.id] = client;

    client.on("disconnect", () => {
        delete players[client.id];
    });
});

function mainLoop() {
    var state = {
        "players": {},
    };

    for (var key in players) {
        if (!players.hasOwnProperty(key)) {
            continue;
        }

        var player = players[key];

        state.players[player.id] = {
            "pos": player.data.position,
        };
    }

    io.emit("state", state);
}

var host = "0.0.0.0";
var port = 28333;
var ticks = 40;
server.listen(port, host);
setInterval(mainLoop, 1.0 / ticks * 1000.0);

console.log(`Server running on ${host}:${port}`);
