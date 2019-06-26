(function($) {
    $.snackbar = function(action, msg, type = "default", time = 3000) {
        if (action === "open" || action === "show") {
            var $snack = $(`<div class="snackbar ${type}">${msg}</div>`);
            $snack.appendTo("body");

            var close = function() {
                $snack.addClass("hide");

                $snack.on("animationend webkitAnimationEnd", function() {
                    $snack.remove();
                });
            };

            if (time > 0) {
                setTimeout(close, time);
            }
            $snack.on("click", close);

            return $snack;
        }
    };
}(jQuery));
