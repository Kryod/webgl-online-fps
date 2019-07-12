import Scene from "./Scene.js";
import MainScene from "./MainScene.js";
import SceneManager from "./SceneManager.js";
import InputManager from "../InputManager.js";
import NetworkManager from "../NetworkManager.js";

export default class StartMenuScene extends Scene {
    constructor(app, data) {
        super(app);

        this.background = new THREE.Color(0x212121);
        this.binds = {};
    }

    start() {
        super.start();

        $("#btn-play, #btn-controls").width(150);
        $("#btn-play").on("click", this.connectToServer.bind(this));
        $("#btn-controls").on("click", this.openControlsMenu.bind(this));
        $("#btn-controls-back").on("click", this.closeControlsMenu.bind(this));
        $("#startmenu-container .login-form input[name='nickname']").on("keyup", function(e) {
            if (e.keyCode == 13) {
                $("#btn-play").trigger("click");
            }
        });

        this.modal = $("#modal-keybind").remodal({
            "hashTracking": false,
        });

        var _this = this;
        $("#startmenu-container .controls .keybind").each(function(idx, keybind) {
            var $bind = $(keybind);
            var name = $bind.data("bind-name");
            var value = $bind.data("value");
            _this.binds[name] = value;
            var $span = $(`<span>${value}</span>`);
            $bind.data("$span", $span);
            $bind.after($span);
            $bind.on("click", function() {
                _this.$currentBind = $bind;
                _this.modal.open();
                _this.modal.$modal.find(".bind-name").text(name);
            });
        });

        InputManager.on("keydown", this.onKeybind.bind(this));

        this.showOverlay();
    }

    stop() {
        InputManager.off("keydown", this.onKeybind.bind(this));
    }

    onKeybind(e) {
        if (this.modal.state == "opened" || this.modal.state == "opening") {
            this.binds[this.$currentBind.data("bind-name")] = e.key;
            if (e.key == ' ') {
                this.$currentBind.data("$span").text("");
                this.$currentBind[0].src = "img/key-space.png";
            } else if (e.key == "Enter") {
                this.$currentBind.data("$span").text("");
                this.$currentBind[0].src = e.location == 0 ? "img/key-enter.png" : "img/key-enter-keypad.png";
            } else if (e.key == "Backspace") {
                this.$currentBind.data("$span").text("");
                this.$currentBind[0].src = "img/key-backspace.png";
            } else {
                this.$currentBind.data("$span").text(e.key);
                this.$currentBind[0].src = "img/key-blank.png";
            }

            if (this.modal.state == "opening") {
                var _this = this;
                this.modal.$modal.one("opened", function() {
                    _this.modal.close();
                });
            } else {
                this.modal.close();
            }
        }
    }

    showOverlay() {
        $("#startmenu-container").show();
    }

    hideOverlay(f) {
        $("#startmenu-container").fadeOut("fast", f);
    }

    connectToServer() {
        if (this.connecting === true) {
            return;
        }
        this.connecting = true;
        $("#btn-play").prop("disabled", true);

        var _this = this;
        NetworkManager.connect(function(mngr) {
            mngr.on("nickname", function(nickname) {
                _this.nickname(nickname);
                _this.loadMainScene();
            });
        }, function(mngr) {
            _this.connecting = false;
            $("#btn-play").prop("disabled", false);
            $.snackbar("open", "Could not connect to server", "danger", 2000);
        }, {
            "nickname": _this.nickname(),
        });
    }

    loadMainScene() {
        var _this = this;
        this.hideOverlay(function() {
            SceneManager.load(MainScene, {
                "nickname": _this.nickname(),
                "keybindings": _this.binds,
            });
        });
    }

    nickname(val) {
        var $el = $("#startmenu-container .login-form input[name='nickname']");
        if (val !== undefined) {
            $el.val(val);
            return;
        }
        return $el.val();
    }

    openControlsMenu() {
        $("#startmenu-container .login-form").fadeOut("fast", function() {
            $("#startmenu-container .controls").fadeIn("fast");
        });
    }

    closeControlsMenu() {
        $("#startmenu-container .controls").fadeOut("fast", function() {
            $("#startmenu-container .login-form").fadeIn("fast");
        });
    }
}
