var socket = null;

export default {
    connect(onConnected, onError, data = {}) {
        data = $.param(data);

        socket = io("localhost:28333", {
            "reconnection": false,
            "timeout": 5000,
            "query": data,
        });

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
