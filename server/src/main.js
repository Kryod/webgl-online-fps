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
    forwardVector: new maths.Vector3(0, 0, 0),
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
var scores = {
    "teams": [
        {
            "score": 0,
            "players": [],
        },
        {
            "score": 0,
            "players": [],
        },
    ],
};
var level = levelGenerator.generate();

io.on("connection", client => {
    var nickname = client.handshake.query.nickname;
    if (nickname == null || nickname.trim() == "") {
        nickname = "Guest #" + Math.floor(Math.random() * 10000);
    }
    client.emit("nickname", nickname);
    client.data = {
        "nickname": nickname,
        "body": createPlayerBody(client),
        "health": 100,
        "canJump": true,
    };
    state.players[client.id] = client;
    var playerScore = {
        "id": client.id,
        "kills": 0,
        "deaths": 0,
    };
    if (scores.teams[0].players.length < scores.teams[1].players.length) {
        scores.teams[0].players.push(playerScore);
        client.data.team = 0;
    } else {
        scores.teams[1].players.push(playerScore);
        client.data.team = 1;
    }

    client.on("input", data => {
        if (client.data.health > 0.0) {
            var mov = new maths.Vector3(data.mov);
            mov.normalize();
            client.data.movement = mov;

            client.data.rotation = data.rot;
        }
    });

    client.on("fire", data => {
        if (client.data.health <= 0.0) {
            return;
        }

        var pos = client.data.body.position;
        var newProjectile = Object.create(projectile);
        newProjectile.pos = new maths.Vector3(pos.x, pos.y + 1.9 / 2 - 0.05, pos.z);
        newProjectile.forwardVector = new maths.Vector3(data.forwardVector.x, data.forwardVector.y, data.forwardVector.z);
        newProjectile.from = client.id;
        newProjectile.id = idProjectile;
        var body = new cannon.Body({
            "mass": 0.1,
            "shape": new cannon.Sphere(0.1),
            "position": new cannon.Vec3(newProjectile.pos.x, newProjectile.pos.y, newProjectile.pos.z),
            "velocity": new cannon.Vec3(data.forwardVector.x, data.forwardVector.y, data.forwardVector.z).scale(10),
        });
        world.add(body);
        body.collisionResponse = 0;
        newProjectile.body = body;
        state.projectiles[idProjectile] = newProjectile;

        idProjectile++;
    });

    client.on("jump", () => {
        if (!client.data.canJump || client.data.health <= 0.0) {
            return;
        }

        client.data.body.velocity.y = 12.5;
        client.data.canJump = false;
    });

    client.on("request-level", () => {
        client.emit("level", level);
    });

    client.on("request-scores", () => sendScores());

    client.on("disconnect", () => {
        bodiesToRemove.push(client.data.body);
        delete state.players[client.id];

        for (var team of scores.teams) {
            team.players = team.players.filter(player => player.id != client.id);
        }
        sendScores();
    });
});

var world;
var bodiesToRemove = [];
function setupPhysics() {
    world = new cannon.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    var solver = new cannon.GSSolver();

    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;

    solver.iterations = 7;
    solver.tolerance = 0.1;
    world.solver = new cannon.SplitSolver(solver);

    world.gravity.set(0, -20, 0);
    world.broadphase = new cannon.NaiveBroadphase();

    // Create a slippery material (friction coefficient = 0.0)
    physicsMaterial = new cannon.Material("slipperyMaterial");
    var physicsContactMaterial = new cannon.ContactMaterial(
        physicsMaterial,
        physicsMaterial,
        0.0, // friction coefficient
        0.8  // restitution
    );
    // We must add the contact materials to the world
    world.addContactMaterial(physicsContactMaterial);

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

function spawnPlayer(body) {
    var spawnAreaSize = 40;

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    };

    for (var b of world.bodies) {
        b.computeAABB();
    }
    while (true) {
        body.position = new cannon.Vec3(rand(-spawnAreaSize / 2, spawnAreaSize / 2), 2, rand(-spawnAreaSize / 2, spawnAreaSize / 2));
        body.computeAABB();
        var intersects = false;
        for (var other of world.bodies) {
            if (other != body && body.aabb.overlaps(other.aabb)) {
                intersects = true;
                break;
            }
        }
        if (!intersects) {
            break;
        }
    }
}

