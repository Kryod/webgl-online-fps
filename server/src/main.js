const server = require("http").createServer();
const io = require("socket.io")(server);
const maths = require("math.gl");

const projectile = {
    id: 0,
    pos: 0,
    forwardVector: new maths.Vector3(0),
    timer: 0,
    from: 0
};

var id_projectile = 0;

var state = {
    "players": {},
    "projectiles": {}
};

io.on("connection", client => {
    client.data = {
        "position": new maths.Vector3(0, 0, 15),
    };
    state.players[client.id] = client;

    client.on("input", data => {
        var mov = new maths.Vector3(data.mov);
        mov.normalize();
        client.data.movement = mov;

        client.data.rotation = data.rot;
    });

    client.on("fire", data => {
        var made_projectile = Object.create(projectile);
        made_projectile.pos = data.position;
        made_projectile.forwardVector = data.forwardVector;
        made_projectile.from = client.id;
        made_projectile.id = id_projectile;
        state.projectiles[id_projectile] = made_projectile;

        console.log(`added projectile ${made_projectile} with id ${id_projectile}`);
        id_projectile = id_projectile+1;
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

    /*for (var key in state.projectiles) {
        if (!state.projectiles.hasOwnProperty(key)) {
            continue;
        }

        var proj = state.projectiles[key];
        var fwdV = new maths.Vector3(proj.forwardVector[0], proj.forwardVector[1], proj.forwardVector[2]);
        //console.log(`fwdV = ${fwdV.x} ${fwdV.y} ${fwd.z}`);
        var movement = fwdV.scale(dt);
        var pos = new maths.Vector3(proj.pos[0], proj.pos[1], proj.pos[2]);
        pos.add(movement);
        proj.pos = pos;
    }*/

    io.emit("state",  stripState());
}

function stripState() {
    var stripped = {
        "players": {},
        "projectiles": {},
    };

    for (var key in state.players) {
        if (!state.players.hasOwnProperty(key)) {
            continue;
        }

        var movement = state.players[key].data.movement || new maths.Vector3();
        stripped.players[key] = {
            "pos": state.players[key].data.position,
            "rot": state.players[key].data.rotation,
            "moving": movement.x != 0 || movement.z != 0,
        };
    }

    for (var key in state.projectiles) {
        if (!state.projectiles.hasOwnProperty(key)) {
            continue;
        }

        //var movement = state.projectiles[key].data.movement || new maths.Vector3();
        stripped.projectiles[key] = {
            "id": key.id,
            "pos": state.projectiles[key].pos,
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
