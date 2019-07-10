const fs = require("fs");
const config = require("../config");
const maths = require("math.gl");
const cannon = require("cannon");

var server = null;
if (config.https === false) {
    const http = require("http");
    server = http.createServer();
} else {
    const https = require("https");
    server = https.createServer({
        "key": fs.readFileSync(config.https.key),
        "cert": fs.readFileSync(config.https.cert),
        "requestCert": false,
        "rejectUnauthorized": false
    });
}
const io = require("socket.io")(server);

var state = {
    "players": {},
    "bodies": {},
};

io.on("connection", client => {
    client.data = {
        "nickname": client.handshake.query.nickname || "",
        "body": createPlayerBody(new maths.Vector3(0, 3, 15)),
    };
    state.players[client.id] = client;

    client.on("input", data => {
        var mov = new maths.Vector3(data.mov);
        mov.normalize();
        client.data.movement = mov;

        client.data.rotation = data.rot;
    });

    client.on("disconnect", () => {
        world.remove(client.data.body);
        delete state.players[client.id];
    });
});

var world;
function setupPhysics() {
    world = new cannon.World();
    world.gravity.set(0, 0, -9.81);
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    var solver = new cannon.GSSolver();
    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;

    solver.iterations = 7;
    solver.tolerance = 0.1;
    world.solver = solver;

    world.broadphase = new cannon.NaiveBroadphase();

    var mat = new cannon.Material("slipperyMaterial");
    var contactMat = new cannon.ContactMaterial(mat, mat, 0.0, 0.3);
    world.addContactMaterial(contactMat);

    createGround();
    createBall();
}

function createGround() {
    var body = new cannon.Body({
        "shape": new cannon.Plane(),
        "mass": 0,
    });
    world.add(body);
}

function createBall() {
    var body = new cannon.Body({
        "mass": 1,
        "position": new cannon.Vec3(0, 0, 300),
        "shape": new cannon.Sphere(0.5),
    });
    world.add(body);
    state.bodies["ball"] = body;
}

function createPlayerBody(pos) {
    var body = new cannon.Body({
        "mass": 60,
        "linearDamping": 0.95,
        "fixedRotation": true,
        "position": new cannon.Vec3(pos.x, pos.z, pos.y),
        "shape": new cannon.Box(new cannon.Vec3(0.5, 0.5, 1.8)),
    });
    world.add(body);
    return body;
}

var ticks = 40;
var timestep = 1.0 / ticks;
var lastUpdate = Date.now();

function mainLoop() {
    var now = Date.now();
    var dt = (now - lastUpdate) / 1000.0;
    lastUpdate = now;

    world.step(dt);

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
            player.data.body.position.x += mov.x;
            player.data.body.position.y += mov.y;
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
        var pos = playerData.body.position;
        stripped.players[key] = {
            "pos": [ pos.x, pos.z - 1.8, pos.y ],
            "rot": playerData.rotation,
            "moving": movement.x != 0 || movement.z != 0,
            "nickname": playerData.nickname,
        };
    }

    {
        var pos = state.bodies["ball"].position;
        stripped["ball"] = [ pos.x, pos.z, pos.y ];
    }

    return stripped;
}

(function start() {
    setupPhysics();
    server.listen(config.port, config.host);
    setInterval(mainLoop, timestep * 1000.0);

    var protocol = config.https === false ? "http" : "https";
    console.log(`Server running on ${protocol}://${config.host}:${config.port}`);
})();
