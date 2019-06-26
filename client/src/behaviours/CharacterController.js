import Behaviour from "./Behaviour.js";
import Projectile from "./Projectile.js";
import InputManager from "../InputManager.js";
import LoaderManager from "../LoaderManager.js";
import NetworkCharacter from "./NetworkCharacter.js";

var otherCharacters = [];

export default class CharacterController extends Behaviour {
    constructor(scene, nickname, isLocalPlayer = true) {
        super(scene);

        var fbx = LoaderManager.get("soldier_ani.fbx");
        var model = THREE.SkeletonUtils.clone(fbx);
        model.scale.set(0.117, 0.117, 0.117);
        model.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0, "XYZ"));
        model.children.forEach(function(child) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material !== undefined) {
                child.material.normalMap = LoaderManager.get("soldier_NM.jpg");
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
            this.refs.networkCharacter = new NetworkCharacter(scene, this);
        } else {
            var font = LoaderManager.get("lato.json");
            var textGeometry = new THREE.TextGeometry(nickname, {
                "font": font,
                "size": 50,
                "height": 1,
            });
            textGeometry.center();
            var textMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
            textMesh.position.set(0, 2.5, 0);
            textMesh.scale.set(0.005, 0.005, 0.005);
            for (var x = -2; x <= 2; x += 4) {
                for (var y = -2; y <= 2; y += 4) {
                    var outline = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
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

        this.refs.model = model;
        this.refs.group = group;
        this.refs.camera = scene.camera;

        this.isLocalPlayer = isLocalPlayer === true;
        this.keybindings = scene.keybindings;
    }

    start() {
        this.cameraSensitivity = 0.002;
        this.cameraMaxAngle = Math.PI / 3.0;
        this.euler = new THREE.Euler(0, 0, 0, "YXZ");

        InputManager.on("mousemove", this.onMouseMove.bind(this), false);
    }

    destroy() {
        super.destroy();
        InputManager.off("mousemove", this.onMouseMove.bind(this), false);
        this.scene.remove(this.refs.group);
    }

    update(dt) {
        this.updateAnimations(dt);
        this.mixer.update(dt);

        if (!InputManager.isPointerLocked() || !this.isLocalPlayer) {
            return;
        }

        for (var otherCharacter of otherCharacters) {
            var targetPos = this.position();
            targetPos.y = 2.5;
            otherCharacter.refs.nicknameTextMesh.lookAt(targetPos);
        }

        if (InputManager.getButtonDown(InputManager.MOUSE_LEFT_BUTTON)) {
            var pos = new THREE.Vector3();
            var forwardVector = new THREE.Vector3();
            this.refs.camera.getWorldPosition(pos);
            this.refs.camera.getWorldDirection(forwardVector);
            new Projectile(this.scene, pos, forwardVector, 0.1, 20);
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

        this.rotation(this.euler.y);
    }

    updateAnimations(dt) {
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