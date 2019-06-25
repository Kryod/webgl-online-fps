var app = null;
var currentScene = null;

export default {
    set app(newApp) {
        app = newApp;
    },

    load(sceneClass) {
        var scene = new sceneClass(app);
        if (app != null) {
            app.activeScene = scene;
        }
        currentScene = scene;
        scene.start();
    },
}
