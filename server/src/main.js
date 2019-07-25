const fs = require("fs");
const path = require("path");
const maths = require("math.gl");
const cannon = require("cannon");
const State = require("./State.js");
const Player = require("./Player.js");
const Projectile = require("./Projectile.js");
const levelGenerator = require("./levelgenerator");

var config = null;
loadConfig();

var server = null;
if (config.server.https.enabled === true) {
    const https = require("https");
    server = https.createServer({
        "key": fs.readFileSync(path.resolve(__dirname + "/..", config.server.https.key)),
        "cert": fs.readFileSync(path.resolve(__dirname + "/..", config.server.https.cert)),
        "requestCert": false,
        "rejectUnauthorized": false,
    });
} else {
    const http = require("http");
    server = http.createServer();
}
const io = require("socket.io")(server, {
    "pingInterval": config.server.pingInterval,
});

var state = new State();
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
    "time": 0,
};
var level;
var world;
var emptyRoomResetTimeout;
resetGame();

io.on("connection", client => {
    var nickname = client.handshake.query.nickname;
    if (nickname == null || nickname.trim() == "") {
        nickname = "Guest #" + Math.floor(Math.random() * 10000);
    }
    client.emit("nickname", nickname);
    client.data = new Player(nickname, world);
    state.players[client.id] = client;
    var playerScore = {
        "id": client.id,
        "kills": 0,
        "deaths": 0,
    };
    if (scores.teams[0].players.length <= scores.teams[1].players.length) {
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
        if (client.data.timeSinceLastShot() < 200) {
            return;
        }

        var pos = client.data.body.position;
        pos = new maths.Vector3(pos.x, pos.y + 1.9 / 2 - 0.05, pos.z);
        var forwardVector = new maths.Vector3(data.forwardVector.x, data.forwardVector.y, data.forwardVector.z)
        var projectile = new Projectile(pos, forwardVector, world);
        projectile.team = client.data.team;
        projectile.from = client.id;
        state.projectiles[projectile.id] = projectile;

        io.emit("shot", {
            "player": client.id,
        });
        client.data.shoot(); // This resets the cooldown
    });

    client.on("jump", () => {
        if (!client.data.canJump || client.data.health <= 0.0) {
            return;
        }

        client.data.jump();
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

        if (state.getPlayersArray().length == 0) {
            emptyRoomResetTimeout = setTimeout(resetGame, config.game.emptyRoomResetTime * 1000);
        }
    });

    if (emptyRoomResetTimeout != null) {
        clearTimeout(emptyRoomResetTimeout);
    }
});

var bodiesToRemove = [];
function setupPhysics() {
    world = new cannon.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    var solver = new cannon.GSSolver();

    world.defaultContactMaterial.contactEquationStiffness = 1e8;
    world.defaultContactMaterial.contactEquationRelaxation = 3;

    solver.iterations = 10;
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
        0.8, // restitution
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
    body.addEventListener("collide", deleteProjectile);
    world.add(body);
}

function deleteProjectile(e) {
    for (var proj of state.getProjectilesArray()) {
        if (proj.body.id == e.body.id) {
            delete state.projectiles[proj.id];
            bodiesToRemove.push(proj.body);
        }
    }
}

function createBall() {
    var body = new cannon.Body({
        "mass": 1,
        "position": new cannon.Vec3(0, 300, 0),
        "shape": new cannon.Sphere(0.5),
        "linearDamping": 0.3,
    });
    world.add(body);
    body.addEventListener("collide", deleteProjectile);
    state.bodies["ball"] = body;
}

function createBoxes() {
    for (var box of level.boxes) {
        var body = levelGenerator.makeBoxBody(box);
        body.addEventListener("collide", deleteProjectile);
        world.add(body);
    }
}

function playerMovement(player, dt) {
    if (player.data.movement == null) {
        return;
    }

    player.data.move(new maths.Vector3(player.data.movement), dt);
}

var ticks = 40;
var timestep = 1.0 / ticks;
var lastUpdate = Date.now();

