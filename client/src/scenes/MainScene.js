import Scene from "./Scene.js";
import LoaderManager from "../LoaderManager.js";
import NetworkManager from "../NetworkManager.js";

// Behaviours
import KillFeed from "../behaviours/KillFeed.js";
import Scoreboard from "../behaviours/Scoreboard.js";
import Projectile from "../behaviours/Projectile.js";
import CharacterController from "../behaviours/CharacterController.js";

export default class MainScene extends Scene {
    constructor(app, data) {
        super(app);

        this.keybindings = data.keybindings;
        this.nickname = data.nickname;

        this.setupScene();
        this.setupLighting();
        this.setupSky();
        this.spawnGround();
        this.test();
        this.setupPlayer();
        this.setupUi();
    }

    setupScene() {
        this.background = new THREE.Color().setHSL(0.6, 0.0, 1.0);
        this.fog = new THREE.Fog(this.background, 1, 150);

        //this.generateRandomLevel();
        this.loadLevel();
    }

    clearLevel() {
        if (this.boxes != undefined) {
            for (var box of this.boxes) {
                this.remove(box);
            }
        }
        this.boxes = [];
    }

    generateRandomLevel() {
        this.clearLevel();

        function randInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function randFloat(min, max, decimals = 2) {
            var rand = Math.random() * (max - min) + min;
            var power = Math.pow(10, decimals);
            return Math.floor(rand * power) / power;
        }

        var positionsDist = 20;
        var level = {
            "boxes": [],
            "crates": [],
        };
        var n = randInt(4, 10);
        for (var i = 0; i < n; ++i) {
            var box = LoaderManager.get("box.fbx").clone();
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

            var x = randFloat(-positionsDist, positionsDist);
            var z = randFloat(-positionsDist, positionsDist);
            box.position.set(x, 0.0, z);

            var rot = randFloat(0, 360);
            box.rotation.y = rot * Math.PI / 180.0;

            var scale = randFloat(0.008, 0.02, 4);
            box.scale.set(scale, scale, scale);

            this.add(box);
            level.boxes.push({
                "x": x,
                "z": z,
                "rotation": rot,
                "scale": scale,
            });
            this.boxes.push(box);
        }

        n = randInt(4, 10);
        for (var i = 0; i < n; ++i) {
            var crate = LoaderManager.get("crate.fbx").clone();
            crate.children.forEach(function(child) {
                child.castShadow = true;
                child.receiveShadow = true;
            });

            var x = randFloat(-positionsDist, positionsDist);
            var z = randFloat(-positionsDist, positionsDist);
            crate.position.set(x, 0.0, z);

            var rot = randFloat(0, 360);
            crate.rotation.y = rot * Math.PI / 180.0;

            var scale = randFloat(0.004, 0.008, 4);
            crate.scale.set(scale, scale, scale);

            this.add(crate);
            level.crates.push({
                "x": x,
                "z": z,
                "rotation": rot,
                "scale": scale,
            });
            this.boxes.push(crate);
        }

        console.log(JSON.stringify(level));
    }

    loadLevel() {
        this.clearLevel();

        var level = LoaderManager.get("level.json");
        level = JSON.parse(level);

        for (var boxData of level.boxes) {
            var box = LoaderManager.get("box.fbx").clone();
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

            box.position.set(boxData.x, 0.0, boxData.z);
            box.rotation.y = boxData.rotation * Math.PI / 180.0;
            box.scale.set(boxData.scale, boxData.scale, boxData.scale);

            this.add(box);
            this.boxes.push(box);
        }

        for (var boxData of level.crates) {
            var crate = LoaderManager.get("crate.fbx").clone();
            crate.children.forEach(function(child) {
                child.castShadow = true;
                child.receiveShadow = true;
            });

            crate.position.set(boxData.x, 0.0, boxData.z);
            crate.rotation.y = boxData.rotation * Math.PI / 180.0;
            crate.scale.set(boxData.scale, boxData.scale, boxData.scale);

            this.add(crate);
            this.boxes.push(crate);
        }
    }

