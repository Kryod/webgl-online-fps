import WebGLApplication from "./WebGLApplication.js";

var webglElement = document.getElementById("webgl");
const app = new WebGLApplication(webglElement, ({ scene }, dt) => {
    scene.getObjectByName("Cube").rotation.y += 2 * dt; // TODO: find something more optimized than "getObjectByName" on each update?
});
const { scene, camera } = app;

// Scene setup
scene.background = new THREE.Color().setHSL(0.6, 0.0, 1.0);
scene.fog = new THREE.Fog(scene.background, 1, 5000);

// Models
const cubeGeo = new THREE.BoxGeometry(3, 3, 3);
const cubeMat = new THREE.MeshLambertMaterial();
cubeMat.color.setRGB(0.886, 0.07, 0.0);
const cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.position.y = -33 + 1.5;
cube.name = "Cube";
cube.castShadow = true;
scene.add(cube);

const groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
const groundMat = new THREE.MeshLambertMaterial();
groundMat.color.setHSL(0.095, 1, 0.75);
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -33;
ground.rotation.x = -Math.PI / 2;
ground.name = "Ground";
ground.receiveShadow = true;
scene.add(ground);

// Lights
var hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.6);
hemiLight.color.setHSL(0.6, 1, 0.6);
hemiLight.groundColor.setHSL(0.095, 1, 0.75);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

var dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
dirLight.color.setHSL(0.1, 1, 0.95);
dirLight.position.set(-1, 1.75, 1);
dirLight.position.multiplyScalar(30);
scene.add(dirLight);

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

var d = 50;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

// Sky
var vertexShader = document.getElementById("vertexShader").textContent;
var fragmentShader = document.getElementById("fragmentShader").textContent;
var uniforms = {
    "topColor": {
        "value": new THREE.Color(0x0077FF)
    },
    "bottomColor": {
        "value": new THREE.Color(0xFFFFFF)
    },
    "offset": {
        "value": 33
    },
    "exponent": {
        "value": 0.6
    }
};
uniforms["topColor"].value.copy(hemiLight.color);
scene.fog.color.copy(uniforms["bottomColor"].value);
var skyGeo = new THREE.SphereBufferGeometry(4000, 32, 15);
var skyMat = new THREE.ShaderMaterial({
    "uniforms": uniforms,
    "vertexShader": vertexShader,
    "fragmentShader": fragmentShader,
    "side": THREE.BackSide
});
var sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Camera
camera.position.set(0, -28, 25);
camera.lookAt(cube.position);

app.start();
