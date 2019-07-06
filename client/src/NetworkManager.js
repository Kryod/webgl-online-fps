var socket = null;

export default {
<<<<<<< HEAD
    connect(onConnected, onError, data = {}) {
        data = $.param(data);

        socket = io(`${CONFIG.server.host}:${CONFIG.server.port}`, {
            "reconnection": false,
            "timeout": 5000,
            "query": data,
        });
=======
    connect(onConnected) {
        socket = io("localhost:28333");
>>>>>>> dee51e0a283b281f41c95945872914210d1f8bcb

        var _this = this;
        socket.on("connect", function() {
            if (typeof onConnected == "function") {
                onConnected(_this);
            }
        });

        socket.on("disconnect", function() {
            socket = null;
        });

        socket.on("connect_error", function() {
            if (typeof onError == "function") {
                onError(_this);
            }
        });
    },

    on(event, fn) {
        if (socket == null) {
            return;
        }

        socket.on(event, fn);
    },

    id() {
        if (socket == null) {
            return null;
        }

        return socket.id;
    },

    send(event, data) {
        if (socket != null) {
            socket.emit(event, data);
        }
    },
}
