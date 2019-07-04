import Scene from "./Scene.js";
import LoaderManager from "../LoaderManager.js";
import NetworkManager from "../NetworkManager.js";

// Behaviours
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
    }

    setupScene() {
        this.background = new THREE.Color().setHSL(0.6, 0.0, 1.0);
        this.fog = new THREE.Fog(this.background, 1, 150);
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
        this.characterController = new CharacterController(this, id, this.nickname);
        this.characters[id] = this.characterController;

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
                this.characters[id] = new CharacterController(this, id, player.nickname, false);
            }

            if (!this.characters[id].localPlayer) {
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

        for (var projectile in state.projectiles) {

            var proj = state.projectiles[projectile.id];
            console.log("checking projectiles");
            if (!this.projectiles.hasOwnProperty(id)) {
                // Instantiating new projectiles
                this.projectiles[projectile.id] = new Projectile(this.scene, projectile.pos, forwardVector, 0.1, 20);
            }
            this.projectiles[projectile.id].position(proj.pos);
        }
    }
}
