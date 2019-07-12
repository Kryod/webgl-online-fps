import Scene from "./Scene.js";
import LoaderManager from "../LoaderManager.js";
import NetworkManager from "../NetworkManager.js";

// Behaviours
import Log from "../behaviours/Log.js";
import KillFeed from "../behaviours/KillFeed.js";
import SceneDebug from "../behaviours/SceneDebug.js";
import Scoreboard from "../behaviours/Scoreboard.js";
import Projectile from "../behaviours/Projectile.js";
import LevelLoader from "../behaviours/LevelLoader.js";
import CharacterController from "../behaviours/CharacterController.js";

export default class MainScene extends Scene {
    constructor(app, data) {
        super(app);

        this.keybindings = data.keybindings;
        this.nickname = data.nickname;
        this.levelLoader = new LevelLoader(this);

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
        this.debug = new SceneDebug(this);
        NetworkManager.on("end", this.onGameEnd.bind(this));
        NetworkManager.on("level", this.onLevelReceived.bind(this));
        NetworkManager.send("request-level", {});
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

        this.stateIdx = 0;
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
                if (id != NetworkManager.id()) {
                    this.characters[id] = new CharacterController(this, id, player.nickname, player.team, false);
                    if (this.stateIdx > 0) {
                        this.log.writeLine(`<span class="${this.characters[id].skin}">${this.characters[id].nickname}</span> joined the game.`);
                    }
                } else {
                    this.characterController = new CharacterController(this, id, this.nickname, player.team);
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
                this.log.writeLine(`<span class="${this.characters[id].skin}">${this.characters[id].nickname}</span> left the game.`);
                this.characters[id].destroy();
                delete this.characters[id];
            }
        }

        this.ball.position.set(state.ball[0], state.ball[1], state.ball[2]);

        for (var id in state.projectiles) {
            var proj = state.projectiles[id];
            if (!this.projectiles.hasOwnProperty(id)) {
                // checking in existing projectiles if current one is already spawned
                this.projectiles[proj.id] = new Projectile(this, proj.id, proj.pos, proj.team, 0.1);
            }

            for (var id2 in this.projectiles){
                if (this.projectiles[id2].id == proj.id){
                    // if projectile exists, update position
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

        this.stateIdx++;
    }

    onLevelReceived(level) {
        this.levelLoader.loadFromObject(level);

        if (!this.scoreboard.enabled) {
            this.scoreboard.enabled = true;
            if (this.scoreboard.shown) {
                this.scoreboard.hide();
            }
        }
        $("#game-end").fadeOut("fast");
    }

    setupUi() {
        this.log = new Log(this);
        this.killFeed = new KillFeed(this);
        this.scoreboard = new Scoreboard(this);
    }

    onGameEnd(data) {
        this.scoreboard.show();
        this.scoreboard.enabled = false;

        if (data.team != -1) {
            var teams = ["blue", "red"];
            var team = teams[data.team];
            $("#game-end .win .team").text(team.toUpperCase()).addClass(team);
            $("#game-end .draw").hide();
            $("#game-end .win").show();
        } else {
            $("#game-end .win").hide();
            $("#game-end .draw").show();
        }
        $("#game-end").fadeIn("fast");
    }
}
