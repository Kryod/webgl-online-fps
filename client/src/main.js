import WebGLApplication from "./WebGLApplication.js";
import {
    BoxGeometry,
    PlaneGeometry,
    MeshLambertMaterial,
    MeshNormalMaterial,
    Mesh,
    PointLight,
    SpotLight,
    Vector3,
    Math as TMath,
} from "../libs/three.module.js";

var webglElement = document.getElementById("webgl");
const app = new WebGLApplication(webglElement, ({ scene }, dt) => {
    scene.getObjectByName("Cube").rotation.y += 2 * dt;
});
const { scene, camera } = app;

const geometry = new BoxGeometry(3, 3, 3);
const material = new MeshNormalMaterial();
const mesh = new Mesh(geometry, material);
mesh.name = "Cube";
mesh.castShadow = true;
scene.add(mesh);

const geometry2 = new PlaneGeometry(10, 10);
const material2 = new MeshLambertMaterial({
    "color": 0xFFD966
});
const mesh2 = new Mesh(geometry2, material2);
mesh2.position.y = -1.5;
mesh2.rotation.x = -Math.PI / 2;
mesh2.name = "Plane";
mesh2.receiveShadow = true;
scene.add(mesh2);

const light = new PointLight(0xFFFFFF, 2.5);
light.castShadow = true;
light.shadow.mapSize = {
    "x": 2048,
    "y": 2048,
};
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 100;
light.shadow.bias = 0.001;
light.position.x = -6;
light.position.y = 5;
light.position.z = 10;
scene.add(light);

const light2 = new SpotLight(0xFFFFFF);
light2.castShadow = true;
light2.shadow.mapSize = {
    "x": 2048,
    "y": 2048,
};
light2.shadow.camera.near = 0.1;
light2.shadow.camera.far = 100;
light2.shadow.bias = 0.001;
light2.position.x = 10;
light2.position.y = 10;
light2.lookAt(0, 0, 0);
scene.add(light2);

camera.position.z = 15;
camera.position.y = 10;
camera.lookAt(0, 0, 0);

app.start();
