const maths = require("math.gl");
const cannon = require("cannon");

class Projectile {
    constructor(position, forwardVector, world) {
        this.pos = position;
        this.forwardVector = forwardVector;
        this.id = Projectile.nextId;
        Projectile.nextId++;
        this.timer = 0;
        this.from = 0;

        var body = new cannon.Body({
            "mass": 0.1,
            "shape": new cannon.Sphere(0.1),
            "position": new cannon.Vec3(this.pos.x, this.pos.y, this.pos.z),
            "velocity": new cannon.Vec3(forwardVector.x, forwardVector.y, forwardVector.z).scale(15),
            "linearDamping": 0.3,
        });
        body.collisionResponse = 0;
        this.body = body;
        world.add(this.body);
    }

    checkCollisions(bodies, ticks) {
        var from = this.body.position.clone();
        var to = from.clone().vadd(this.body.velocity.clone());
        var ray = new cannon.Ray(from, to);
        var result = new cannon.RaycastResult();
        ray.intersectBodies(bodies, result);

        var bodyHit = null;
        if (result.hasHit && result.distance < this.body.velocity.length() / ticks) {
            for (var other of bodies) {
                if (other.id == result.body.id) {
                    bodyHit = other;
                    break;
                }
            }
        }
        return bodyHit;
    }

    strip() {
        return {
            "id": this.id,
            "pos": this.pos,
            "team": this.team,
        };
    }
}

Projectile.nextId = 0;

module.exports = Projectile;
