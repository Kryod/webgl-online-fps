import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";
import LoaderManager from "../LoaderManager.js";
import NetworkCharacter from "./NetworkCharacter.js";

var otherCharacters = [];

export default class CharacterController extends Behaviour {
    constructor(scene, playerId, nickname, team, isLocalPlayer = true) {
        super(scene);

        var teams = ["blue", "red"];
        this.team = team;
        this.skin = teams[team];

        var fbx = LoaderManager.get(`soldier_${this.skin}.fbx`);
        var model = THREE.SkeletonUtils.clone(fbx);
        model.scale.set(0.117, 0.117, 0.117);
        model.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0, "XYZ"));
        model.children.forEach(function(child) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material !== undefined) {
                child.material.normalMap = LoaderManager.get("soldier_normal.jpg");
                child.material.roughnessMap = LoaderManager.get("soldier_rough.jpg");
                child.material.metalnessMap = LoaderManager.get("soldier_metalness.jpg");
                child.material.needsUpdate = true;
            }
        });

        var group = new THREE.Group();
        var modelRotOffset = new THREE.Object3D();
        modelRotOffset.rotation.y = Math.PI / 2;
        modelRotOffset.add(model);
        group.add(modelRotOffset);
        if (isLocalPlayer) {
            group.add(scene.camera);
            scene.camera.position.set(0, 1.75, 0);
        } else {
            var font = LoaderManager.get("lato.json");
            var textGeometry = new THREE.TextGeometry(nickname, {
                "font": font,
                "size": 50,
                "height": 1,
            });
            textGeometry.center();
            var color = 0xffffff;
            if (this.skin == "red") {
                color = "rgb(255, 15, 15)";
            } else if (this.skin == "blue") {
                color = "rgb(2, 136, 209)";
            }
            var textMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ "color": color }));
            textMesh.position.set(0, 2.5, 0);
            textMesh.scale.set(0.005, 0.005, 0.005);
            for (var x = -2; x <= 2; x += 4) {
                for (var y = -2; y <= 2; y += 4) {
                    var outline = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ "color": 0x000000 }));
                    textMesh.add(outline);
                    outline.position.set(x, y, 0);
                    outline.scale.z = 0.5;
                }
            }
            this.refs.nicknameTextMesh = textMesh;
            group.add(textMesh);

            otherCharacters.push(this);
        }
        scene.add(group);

        var rifle = LoaderManager.get(`rifle_${this.skin}.gltf`).scene.clone();
        rifle.position.set(-1.0, 0.0, 0.0);
        rifle.scale.set(6.0, 6.0, 6.0);
        rifle.rotation.x = -Math.PI / 2;
        rifle.rotation.y = -Math.PI / 2;
        var rightHand = model.children[0].children[1].children[2].children[0].children[0].children[0].children[0].children[0].children[0];
        rightHand.add(rifle);

        this.mixer = new THREE.AnimationMixer(model);
        this.clips = [];
        for (var anim of fbx.animations) {
            this.clips.push(anim.clone());
        }
        var clip = THREE.AnimationClip.findByName(this.clips, "Soldier_final.ms3d.ao|Walk");
        this.walkAction = this.mixer.clipAction(clip);
        this.walkAction.setEffectiveWeight(0.0);
        this.walkAction.play();

        clip = THREE.AnimationClip.findByName(this.clips, "Soldier_final.ms3d.ao|Idle");
        this.idleAction = this.mixer.clipAction(clip);
        this.idleAction.setEffectiveWeight(0.0);
        this.idleAction.play();

        clip = THREE.AnimationClip.findByName(this.clips, "Soldier_final.ms3d.ao|Death");
        this.deathAction = this.mixer.clipAction(clip);
        this.deathAction.setLoop(THREE.LoopOnce);
        this.deathAction.clampWhenFinished = true;

        this.refs.model = model;
        this.refs.group = group;
        this.refs.camera = scene.camera;

        this.isLocalPlayer = isLocalPlayer === true;
        this.nickname = nickname;
        this.refs.networkCharacter = new NetworkCharacter(scene, playerId, this, this.refs.camera);
        this.keybindings = scene.keybindings;
        this.health = 100.0;
    }

    start() {
        this.cameraSensitivity = 0.002;
        this.cameraMaxAngle = Math.PI / 3.0;
        this.euler = new THREE.Euler(0, 0, 0, "YXZ");

        InputManager.on("mousemove", this.onMouseMove.bind(this), false);
        InputManager.onPointerLocked(function() {
            $("#crosshair").show();
        });
        InputManager.onPointerUnlocked(function() {
            $("#crosshair").hide();
        });
        InputManager.enablePointerLock();
        InputManager.requestPointerLock();
    }

    destroy() {
        super.destroy();
        InputManager.off("mousemove", this.onMouseMove.bind(this), false);
        this.scene.remove(this.refs.group);
        this.refs.networkCharacter.destroy();
    }

    update(dt) {
        this.updateAnimations(dt);
        this.mixer.update(dt);

        if (!this.isLocalPlayer) {
            return;
        }

        for (var otherCharacter of otherCharacters) {
            var targetPos = this.position();
            targetPos.y = 2.5;
            otherCharacter.refs.nicknameTextMesh.lookAt(targetPos);

            if (this.team != otherCharacter.team) {
                var d = otherCharacter.refs.group.position.distanceTo(this.refs.group.position);
                otherCharacter.refs.nicknameTextMesh.visible = d < 7;
            }
        }

        if (!InputManager.isPointerLocked()) {
            return;
        }

        this.movement = new THREE.Vector3();
        if (InputManager.getKey(this.keybindings["Move Forward"])) {
            this.movement.z -= 1.0;
        }
        if (InputManager.getKey(this.keybindings["Move Backwards"])) {
            this.movement.z += 1.0;
        }
        if (InputManager.getKey(this.keybindings["Move Left"])) {
            this.movement.x -= 1.0;
        }
        if (InputManager.getKey(this.keybindings["Move Right"])) {
            this.movement.x += 1.0;
        }

        if (this.health > 0.0) {
            this.rotation(this.euler.y);
        }
    }

    updateAnimations(dt) {
        if (this.health > 0.0) {
            if (this.isMoving === true) {
                var weight = this.walkAction.weight;
                if (weight < 1.0) {
                    this.walkAction.setEffectiveWeight(weight + 5 * dt);
                }
                weight = this.idleAction.weight;
                if (weight > 0.0) {
                    this.idleAction.setEffectiveWeight(weight - 5 * dt);
                }
            } else {
                var weight = this.walkAction.weight;
                if (weight > 0.0) {
                    this.walkAction.setEffectiveWeight(weight - 5 * dt);
                }
                weight = this.idleAction.weight;
                if (weight < 1.0) {
                    this.idleAction.setEffectiveWeight(weight + 5 * dt);
                }
            }
        }
    }

    onMouseMove(e) {
        if (!InputManager.isPointerLocked() || !this.isLocalPlayer) {
            return;
        }

        this.euler.setFromQuaternion(this.refs.camera.quaternion);

        this.euler.y -= e.movementX * this.cameraSensitivity;
        this.euler.x -= e.movementY * this.cameraSensitivity;

        this.euler.x = Math.max(-this.cameraMaxAngle, Math.min(this.cameraMaxAngle, this.euler.x));
        this.refs.camera.quaternion.setFromEuler(this.euler);
    }

    position(val) {
        if (val == undefined) {
            var pos = this.refs.group.position;
            return new THREE.Vector3(pos.x, pos.y, pos.z);
        }

        if (Array.isArray(val)) {
            this.refs.group.position.set(val[0], val[1], val[2]);
        } else {
            this.refs.group.position.set(val.x, val.y, val.z);
        }
    }

    rotation(val) {
        if (val == undefined) {
            return this.refs.model.rotation.y;
        }

        this.refs.model.rotation.z = val;
    }
}
