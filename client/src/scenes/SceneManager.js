var app = null;
var currentScene = null;

export default {
    set app(newApp) {
        app = newApp;
    },

    get app() {
        return app;
    },

    load(sceneClass, data = {}) {
        var scene = new sceneClass(app, data);
        if (app != null) {
            app.activeScene = scene;
        }
        if (currentScene != null) {
            currentScene.stop();
        }
        currentScene = scene;
        scene.start();
    },
}
