import Scene from "./Scene.js";
import LoaderManager from "../LoaderManager.js";

// Behaviours
import Cube from "../behaviours/Cube.js";
import Projectile from "../behaviours/Projectile.js";
import NetworkCharacter from "../behaviours/NetworkCharacter.js";
import CharacterController from "../behaviours/CharacterController.js";

export default class MainScene extends Scene {
    constructor(app) {
        super(app);

        this.setupScene();
        this.setupLighting();
        this.setupSky();
        this.test();
        this.setupCamera();
        this.spawnGround();
        this.spawnPlayer(app._renderer.domElement);
        this.setupNetwork();
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

    setupCamera() {
        this.camera.position.set(0, 1.75, 25);
        this.camera.lookAt(this.cube.mesh.position);
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
        this.cube = new Cube(this, 3.0);
    }

    spawnPlayer(domElement) {
        this.characterController = new CharacterController(this, domElement, this.camera);
    }

    setupNetwork() {
        this.networkCharacter = new NetworkCharacter(this);
    }
}
