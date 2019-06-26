var socket = null;

export default {
    connect(onConnected) {
        socket = io("http://localhost:28333");

        var _this = this;
        socket.on("connect", function() {
            if (typeof onConnected == "function") {
                onConnected(_this);
            }
        });

        socket.on("disconnect", function() {
            socket = null;
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
