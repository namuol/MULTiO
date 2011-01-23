/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true,  maxerr: 50, indent: 4 */
var MULTIO = {};

(function () {
    "use strict";

    if (typeof Array.isArray !==  'function') {
        Array.isArray = function (value) {
            return Object.prototype.toString.apply(value) === '[object Array]';
        };
    } 

    if (typeof Object.prototype.keys !== 'undefined') {
        Object.prototype.keys = function () {
            var keys = [],
                key;
            for (key in this) {
                if (this.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
    }

    MULTIO.make = (function () {
        return function (socket) {
            var callbacks = {},
                mapCallback,
                extractArgs,
                on,
                exec,
                send,
                fire;

            mapCallback = function (name, callback) {
                callbacks[name] = callback;
            };

            extractArgs = function (args) {
                var callbackArgs = [],
                    i;
                for (i = 1; i < args.length; i += 1) {
                    callbackArgs.push(args[i]); 
                }
                return callbackArgs;
            };

            ////////////////////////////////////////////////////////////////////////
            // PUBLIC FUNCTIONS

            on = function () {
                var callbacksToAdd = {},
                    name;

                switch (typeof arguments[0])
                {
                case 'string':
                    // If our first argument was a string, we take it to
                    //  be the name of an event, and the following argument to
                    //  be the callback to execute when an event with this name has
                    //  been triggered.
                    callbacksToAdd[arguments[0]] = arguments[1];
                    break;

                case 'object':
                    // If the first argument appears to be an object, we assume
                    //  each key represents an event name and the corresponding
                    //  values are individual callbacks
                    callbacksToAdd = arguments[0];
                    break;
                default:
                    throw {}; // TODO
                }

                for (name in callbacksToAdd) {
                    if (callbacksToAdd.hasOwnProperty(name)) {
                        mapCallback(name, callbacksToAdd[name]);
                    }
                }

            };


            exec = function (name) {
                var callbackArgs = extractArgs(arguments);
                callbacks[name].apply(this, callbackArgs);
            };

            send = function (name) {
                var callbackArgs = extractArgs(arguments);
                socket.send({
                    name: name,
                    args: callbackArgs
                });
            };

            fire = function (name) {
                exec.apply(this, arguments);
                send.apply(this, arguments);
            };

            socket.on('message', function (data) {
                exec.apply(this, [data.name, data.args]);
            });

            return {
                callbacks: callbacks,
                on: on,
                exec: exec,
                send: send,
                fire: fire
            };
        };
    }());

}());
