import Behaviour from "./Behaviour.js";
import InputManager from "../InputManager.js";
import NetworkManager from "../NetworkManager.js";
import LoaderManager from "../LoaderManager.js";

var startTime;

export default class NetworkCharacter extends Behaviour {
    constructor(scene, id, characterController, camera) {
        super(scene);

        this.playerId = id;
        this.refs.characterController = characterController;
        this.refs.camera = camera;
        this.refs.$deathScreen = $("#death-screen");
        this.refs.$healthBar = $("#health");
    }

    start() {
        this.lastMovement = new THREE.Vector3();
        this.lastRotation = 0;

        this.prevTarget = new THREE.Vector3();
        this.nextTarget = new THREE.Vector3();
        var listener = new THREE.AudioListener();
        this.refs.camera.add(listener);

        if (!this.refs.characterController.isLocalPlayer) {
            this.refs.hitSound = new THREE.PositionalAudio(listener);
            this.refs.hitSound.setRefDistance(3);
            this.refs.characterController.refs.model.add(this.refs.hitSound);
        } else {
            this.refs.hitSound = new THREE.Audio(listener);
        }
        this.refs.hitSound.setBuffer(LoaderManager.get("hit.mp3"));
        this.refs.hitSound.setVolume(0.5);

        if (!this.refs.characterController.isLocalPlayer) {
            this.refs.shotSound = new THREE.PositionalAudio(listener);
            this.refs.shotSound.setRefDistance(3);
            this.refs.characterController.refs.model.add(this.refs.shotSound);
        } else {
            this.refs.shotSound = new THREE.Audio(listener);
        }
        this.refs.shotSound.setBuffer(LoaderManager.get("shot.mp3"));
        this.refs.shotSound.setVolume(0.2);

        this.refs.hitMarkerSound = new THREE.Audio(listener);
        this.refs.hitMarkerSound.setBuffer(LoaderManager.get("hitmarker.mp3"));
        this.refs.hitMarkerSound.setVolume(0.5);

        this.lerpProgress = 0.0;

        NetworkManager.on("state", this.onNetworkState.bind(this));
        NetworkManager.on("kill", this.onKill.bind(this));
        NetworkManager.on("respawn", this.onRespawn.bind(this));
        NetworkManager.on("health", this.onHealth.bind(this));
        NetworkManager.on("pong", this.onPong.bind(this));
        NetworkManager.on("shot", this.onShot.bind(this));
        NetworkManager.on("hit", this.onHit.bind(this));
        NetworkManager.on("player-team", this.onPlayerTeam.bind(this));

        this.refs.$healthBar.show();
    }

    update(dt) {
        if (this.refs.characterController.isLocalPlayer) {
            var mov = this.refs.characterController.movement;
            var rot = this.refs.characterController.euler.y;

            var alive = this.refs.characterController.health > 0.0;

            if (alive) {
                if (mov != undefined && rot != undefined && (!this.lastMovement.equals(mov) || this.lastRotation != rot)) {
                    NetworkManager.send("input", {
                        "mov": mov.toArray(),
                        "rot": rot,
                    });
                    this.lastMovement = mov;
                    this.lastRotation = rot;
                }

                if (InputManager.getButtonDown(InputManager.MOUSE_LEFT_BUTTON)) {
                    var forwardVector = new THREE.Vector3();
                    this.refs.camera.getWorldDirection(forwardVector);
                    forwardVector = forwardVector.multiplyScalar(5);
                    NetworkManager.send("fire", {
                        "forwardVector": forwardVector,
                    });
                }

                if (InputManager.getKey(this.refs.characterController.keybindings["Jump"])) {
                    NetworkManager.send("jump", {});
                }
            }
        }

        var pos = new THREE.Vector3();
        if (this.prevTarget != undefined && this.nextTarget != undefined) {
            var dist = this.prevTarget.distanceTo(this.nextTarget);
            if (dist >= 7.0) {
                this.refs.characterController.position(this.nextTarget);
            } else {
                pos.lerpVectors(this.prevTarget, this.nextTarget, this.lerpProgress / 0.025);
                this.lerpProgress += dt;
                this.refs.characterController.position(pos);
            }
        }
    }

    onPong(data) {
        if (this.refs.characterController.isLocalPlayer) {
            $("#stats .latency").text(data);
        }
    }

    onNetworkState(state) {
        if (!this.enabled) {
            return;
        }

        this.prevTarget = this.nextTarget;
        if (state.players[this.playerId] === undefined) {
            return;
        }
        var pos = state.players[this.playerId].pos;
        this.nextTarget = new THREE.Vector3(pos[0], pos[1], pos[2]);
        this.lerpProgress = 0.0;
    }

    onKill(kill) {
        if (kill.killed != this.playerId) {
            return;
        }

        this.refs.characterController.walkAction.stop();
        this.refs.characterController.idleAction.stop();
        this.refs.characterController.deathAction.setEffectiveWeight(1.0);
        this.refs.characterController.deathAction.play();

        if (this.refs.characterController.isLocalPlayer) {
            this.refs.$deathScreen.fadeIn("fast");
        }
    }

    onRespawn(data) {
        if (this.playerId != data.player) {
            return;
        }

        if (this.refs.characterController.isLocalPlayer) {
            this.refs.$deathScreen.find(".respawn-timer").text(data.time);
        }

        if (data.time <= 0) {
            if (this.refs.characterController.isLocalPlayer) {
                this.refs.$deathScreen.fadeOut("fast");
            }
            var _this = this;
            setTimeout(function() {
                _this.refs.characterController.deathAction.stop();
                _this.refs.characterController.walkAction.setEffectiveWeight(0.0);
                _this.refs.characterController.walkAction.play();
                _this.refs.characterController.idleAction.setEffectiveWeight(1.0);
                _this.refs.characterController.idleAction.play();
            }, 30);
        }
    }

    onHealth(data) {
        if (this.playerId == data.player) {
            this.refs.characterController.health = data.value;
            if (this.refs.characterController.isLocalPlayer) {
                this.refs.$healthBar.find(".health-bar").css("width", data.value + "%");
            }

            if (data.value < 100) {
                if (this.refs.hitSound.isPlaying) {
                    this.refs.hitSound.stop();
                }
                this.refs.hitSound.play();

                if (this.refs.characterController.isLocalPlayer) {
                    $("#damagescreen").show();
                    setTimeout(function() {
                        $("#damagescreen").fadeOut("fast");
                    }, 100);
                }
            }
        }
    }

    onShot(data) {
        if (this.playerId == data.player) {
            if (this.refs.shotSound.isPlaying) {
                this.refs.shotSound.stop();
            }
            this.refs.shotSound.play();
        }
    }

    onHit(data) {
        if (this.playerId == data.from) {
            if (this.refs.hitMarkerSound.isPlaying) {
                this.refs.hitMarkerSound.stop();
            }
            this.refs.hitMarkerSound.play();
            $("#hitmarker").show();
            setTimeout(function() {
                $("#hitmarker").fadeOut("fast");
            }, 100);
        }
    }

    onPlayerTeam(data) {
        if (this.playerId == data.player) {
            this.refs.characterController.instantiate(data.team);
        }
    }
}
