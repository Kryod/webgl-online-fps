import WebGLApplication from "./WebGLApplication.js";
import SceneManager from "./scenes/SceneManager.js";
import LoadingScreenScene from "./scenes/LoadingScreenScene.js";

var webglElement = $("#webgl")[0];
const app = new WebGLApplication(webglElement);
SceneManager.app = app;

SceneManager.load(LoadingScreenScene);
app.start();
