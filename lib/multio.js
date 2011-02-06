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

/*global
    console,
    module */

var MULTIO = {};

if (typeof module !== 'undefined') { 
    module.exports = MULTIO;
}

(function () {
    "use strict";

    var buildEventHandler,
        extractArgs;

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

    extractArgs = function (args, skip) {
        var callbackArgs = [],
            i;
        skip = (typeof skip === 'number' ? skip : 1);
        for (i = skip; i < args.length; i += 1) {
            callbackArgs.push(args[i]); 
        }
        return callbackArgs;
    };

    buildEventHandler = MULTIO.buildEventHandler = function () {
        var mapCallback,
            that = this,
            callbacks = {};

        mapCallback = function (name, callback) {
            callbacks[name] = callback;
        };

        return {
            on: function () {
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
            },

            exec: function (name) {
                var args = extractArgs(arguments);

                if ((name in callbacks) && Array.isArray(args)) {
                    callbacks[name].apply(that, args);
                }
                return that;
            }

        };

    };

    // UTILITY FUNCTIONS
    ////////////////////////////////////////////////////////////////////////////////

    MULTIO.listen = function (socket) {
        var mapCallback,
            that = this,
            clientSend,
            serverBroadcast,
            clientFire,
            handler;
        
        handler = buildEventHandler();


        ////////////////////////////////////////////////////////////////////////////
        // PUBLIC FUNCTIONS

        clientSend = function (name) {
            var args = extractArgs(arguments);
            socket.send({
                name: name,
                args: args
            });
            return that;
        };

        serverBroadcast = function (name, args, except) {
            socket.broadcast({
                name: name,
                args: args
            }, (Array.isArray(except) ? except : [except]));
            return that;
        };

        clientFire = function (name) {
            handler.exec.apply(that, arguments);
            clientSend.apply(that, arguments);
            return that;
        };

        // PUBLIC FUNCTIONS
        ////////////////////////////////////////////////////////////////////////////

        // Determine which type of multio instance we are (client- or server-side)
        //  based on a simple glance at the given socket's members:
        if (typeof socket.host !== 'undefined') {
            // CLIENT:
            socket.on('message', function (data) {
                var args = [data.name];
                args.push.apply(args, data.args);
                handler.exec.apply(handler, args);
            });

            that.on = handler.on;
            that.exec = handler.exec;
            that.send = clientSend;
            that.fire = clientFire;
            return that;

        } else if (typeof socket.server !== 'undefined') {
            // SERVER:
            socket.on('connection', function (client) {
                var $handler,
                    mClient = {};

                $handler = buildEventHandler();

                client.on('message', function (data) {
                    var args = [data.name];
                    args.push.apply(args, data.args);
                    $handler.exec.apply($handler, args);
                });

                client.on('disconnect', function () {
                    $handler.exec.apply($handler, ['$disconnect']);
                });

                mClient.on = $handler.on;

                mClient.send = function (name) {
                    var args = extractArgs(arguments);
                    client.send({
                        name: name,
                        args: args
                    });
                };

                mClient.broadcast = function (name) {
                    var args = extractArgs(arguments);
                    client.broadcast({
                        name: name,
                        args: args
                    });
                };

                mClient.sessionId = client.sessionId;
                handler.exec.apply(handler, ['$connection', mClient]);
            });

            socket.addListener('onClientMessage', function (data, client) {
                // First argument will always be the client that sent the message.
                var args = [data.name, client];
                args.push.apply(args, data.args);
                handler.exec.apply(handler, args);
            }); 

            that.on = handler.on;
            that.exec = handler.exec;
            that.broadcast = serverBroadcast;
            return that; 

        } else {
            return -42;
            /*throw {}; // TODO*/
        }
    };

}());
