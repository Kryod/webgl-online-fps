import Behaviour from "./Behaviour.js";
import LoaderManager from "../LoaderManager.js";

export default class CharacterController extends Behaviour {
    start() {
        this.boxes = [];
    }

    destroy() {
        super.destroy();
        this.clearLevel();
    }

    clearLevel() {
        for (var box of this.boxes) {
            this.scene.remove(box);
        }
        this.boxes = [];
    }

    loadBox(skin) {
        var box = null;

        if (skin == 0) {
            box = LoaderManager.get("box.fbx").clone();
            box.children.forEach(function(child) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material !== undefined) {
                    child.material.map = LoaderManager.get("box_albedotransparency.png");
                    child.material.normalMap = LoaderManager.get("box_normal.png");
                    child.material.aoMap = LoaderManager.get("box_ao.png");
                    child.material.metalnessMap = LoaderManager.get("box_metallicsmoothness.png");
                    child.material.needsUpdate = true;
                }
            });
        }

        if (skin == 1) {
            box = LoaderManager.get("crate.fbx").clone();
            box.children.forEach(function(child) {
                child.castShadow = true;
                child.receiveShadow = true;
            });
        }

        return box;
    }

    loadFromObject(level) {
        this.clearLevel();

        for (var boxData of level.boxes) {
            var box = this.loadBox(boxData.skin);

            box.position.set(boxData.x, 0.0, boxData.z);
            box.rotation.y = boxData.rotation * Math.PI / 180.0;
            var scale = boxData.scale * boxData.modelScale;
            box.scale.set(scale, scale, scale);

            this.scene.add(box);
            this.boxes.push(box);
        }
    }

    loadFromString(level) {
        this.loadFromObject(JSON.parse(level));
    }

    loadFromFile(path) {
        var _this = this;
        $.getJSON(path, function(data) {
            _this.loadFromObject(data);
        });
    }
}