function createPlayerBody(client) {
    var body = new cannon.Body({
        "mass": 60,
        "linearDamping": 0.95,
        "fixedRotation": true,
        "position": null,
        "shape": new cannon.Box(new cannon.Vec3(0.65 / 2, 1.9 / 2, 0.4 / 2)),
    });
    spawnPlayer(body);
    world.add(body);

    body.addEventListener("collide", function(e) {
        // Check for collisions with projectiles
        for (var key in state.projectiles) {
            var projectile = state.projectiles[key];
            if (projectile.body.id == e.body.id) {
                if (projectile.from != client.id && client.data.health > 0) {
                    client.data.health -= 20;
                    io.emit("health", {
                        "player": client.id,
                        "value": client.data.health,
                    });

                    if (client.data.health <= 0) {
                        var killFeed = {
                            "killed": client.id,
                            "by": projectile.from,
                        };
                        var killerTeam = scores.teams[state.players[projectile.from].data.team];
                        var killedTeam = scores.teams[client.data.team];
                        killerTeam.score += 10;
                        for (var teamPlayer of killerTeam.players) {
                            if (teamPlayer.id == projectile.from) {
                                teamPlayer.kills++;
                            }
                        }
                        for (var teamPlayer of killedTeam.players) {
                            if (teamPlayer.id == client.id) {
                                teamPlayer.deaths++;
                            }
                        }

                        bodiesToRemove.push(body);
                        client.data.movement = null;

                        io.emit("kill", killFeed);
                        sendScores();

                        respawnTick(client, 5);
                    }
                }
            }
        }
    });
    return body;
}

function checkJump(playerData) {
    var body = playerData.body;

    var from = new cannon.Vec3(body.position.x, body.position.y - 1.9 / 2 - 0.005, body.position.z);
    var to = new cannon.Vec3(from.x, from.y - 0.25, from.z);
    var ray = new cannon.Ray(from, to);
    if (ray.intersectWorld(world, {
        "mode": cannon.Ray.ANY,
        "skipBackfaces": false,
    })) {
        playerData.canJump = true;
    }
}

var ticks = 40;
var timestep = 1.0 / ticks;
var lastUpdate = Date.now();

function mainLoop() {
    var now = Date.now();
    var dt = (now - lastUpdate) / 1000.0;
    lastUpdate = now;

    for (var body of bodiesToRemove) {
        world.remove(body);
    }
    bodiesToRemove = [];
    world.step(dt);

    for (var key in state.players) {
        if (!state.players.hasOwnProperty(key)) {
            continue;
        }

        var player = state.players[key];
        checkJump(player.data);

        if (player.data.movement != null) {
            var mov = new maths.Vector3(player.data.movement);
            mov.scale(3.0);
            mov.scale(dt);

            mov = new maths.Vector3(mov.x, mov.z, 0);
            mov.rotateZ({
                "radians": -player.data.rotation,
            });
            player.data.body.position.x += mov.x;
            player.data.body.position.z += mov.y;
            player.data.body.quaternion.setFromEuler(0, -player.data.rotation, 0, "XYZ");
        }
    }

    for (var key in state.projectiles) {
        if (!state.projectiles.hasOwnProperty(key)) {
            continue;
        }
        var proj = state.projectiles[key];

        proj.timer += dt;
        if (proj.timer >= 6.0) {
            delete state.projectiles[key];
            bodiesToRemove.push(proj.body);
            continue;
        }
        proj.pos = proj.body.position;
    }

    io.emit("state",  stripState());

    if (config.debug === true) {
        world.bodies.forEach(b => b.computeAABB());

        io.emit("debug", {
            "aabb": world.bodies.map(b => b.aabb),
        });
    }
}

function respawnTick(client, time) {
    io.emit("respawn", {
        "player": client.id,
        "time": time,
    });
    if (time > 0) {
        setTimeout(function() {
            respawnTick(client, time - 1);
        }, 1000);
    } else {
        client.data.health = 100;
        spawnPlayer(client.data.body);
        world.add(client.data.body);
        io.emit("health", {
            "player": client.id,
            "value": client.data.health,
        });
    }
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
        var movement = playerData.movement || new maths.Vector3(0, 0, 0);
        var pos = playerData.body.position;
        stripped.players[key] = {
            "pos": [ pos.x, pos.y - 1.9 / 2, pos.z ],
            "rot": playerData.rotation,
            "moving": movement.x != 0 || movement.z != 0,
            "nickname": playerData.nickname,
            "team": playerData.team,
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

function sendScores() {
    io.emit("scores", scores);
}

(function start() {
    setupPhysics();
    server.listen(config.port, config.host);
    setInterval(mainLoop, timestep * 1000.0);

    var protocol = config.https === false ? "http" : "https";
    console.log(`Server running on ${protocol}://${config.host}:${config.port}`);
})();
