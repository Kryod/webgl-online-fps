import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    PCFSoftShadowMap,
    Clock,
} from "../libs/three.module.js";

class WebGLApplication {
    constructor(containerElement, update) {
        const { clientWidth, clientHeight } = containerElement;
        this._scene = new Scene();
        this._camera = new PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000);
        this._renderer = new WebGLRenderer({
            "antialias": true,
        });
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = PCFSoftShadowMap;
        this._renderer.setSize(clientWidth, clientHeight);
        containerElement.appendChild(this._renderer.domElement);
        this._update = update;
        this._clock = new Clock();
    }

    get scene() {
        return this._scene;
    }

    get camera() {
        return this._camera;
    }

    start() {
        if (this._rafId !== undefined) {
            return;
        }

        this.animate();
    }

    stop() {
        if (this._rafId === undefined) {
            return;
        }

        cancelAnimationFrame(this._rafId);
        this._rafId = undefined;
    }

    animate() {
        const dt = this._clock.getDelta();

        this._checkDimensions();

        if (this._update !== undefined) {
            this._update(this, dt);
        }

        this._renderer.render(this.scene, this._camera);
        this._rafId = requestAnimationFrame(() => {
            this.animate();
        });
    }

    _checkDimensions() {
        const { clientWidth, clientHeight } = this._renderer.domElement.parentNode;

        if (this._storedWidth !== clientWidth || this._storedHeight !== clientHeight) {
            this._storedWidth = clientWidth;
            this._storedHeight = clientHeight;
            this._renderer.setSize(clientWidth, clientHeight);
            this._camera.aspect = clientWidth / clientHeight;
            this._camera.updateProjectionMatrix();
        }
    }
}

export default WebGLApplication;
