const server = require("http").createServer();
const io = require("socket.io")(server);
const maths = require("math.gl");

var state = {
    "players": {},
};

io.on("connection", client => {
    client.data = {
        "position": new maths.Vector3(0, 0, 15),
        "nickname": client.handshake.query.nickname || "",
    };
    state.players[client.id] = client;

    client.on("input", data => {
        var mov = new maths.Vector3(data.mov);
        mov.normalize();
        client.data.movement = mov;

        client.data.rotation = data.rot;
    });

    client.on("disconnect", () => {
        delete state.players[client.id];
    });
});

var lastUpdate = Date.now();
function mainLoop() {
    var now = Date.now();
    var dt = (now - lastUpdate) / 1000.0;
    lastUpdate = now;

    for (var key in state.players) {
        if (!state.players.hasOwnProperty(key)) {
            continue;
        }

        var player = state.players[key];

        if (player.data.movement != null) {
            var mov = new maths.Vector3(player.data.movement);
            mov.scale(3.0);
            mov.scale(dt);

            mov = new maths.Vector3([mov.x, mov.z, 0]);
            mov.rotateZ({
                "radians": -player.data.rotation,
            });
            player.data.position.x += mov.x;
            player.data.position.z += mov.y;
        }
    }

    io.emit("state",  stripState());
}

function stripState() {
    var stripped = {
        "players": {},
    };

    for (var key in state.players) {
        if (!state.players.hasOwnProperty(key)) {
            continue;
        }

        var playerData = state.players[key].data;
        var movement = playerData.movement || new maths.Vector3();
        stripped.players[key] = {
            "pos": playerData.position,
            "rot": playerData.rotation,
            "moving": movement.x != 0 || movement.z != 0,
            "nickname": playerData.nickname,
        };
    }

    return stripped;
}

var host = "0.0.0.0";
var port = 28333;
var ticks = 40;
server.listen(port, host);
setInterval(mainLoop, 1.0 / ticks * 1000.0);

console.log(`Server running on ${host}:${port}`);
