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

        this.refs.sound = new THREE.PositionalAudio(listener);
        this.refs.sound.setVolume(this.refs.characterController.isLocalPlayer ? 0.5 : 0.3);

        this.lerpProgress = 0.0;

        this.refs.characterController.refs.group.add(this.refs.sound);

        NetworkManager.on("state", this.onNetworkState.bind(this));
        NetworkManager.on("kill", this.onKill.bind(this));
        NetworkManager.on("respawn", this.onRespawn.bind(this));
        NetworkManager.on("health", this.onHealth.bind(this));
        NetworkManager.on("pong", this.onPong.bind(this));


        setInterval(function() {
            startTime = Date.now();
            NetworkManager.send("ping", {});
        }, 1000);

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

                if (InputManager.getKeyDown(' ')) {
                    NetworkManager.send("jump", {});
                }
            }
        }

        var pos = new THREE.Vector3();
        if (this.prevTarget != undefined && this.nextTarget != undefined) {
            pos.lerpVectors(this.prevTarget, this.nextTarget, this.lerpProgress / 0.025);
            this.lerpProgress += dt;
            this.refs.characterController.position(pos);
        }
    }

    onPong(data) {
        if (this.refs.characterController.isLocalPlayer) {
            console.log("latency: " + data);
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
            this.refs.characterController.deathAction.stop();
            this.refs.characterController.walkAction.setEffectiveWeight(0.0);
            this.refs.characterController.walkAction.play();
            this.refs.characterController.idleAction.setEffectiveWeight(1.0);
            this.refs.characterController.idleAction.play();
        }
    }

    onHealth(data) {
        if (this.playerId == data.player) {
            this.refs.characterController.health = data.value;
            if (this.refs.characterController.isLocalPlayer) {
                this.refs.$healthBar.find(".health-bar").css("width", data.value + "%");
            }

            if (data.value < 100) {
                var buffer = LoaderManager.get("hit.mp3");
                if (this.refs.sound.isPlaying) {
                    this.refs.sound.stop();
                }
                this.refs.sound.setBuffer(buffer);
                this.refs.sound.setRefDistance(20);
                this.refs.sound.play();
            }
        }
    }
}
