import WebGLApplication from "./WebGLApplication.js";
import SceneManager from "./scenes/SceneManager.js";

var webglElement = $("#webgl")[0];
const app = new WebGLApplication(webglElement);
SceneManager.app = app;

import LoadingScreenScene from "./scenes/LoadingScreenScene.js";
SceneManager.load(LoadingScreenScene);
app.start();

/*const { scene, camera } = app;

/*const glTFLoader = new THREE.GLTFLoader();
const fbxLoader = new THREE.FBXLoader();
const textureLoader = new THREE.TextureLoader();
var mixers = [];

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

var actions = [];
var blend = false;
var blendVal = 0.0;
fbxLoader.load("./assets/models/soldier/soldier_ani.fbx", function(fbx) {
    console.log(fbx);
    fbx.position.set(-5, -33, 0);
    fbx.rotation.z = THREE.Math.degToRad(-40);
    fbx.scale.set(0.25, 0.25, 0.25);
    fbx.children.forEach(child => {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material !== undefined) {
            child.material.normalMap = textureLoader.load("./assets/models/soldier/soldier_NM.jpg");
            child.material.roughnessMap = textureLoader.load("./assets/models/soldier/soldier_rough.jpg");
            child.material.metalnessMap = textureLoader.load("./assets/models/soldier/soldier_metalness.jpg");
            child.material.needsUpdate = true;
        }
    });
    scene.add(fbx);

    var mixer = new THREE.AnimationMixer(fbx);
    var idleAction = mixer.clipAction(fbx.animations[5]);
    var walkAction = mixer.clipAction(fbx.animations[4]);
    var shootAction = mixer.clipAction(fbx.animations[0]);
    var dieAction = mixer.clipAction(fbx.animations[1]);
    actions = [ idleAction, walkAction, shootAction, dieAction ];
    actions.forEach(action => {
        action.setEffectiveWeight(0.0);
        action.play();
    });
    idleAction.setEffectiveWeight(1.0);

    mixers.push(mixer);
}, function(xhr) {
    console.log((xhr.loaded / xhr.total * 100) + "%");
}, function(err) {
    console.error(err)
});

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

{
    var d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
}

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
camera.position.set(0, -28, 20);
camera.lookAt(cube.position);

app.start();

function update({ scene }, dt) {
    cube.rotation.y += 2 * dt;

    if (blend) {
        actions[0].setEffectiveWeight(1.0 - blendVal);
        actions[1].setEffectiveWeight(blendVal);
        blendVal += 1.0 * dt;
    }

    mixers.forEach((mixer) => {
        mixer.update(dt);
    });
}

document.addEventListener("keydown", function(event) {
    if (event.code == "Space") {
        blend = true;
        blendVal = 0.0;
    }
});*/
