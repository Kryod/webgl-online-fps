const cannon = require("cannon");

var areaSize = 30;

var randInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var randFloat = function(min, max, decimals = 2) {
    var rand = Math.random() * (max - min) + min;
    var power = Math.pow(10, decimals);
    return Math.floor(rand * power) / power;
};

module.exports = {
    "generate": function() {
        var level = {
            "boxes": [],
        };
        var boxesBodies = [];

        var n = randInt(12, 20);
        for (var i = 0; i < n; ++i) {
            var box = {
                "modelScale": 1,
                "skin": randInt(0, 1),
            };
            var body;

            if (box.skin == 0) {
                box.modelScale = 1 / 200;
            } else if (box.skin == 1) {
                box.modelScale = 1 / 500;
            }

            while (true) {
                // Generate a new box until we make one that does not collide with the others
                box.x = randFloat(-areaSize / 2, areaSize / 2);
                box.y = 0;
                box.z = randFloat(-areaSize / 2, areaSize / 2);
                box.rotation = randFloat(0, 360);
                box.scale = randFloat(1.0, 4.0, 2);

                var halfExtents = box.scale / 2.0;
                var body = this.makeBoxBody(box);
                var intersects = false;
                for (var other of boxesBodies) {
                    if (body.aabb.overlaps(other.aabb)) {
                        intersects = true;
                        break;
                    }
                }
                if (!intersects) {
                    break;
                }
            }
            boxesBodies.push(body);
            level.boxes.push(box);
        }

        return level;
    },

    "makeBoxBody": function(box) {
        var halfExtents = box.scale / 2.0;
        var body = new cannon.Body({
            "mass": 0,
            "position": new cannon.Vec3(box.x, box.y, box.z),
            "shape": new cannon.Box(new cannon.Vec3(halfExtents, halfExtents, halfExtents)),
        });
        body.quaternion.setFromEuler(0, box.rotation * Math.PI / 180, 0, "XYZ");
        return body;
    },
};