    setupLighting() {
        this.hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.6);
        this.hemiLight.color.setHSL(0.6, 1, 0.6);
        this.hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        this.hemiLight.position.set(0, 83, 0);
        this.add(this.hemiLight);

        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.position.set(-1, 1.75, 1);
        dirLight.position.multiplyScalar(30);
        this.add(dirLight);

        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;

        var d = 50;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;
    }

    setupSky() {
        var uniforms = {
            "topColor": {
                "value": new THREE.Color(0x0077FF)
            },
            "bottomColor": {
                "value": new THREE.Color(0xFFFFFF)
            },
            "offset": {
                "value": 0
            },
            "exponent": {
                "value": 0.6
            }
        };
        uniforms["topColor"].value.copy(this.hemiLight.color);
        this.fog.color.copy(uniforms["bottomColor"].value);
        var skyGeo = new THREE.SphereBufferGeometry(200, 32, 15);
        var skyMat = new THREE.ShaderMaterial({
            "uniforms": uniforms,
            "vertexShader": LoaderManager.get("sky/vertex.glsl"),
            "fragmentShader": LoaderManager.get("sky/fragment.glsl"),
            "side": THREE.BackSide
        });
        var sky = new THREE.Mesh(skyGeo, skyMat);
        this.add(sky);
    }

    spawnGround() {
        const groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
        const groundMat = new THREE.MeshLambertMaterial();
        groundMat.color.setHSL(0.095, 1, 0.75);
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.name = "Ground";
        ground.receiveShadow = true;
        this.add(ground);
    }

    test() {
        this.ball = new THREE.Mesh(new THREE.SphereBufferGeometry(0.5), new THREE.MeshPhongMaterial({ "color": 0xff0505 }));
        this.ball.castShadow = true;
        this.ball.receiveShadow = true;
        this.add(this.ball);
    }

    setupPlayer() {
        var id = NetworkManager.id();

        this.characters = {};
        this.projectiles = {};

        NetworkManager.on("state", this.onNetworkState.bind(this));
    }

    onNetworkState(state) {
        for (var id in state.players) {
            if (!state.players.hasOwnProperty(id)) {
                continue;
            }

            var player = state.players[id];
            if (!this.characters.hasOwnProperty(id)) {
                // A new player joined, add their character to the scene
                var teams = ["blue", "red"];
                var team = teams[player.team];
                if (id != NetworkManager.id()) {
                    this.characters[id] = new CharacterController(this, id, player.nickname, team, false);
                } else {
                    this.characterController = new CharacterController(this, id, this.nickname, team);
                    this.characters[id] = this.characterController;
                }
            }

            if (!this.characters[id].isLocalPlayer) {
                this.characters[id].rotation(player.rot);
            }
            this.characters[id].isMoving = player.moving;
        }

        for (var id in this.characters) {
            if (!this.characters.hasOwnProperty(id)) {
                continue;
            }

            if (!state.players.hasOwnProperty(id)) {
                // A player disconnected, remove their character from the scene
                this.characters[id].destroy();
                delete this.characters[id];
            }
        }

        this.ball.position.set(state.ball[0], state.ball[1], state.ball[2]);

        for (var id in state.projectiles) {
            var proj = state.projectiles[id];
            if (!this.projectiles.hasOwnProperty(id)) {
                //checking in existing projectiles if current one is already spawned
                this.projectiles[proj.id] = new Projectile(this, proj.pos, new THREE.Vector3(), 0.1, 10, proj.id);
            }

            for (var id2 in this.projectiles){
                if (this.projectiles[id2].id == proj.id){
                    // if prjectile exist, update position
                    this.projectiles[id2].position(proj.pos);
                }
            }
        }

        for (var id in this.projectiles) {
            if (!this.projectiles.hasOwnProperty(id)) {
                continue;
            }

            if (!state.projectiles.hasOwnProperty(id)) {
                // A player disconnected, remove their character from the scene
                this.projectiles[id].destroy();
                delete this.projectiles[id];
            }
        }
    }

    setupUi() {
        this.killFeed = new KillFeed(this);
        this.scoreboard = new Scoreboard(this);
    }
}
