import WebGLApplication from "./WebGLApplication.js";
import SceneManager from "./scenes/SceneManager.js";

var webglElement = $("#webgl")[0];
const app = new WebGLApplication(webglElement);
SceneManager.app = app;

import LoadingScreenScene from "./scenes/LoadingScreenScene.js";
SceneManager.load(LoadingScreenScene);
app.start();
