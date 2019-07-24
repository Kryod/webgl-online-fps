const maths = require("math.gl");
const cannon = require("cannon");

class Player {
    constructor(nickname, world) {
        this.nickname = nickname;
        this.health = 100;
        this.canJump = true;
        this.lastShot = Date.now();
        this.movement = new maths.Vector3(0, 0, 0);
        this.rotation = 0;
        this.team = -1;
        this.spawn(world);
    }

    spawn(world) {
        if (this.body == undefined) {
            this.body = new cannon.Body({
                "mass": 60,
                "linearDamping": 0.95,
                "fixedRotation": true,
                "shape": new cannon.Box(new cannon.Vec3(0.6 / 2, 1.9 / 2, 0.4 / 2)),
            });
        }

        var spawnAreaSize = 40;

        function rand(min, max) {
            return Math.random() * (max - min) + min;
        };

        for (var b of world.bodies) {
            b.computeAABB();
        }
        while (true) {
            this.body.position = new cannon.Vec3(rand(-spawnAreaSize / 2, spawnAreaSize / 2), 2, rand(-spawnAreaSize / 2, spawnAreaSize / 2));
            this.body.computeAABB();
            var intersects = false;
            for (var other of world.bodies) {
                if (other != this.body && this.body.aabb.overlaps(other.aabb)) {
                    intersects = true;
                    break;
                }
            }
            if (!intersects) {
                break;
            }
        }

        this.canJump = true;
        this.lastShot = Date.now();

        world.add(this.body);
    }

    timeSinceLastShot() {
        return Date.now() - this.lastShot;
    }

    shoot() {
        this.lastShot = Date.now();
    }

    jump() {
        this.body.velocity.y = 12.5;
        this.canJump = false;
    }

    move(mov, dt) {
        mov.scale(4.0);
        mov.scale(dt);

        mov = new maths.Vector3(mov.x, mov.z, 0);
        mov.rotateZ({
            "radians": -this.rotation,
        });
        this.body.position.x += mov.x;
        this.body.position.z += mov.y;
        this.body.quaternion.setFromEuler(0, -this.rotation, 0, "XYZ");
    }

    checkJump(world) {
        if (this.canJump) {
            // No need to check if the player can already jump
            return;
        }

        var from = new cannon.Vec3(this.body.position.x, this.body.position.y - 1.9 / 2 + 0.005, this.body.position.z);
        var to = new cannon.Vec3(from.x, from.y + 0.25, from.z);
        var ray = new cannon.Ray(from, to);
        var bodies = Array.from(world.bodies);
        bodies.filter(b => b.id != this.body.id);
        var result = new cannon.RaycastResult();
        ray.intersectBodies(bodies, result);
        if (result.hasHit) {
            this.canJump = true;
        }
    }

    die() {
        this.health = 0;
        this.body.position.y = 1;
        this.movement = new maths.Vector3(0, 0, 0);
    }

    respawn(world) {
        this.health = 100;
        this.spawn(world);
    }

    strip() {
        var pos = this.body.position;
        var mov = this.movement;
        return {
            "pos": [ pos.x, pos.y - 1.9 / 2, pos.z ],
            "rot": this.rotation,
            "moving": mov.x != 0 || mov.z != 0,
            "nickname": this.nickname,
            "team": this.team,
        };
    }
}

module.exports = Player;
