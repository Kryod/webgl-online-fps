import InputManager from "./InputManager.js";

const times = [];
var framerate;

class WebGLApplication {
    constructor(containerElement) {
        this._storedWidth = containerElement.clientWidth;
        this._storedHeight = containerElement.clientHeight;

        this._renderer = new THREE.WebGLRenderer();
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(this._storedWidth, this._storedHeight);
        this._renderer.gammaInput = true;
        this._renderer.gammaOutput = true;
        this._renderer.shadowMap.enabled = true;
        containerElement.appendChild(this._renderer.domElement);

        this._clock = new THREE.Clock();
    }

    get clientWidth() {
        return this._storedWidth;
    }

    get clientHeight() {
        return this._storedHeight;
    }

    get framerate() {
        return framerate;
    }

    set activeScene(scene) {
        this._activeScene = scene;
    }

    set update(f) {
        this._update = f;
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
        const now = performance.now();
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift();
        }
        times.push(now);
        framerate = times.length;

        const dt = this._clock.getDelta();

        this._checkDimensions();

        if (this._update !== undefined) {
            this._update(dt);
        }
        InputManager.update();

        if (this._activeScene !== undefined && this._activeScene.camera !== undefined) {
            this._renderer.render(this._activeScene, this._activeScene.camera);
        }
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
            if (this._activeScene !== undefined) {
                this._activeScene.onClientResized(clientWidth, clientHeight);
            }
        }
    }
}

export default WebGLApplication;
