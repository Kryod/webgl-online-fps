import Behaviour from "./Behaviour.js";
import NetworkManager from "../NetworkManager.js";

export default class SceneDebug extends Behaviour {
    start() {
        this.helpers = [];
        NetworkManager.on("debug", this.onDebugData.bind(this));
    }

    onDebugData(debug) {
        if (this.helpers.length > debug.aabb.length) {
            for (var i = this.helpers.length - 1; i != debug.aabb.length - 1; --i) {
                this.scene.remove(this.helpers[i]);
                this.helpers.splice(i, 1);
            }
        }

        for (var idx in debug.aabb) {
            var aabb = debug.aabb[idx];
            var lower = new THREE.Vector3(aabb.lowerBound.x, aabb.lowerBound.y, aabb.lowerBound.z);
            var upper = new THREE.Vector3(aabb.upperBound.x, aabb.upperBound.y, aabb.upperBound.z);
            var box = new THREE.Box3(lower, upper);

            if (idx >= this.helpers.length) {
                var helper = new THREE.Box3Helper(box, 0xFF0000);
                this.scene.add(helper);
                this.helpers.push(helper);
            } else {
                var helper = this.helpers[idx];
                helper.box = box;
            }
        }
    }

    reset() {
        for (var helper of this.helpers) {
            this.scene.remove(helper);
        }
        this.helpers = [];
    }
}
