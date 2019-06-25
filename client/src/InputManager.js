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

$("#webgl").on("mousemove", function(e) {
    e = e.originalEvent;
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
    mouseMovement.x = e.movementX || e.mozMovementX || e.webkitMovementX || 0.0;
    mouseMovement.y = e.movementY || e.mozMovementY || e.webkitMovementY || 0.0;
});

$("#webgl").on("mousedown", function(e) {
    if (!pointerLocked) {
        return;
    }

    buttonsDown[e.button] = true;
});

$("#webgl").on("mouseup", function(e) {
    if (!pointerLocked) {
        return;
    }

    buttonsDown[e.button] = false;
    return false;
});

$("#webgl").on("contextmenu", function(e) {
    return false;
});

$("#webgl")[0].requestPointerLock = $("#webgl")[0].requestPointerLock ||
                                    $("#webgl")[0].mozRequestPointerLock ||
                                    $("#webgl")[0].webkitRequestPointerLock;
$("#webgl").on("mousedown", function(e) {
    if (pointerLocked || e.button != 0) {
        return;
    }
    $("#webgl")[0].requestPointerLock();
});
$(document).on("pointerlockchange mozpointerlockchange webkitpointerlockchange", function(e) {
    var domElement = $("#webgl")[0];
    pointerLocked = document.pointerLockElement === domElement ||
                    document.mozPointerLockElement === domElement ||
                    document.webkitPointerLockElement === domElement;

    if (!pointerLocked) {
        $("#pause-container").show();
    } else {
        $("#pause-container").hide();
    }
});

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
}
