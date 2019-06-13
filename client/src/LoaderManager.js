import * as FBXLoader from "../libs/loaders/FBXLoader.js";
import * as GLTFLoader from "../libs/loaders/GLTFLoader.js";

const gltfLoader = new THREE.GLTFLoader();
const fbxLoader = new THREE.FBXLoader();
const textureLoader = new THREE.TextureLoader();

var queue = [];
var loaded = {};
var currentFileIndex;
var onTotalProgress = function() { };
var onAllLoaded = function() { };

function fileProgress(percentage) {
    var files = queue.length;
    var globalProgress = currentFileIndex / files;
    globalProgress += percentage / files;
    onTotalProgress(globalProgress, currentFileIndex, files);
}

export default {
    get(name) {
        return loaded[name];
    },

    set onTotalProgressCallback(callback) {
        onTotalProgress = callback;
    },

    set onAllLoadedCallback(callback) {
        onAllLoaded = callback;
    },

    queueGltf(path) {
        queue.push({
            "path": path,
            "loader": gltfLoader,
        });
    },

    queueFbx(path) {
        queue.push({
            "path": path,
            "loader": fbxLoader,
        });
    },

    queueTexture(path) {
        queue.push({
            "path": path,
            "loader": textureLoader,
        });
    },

    startLoading() {
        currentFileIndex = 0;
        this.load();
    },

    load() {
        if (currentFileIndex === undefined || currentFileIndex >= queue.length) {
            if (queue.length > 0) {
                onAllLoaded();
            }
            return;
        }

        var _this = this;
        var { path, loader } = queue[currentFileIndex];

        loader.load(path, function(result) {
            var fileName = path.replace(/^.*[\\\/]/, "");
            loaded[fileName] = result;
            currentFileIndex++;
            _this.load();
        }, function(xhr) {
            fileProgress(xhr.loaded / xhr.total);
        }, function(err) {
            console.error(err);
        });
    },
}
