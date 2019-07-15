import Behaviour from "./Behaviour.js";

export default class Log extends Behaviour {
    start() {
        this.$log = $("#log");
        this.closeCallback = null;
    }

    writeLine(line) {
        var $el = $("#log");
        $el.append(line + "<br>");
        $el[0].scrollTop = $el[0].clientHeight;
        this.$log.show();

        if (this.closeCallback != null) {
            clearTimeout(this.closeCallback);
        }
        this.closeCallback = setTimeout(this.close.bind(this), 2500);
    }

    close() {
        this.$log.fadeOut("fast");
    }
}
