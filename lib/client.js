if(!this.MULTIO)
{
    this.MULTIO = {};
}

(function () {
    "use strict";

    MULTIO.create = (function () {
        return function(socket) {
            var on = function () {
            };
            return {
                on: on,
                fire: fire,
                send: send,
                emit: emit
            };
        };
    }());

}());