function mainLoop() {
    var now = Date.now();
    var dt = (now - lastUpdate) / 1000.0;
    lastUpdate = now;

    if (state.getPlayersArray().length > 0) {
        // Pass time while at least one player is connected
        scores.time -= dt;
    }

    for (var body of bodiesToRemove) {
        world.remove(body);
    }
    bodiesToRemove = [];
    world.step(dt);

    // Check players-projectiles collisions
    var playerBodies = state.getPlayersArray().map(p => p.data.body);
    if (playerBodies.length > 0) {
        for (var proj of state.getProjectilesArray()) {
            var hitBody = proj.checkCollisions(playerBodies, ticks);
            if (hitBody != null && hitBody.id != state.players[proj.from].data.body.id) {
                var player = state.getPlayersArray().find(p => p.data.body.id == hitBody.id);
                onPlayerHit(proj, player);
            }
        }
    }

    // Handle player movement and jumps
    for (var player of state.getPlayersArray()) {
        player.data.checkJump(world);
        playerMovement(player, dt);
    }

    // Remove old projectiles
    for (var proj of state.getProjectilesArray()) {
        proj.timer += dt;
        if (proj.timer >= 6.0) {
            delete state.projectiles[proj.id];
            bodiesToRemove.push(proj.body);
            continue;
        }
        proj.pos = proj.body.position;
    }

    io.emit("state",  state.strip());

    if (config.game.debug === true) {
        world.bodies.forEach(b => b.computeAABB());

        io.emit("debug", {
            "aabb": world.bodies.map(b => b.aabb),
        });
    }

    if (!state.gameOver) {
        var maxScore = null;
        var maxTeam = -1;
        for (var idx in scores.teams) {
            var t = scores.teams[idx];
            if (maxScore == null || t.score > maxScore) {
                maxScore = t.score;
                maxTeam = idx;
            }
        }
        var draw = true;
        for (var t of scores.teams) {
            if (t.score != maxScore) {
                draw = false;
            }
        }
        if (draw) {
            maxTeam = -1;
        }
        if (scores.time <= 0.0 || maxScore >= config.game.roundMaxScore) {
            state.gameOver = true;
            sendScores();
            io.emit("end", {
                "team": maxTeam,
            });
            setTimeout(resetGame, config.game.gameResetTime * 1000);
        }
    }
}

function onPlayerHit(projectile, client) {
    if (client.data.health <= 0) {
        return;
    }

    if (state.gameOver) {
        return;
    }

    var fromTeamId = state.players[projectile.from].data.team;
    var victimTeamId = client.data.team;
    var friendlyFire = fromTeamId == victimTeamId;

    if (friendlyFire && config.game.friendlyFire !== true) {
        return;
    }

    client.data.health -= 10;
    state.players[projectile.from].emit("hit", {
        "from": projectile.from,
        "hit": client.id,
    });
    io.emit("health", {
        "player": client.id,
        "value": client.data.health,
    });

    if (client.data.health <= 0) {
        var killFeed = {
            "killed": client.id,
            "by": projectile.from,
        };
        var killerTeam = scores.teams[fromTeamId];
        var killedTeam = scores.teams[victimTeamId];
        if (friendlyFire) {
            killerTeam.score -= 10;
        } else {
            killerTeam.score += 10;
        }
        for (var teamPlayer of killerTeam.players) {
            if (teamPlayer.id == projectile.from) {
                teamPlayer.kills += friendlyFire ? -1 : +1;
            }
        }
        for (var teamPlayer of killedTeam.players) {
            if (teamPlayer.id == client.id) {
                teamPlayer.deaths++;
            }
        }

        bodiesToRemove.push(client.data.body);
        client.data.die();

        io.emit("kill", killFeed);
        sendScores();

        respawnTick(client, config.game.respawnTime);
    }

    delete state.projectiles[projectile.id];
    bodiesToRemove.push(projectile.body);
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
        client.data.respawn(world);
        io.emit("health", {
            "player": client.id,
            "value": client.data.health,
        });
    }
}

function sendScores() {
    io.emit("scores", scores);
}

function resetGame() {
    loadConfig();

    // Reset state
    state.reset();
    bodiesToRemove = [];
    level = levelGenerator.generate();
    io.emit("level", level);
    setupPhysics();

    // Reset players
    for (var player of state.getPlayersArray()) {
        player.data.respawn(world);
        io.emit("health", {
            "player": player.id,
            "value": player.data.health,
        });
    }

    // Rebalance teams
    for (var t of scores.teams) {
        t.players = [];
    }
    var team = 0;
    for (var player of state.getPlayersArray()) {
        player.team = team;
        scores.teams[team].players.push({
            "id": player.id,
            "kills": 0,
            "deaths": 0,
        });
        io.emit("player-team", {
            "player": player.id,
            "team": team,
        });
        team = team == 0 ? 1 : 0;
    }

    // Reset scores
    scores.time = config.game.roundTime;
    for (var t of scores.teams) {
        t.score = 0;
    }
    sendScores();
}

(function start() {
    server.listen(config.server.port, config.server.host);
    setInterval(mainLoop, timestep * 1000.0);
    setInterval(sendScores, 5000);

    var protocol = config.server.https.enabled === true ? "https" : "http";
    console.log(`Server running on ${protocol}://${config.server.host}:${config.server.port}`);
})();

function loadConfig() {
    var contents = fs.readFileSync(path.resolve(__dirname, "../config.json"));
    config = JSON.parse(contents);
}
