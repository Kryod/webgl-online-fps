const fs = require("fs");
const config = require("../config");
const maths = require("math.gl");
const cannon = require("cannon");
const util = require("util");
const levelGenerator = require("./levelgenerator");

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


const projectile = {
    id: 0,
    pos: 0,
    forwardVector: new maths.Vector3(0),
    timer: 0,
    from: 0,
    body: undefined,
};

var idProjectile = 0;

var state = {
    "players": {},
    "bodies": {},
    "projectiles": {}
};

var level = levelGenerator.generate();

io.on("connection", client => {
    client.data = {
        "nickname": client.handshake.query.nickname || "",
        "body": createPlayerBody(),
    };
    state.players[client.id] = client;

    client.on("input", data => {
        var mov = new maths.Vector3(data.mov);
        mov.normalize();
        client.data.movement = mov;

        client.data.rotation = data.rot;
    });

    var pos = client.data.body.position;
    client.on("fire", data => {
        var newProjectile = Object.create(projectile);
        newProjectile.pos = new maths.Vector3(pos.x, pos.y - 0.05, pos.z);
        newProjectile.forwardVector = new maths.Vector3(data.forwardVector.x, data.forwardVector.y, data.forwardVector.z);
        newProjectile.from = client.id;
        newProjectile.id = idProjectile;
        var body = new cannon.Body({
            "mass": 0.1,
            "position": new cannon.Vec3(newProjectile.pos.x, newProjectile.pos.y, newProjectile.pos.z),
            "shape": new cannon.Sphere(0.25),
            "velocity": new cannon.Vec3(data.forwardVector.x, data.forwardVector.z, data.forwardVector.y),
        });
        world.add(body);
        body.collisionResponse = 0;
        body.addEventListener("collide", function(e) {
            console.log("colision");
        })

        state.projectiles[idProjectile] = newProjectile;

        idProjectile++;
    });

    client.on("request-level", () => {
        client.emit("level", level);
    });

    client.on("disconnect", () => {
        world.remove(client.data.body);
        delete state.players[client.id];
    });
});

var world;
function setupPhysics() {
    world = new cannon.World();
    world.gravity.set(0, -9.81, 0);
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
    createBoxes();
}

function createGround() {
    var body = new cannon.Body({
        "shape": new cannon.Plane(),
        "mass": 0,
    });
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0, "XYZ");
    world.add(body);
}

function createBall() {
    var body = new cannon.Body({
        "mass": 1,
        "position": new cannon.Vec3(0, 300, 0),
        "shape": new cannon.Sphere(0.5),
    });
    world.add(body);
    state.bodies["ball"] = body;
}

function createBoxes() {
    for (var box of level.boxes) {
        world.add(levelGenerator.makeBoxBody(box));
    }
}

function createPlayerBody(pos) {
    function rand(min, max) {
        return Math.random() * (max - min) + min;
    };

    var body = new cannon.Body({
        "mass": 60,
        "linearDamping": 0.95,
        "fixedRotation": true,
        "position": new cannon.Vec3(rand(-20, 20), 5, rand(-20, 20)),
        "shape": new cannon.Box(new cannon.Vec3(0.5, 1.8, 0.5)),
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
            player.data.body.position.z += mov.y;
        }
    }

    for (var key in state.projectiles) {
        if (!state.projectiles.hasOwnProperty(key)) {
            continue;
        }

        state.projectiles[key].timer += dt;
        if (state.projectiles[key].timer >= 6.0) {
            delete state.projectiles[key];
            continue;
        }

        var proj = state.projectiles[key];
        var fwdV = proj.forwardVector;
        var movement = fwdV.clone().scale(dt);
        proj.pos.add(movement);
    }

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

        var playerData = state.players[key].data;
        var movement = playerData.movement || new maths.Vector3();
        var pos = playerData.body.position;
        stripped.players[key] = {
            "pos": [ pos.x, pos.y - 1.8, pos.z ],
            "rot": playerData.rotation,
            "moving": movement.x != 0 || movement.z != 0,
            "nickname": playerData.nickname,
        };
    }

    {
        var pos = state.bodies["ball"].position;
        stripped["ball"] = [ pos.x, pos.y, pos.z ];
    }

    for (var key in state.projectiles) {
        if (!state.projectiles.hasOwnProperty(key)) {
            continue;
        }

        stripped.projectiles[key] = {
            "id": state.projectiles[key].id,
            "pos": state.projectiles[key].pos,
        };
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
