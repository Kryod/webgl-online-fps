var keysDown = {};
var lastFrameKeys = {};
var mousePosition = { "x": 0.0, "y": 0.0 };
var mouseMovement = { "x": 0.0, "y": 0.0 };
var buttonsDown = {};
var lastFrameButtons = {};
var pointerLocked = false;

$(document).on("keydown", function(e) {
    keysDown[e.key] = true;
});

$(document).on("keyup", function(e) {
    keysDown[e.key] = false;
});

document.addEventListener("mousemove", function(e) {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
    mouseMovement.x = e.movementX;
    mouseMovement.y = e.movementY;
}, false);

$(document).on("mousedown", function(e) {
    if (!pointerLocked) {
        return;
    }

    buttonsDown[e.button] = true;
});

$(document).on("mouseup", function(e) {
    if (!pointerLocked) {
        return;
    }

    buttonsDown[e.button] = false;
    return false;
});

$(document).on("contextmenu", function(e) {
    return false;
});


function onMouseDown(e) {
    if (pointerLocked || e.button != 0) {
        return;
    }
    lockPointer();
}

function lockPointer() {
    $("body")[0].requestPointerLock();
}

document.addEventListener("pointerlockchange", function(e) {
    var domElement = $("body")[0];
    pointerLocked = document.pointerLockElement === domElement;

    if (!pointerLocked) {
        $("#pause-container").show();
    } else {
        $("#pause-container").hide();
    }
}, false);

document.addEventListener("pointerlockerror", function() {
    console.error("Could not lock pointer");
}, false);


export default {
    "MOUSE_LEFT_BUTTON": 0,
    "MOUSE_WHEEL_BUTTON": 1,
    "MOUSE_RIGHT_BUTTON": 2,

    mousePosition() {
        return mousePosition;
    },

    mouseMovement() {
        return mouseMovement;
    },

    getKey(key) {
        return keysDown[key] === true;
    },

    getKeyUp(key) {
        return keysDown[key] !== true && lastFrameKeys[key] === true;
    },

    getKeyDown(key) {
        return keysDown[key] === true && lastFrameKeys[key] !== true;
    },

    getButton(button) {
        return buttonsDown[button] === true;
    },

    getButtonUp(button) {
        return buttonsDown[button] !== true && lastFrameButtons[button] === true;
    },

    getButtonDown(button) {
        return buttonsDown[button] === true && lastFrameButtons[button] !== true;
    },

    ctrl() {
        return false;
    },

    shift() {
        return false;
    },

    alt() {
        return false;
    },

    isPointerLocked() {
        return pointerLocked === true;
    },

    enablePointerLock() {
        document.addEventListener("mousedown", onMouseDown, false);
    },

    disablePointerLock() {
        document.removeEventListener("mousedown", onMouseDown, false);
    },

    requestPointerLock() {
        lockPointer();
    },

    showPauseOverlay() {
        $("#pause-container").show();
    },

    update() {
        lastFrameKeys = {};
        for (var attr in keysDown) {
            if (keysDown.hasOwnProperty(attr) && keysDown[attr] === true) {
                lastFrameKeys[attr] = true;
            }
        }

        lastFrameButtons = {};
        for (var attr in buttonsDown) {
            if (buttonsDown.hasOwnProperty(attr) && buttonsDown[attr] === true) {
                lastFrameButtons[attr] = true;
            }
        }

        mouseMovement.x = 0.0;
        mouseMovement.y = 0.0;
    },

    on(event, fn) {
        document.addEventListener(event, fn, false);
    },

    off(event, fn) {
        document.removeEventListener(event, fn, false);
    },
}
