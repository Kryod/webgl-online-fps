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

        LoaderManager.queueTexture("./assets/models/soldier/soldier_NM.jpg");
        LoaderManager.queueTexture("./assets/models/soldier/soldier_rough.jpg");
        LoaderManager.queueTexture("./assets/models/soldier/soldier_metalness.jpg");
        LoaderManager.queueFile("./assets/shaders/sky/fragment.glsl");
        LoaderManager.queueFile("./assets/shaders/sky/vertex.glsl");
        LoaderManager.queueFont("./assets/fonts/lato.json");
        LoaderManager.queueFbx("./assets/models/soldier/soldier_ani.fbx");

        LoaderManager.startLoading();
    }

    setOverlayProgress(progress, currentIndex, totalFiles) {
        this.$progressBar.css("width", progress * 100 + "%");
        this.$progressPercentage.text(Math.round(progress * 100) + "%");
        this.$progressCount.text(`${currentIndex + 1} / ${totalFiles}`);
    }
}