/*jslint
    white: true,
    onevar: true,
    undef: true,
    newcap: true,
    nomen: true,
    regexp: true,
    plusplus: true,
    bitwise: true,
    maxerr: 50,
    indent: 4 */

var MULTIO = {};

(function () {
    "use strict";

    ////////////////////////////////////////////////////////////////////////////////
    // UTILITY FUNCTIONS

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

    // UTILITY FUNCTIONS
    ////////////////////////////////////////////////////////////////////////////////

    MULTIO.listen = function (socket) {
        var callbacks = {},
            mapCallback,
            extractArgs,
            that = this;
            

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

        ////////////////////////////////////////////////////////////////////////////
        // PUBLIC FUNCTIONS

        that.on = function () {
            var callbacksToAdd = {},
                name;

            switch (typeof arguments[0])
            {
            case 'string':
                // If our first argument was a string, we take it to be the name of an event, and 
                //  the following argument to be the callback to execute when an event with this 
                //  name has been triggered.
                callbacksToAdd[arguments[0]] = arguments[1];
                break;

            case 'object':
                // If the first argument appears to be an object, we assume each key represents an
                //  event name and the corresponding values are individual callbacks
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
            return that;
        };


        that.exec = function (name) {
            var callbackArgs = extractArgs(arguments);
            callbacks[name].apply(that, callbackArgs);
            return that;
        };

        that.send = function (name) {
            var callbackArgs = extractArgs(arguments);
            socket.send({
                name: name,
                args: callbackArgs
            });
            return that;
        };

        that.fire = function (name) {
            that.exec.apply(that, arguments);
            that.send.apply(that, arguments);
            return that;
        };

        // PUBLIC FUNCTIONS
        ////////////////////////////////////////////////////////////////////////////

        socket.on('message', function (data) {
            that.exec.apply(that, [data.name, data.args]);
        });

        return that;
    };

}());
