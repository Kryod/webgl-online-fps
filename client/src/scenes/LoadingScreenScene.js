import Scene from "./Scene.js";
import SceneManager from "./SceneManager.js";
import LoaderManager from "../LoaderManager.js";
import StartMenuScene from "./StartMenuScene.js";

export default class LoadingScreenScene extends Scene {
    constructor(app) {
        super(app);

        this.background = new THREE.Color(0x212121);

        this.$progressBar = $("#progress-bar");
        this.$progressPercentage = $("#progress-container .percentage");
        this.$progressCount = $("#progress-container .count");
    }

    start() {
        super.start();
        this.showOverlay();
        this.load();
    }

    stop() {
        this.hideOverlay();
    }

    showOverlay() {
        $("#progress-container").show();
    }

    hideOverlay() {
        $("#progress-container").fadeOut();
    }

    load() {
        LoaderManager.onTotalProgressCallback = this.setOverlayProgress.bind(this);
        LoaderManager.onAllLoadedCallback = function() {
            SceneManager.load(StartMenuScene);
        };

        LoaderManager.queueTexture("./assets/models/soldier/soldier_normal.jpg");
        LoaderManager.queueTexture("./assets/models/soldier/soldier_rough.jpg");
        LoaderManager.queueTexture("./assets/models/soldier/soldier_metalness.jpg");
        LoaderManager.queueFbx("./assets/models/soldier/red/soldier_red.fbx");
        LoaderManager.queueFbx("./assets/models/soldier/blue/soldier_blue.fbx");
        LoaderManager.queueFile("./assets/shaders/sky/fragment.glsl");
        LoaderManager.queueFile("./assets/shaders/sky/vertex.glsl");
        LoaderManager.queueFont("./assets/fonts/lato.json");
        LoaderManager.queueGltf("./assets/models/rifle/rifle_red.gltf");
        LoaderManager.queueGltf("./assets/models/rifle/rifle_blue.gltf");
        LoaderManager.queueTexture("./assets/models/box/box_albedotransparency.png");
        LoaderManager.queueTexture("./assets/models/box/box_ao.png");
        LoaderManager.queueTexture("./assets/models/box/box_metallicsmoothness.png");
        LoaderManager.queueTexture("./assets/models/box/box_normal.png");
        LoaderManager.queueFbx("./assets/models/box/box.fbx");
        LoaderManager.queueFbx("./assets/models/crate/crate.fbx");
        LoaderManager.queueAudio("./assets/sounds/hit.mp3");

        LoaderManager.startLoading();
    }

    setOverlayProgress(progress, currentIndex, totalFiles) {
        this.$progressBar.css("width", progress * 100 + "%");
        this.$progressPercentage.text(Math.round(progress * 100) + "%");
        this.$progressCount.text(`${currentIndex + 1} / ${totalFiles}`);
    }
}
