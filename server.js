/*jslint 
    white: true, 
    onevar: true, 
    undef: true, 
    newcap: true, 
    nomen: true, 
    regexp: true, 
    plusplus: true, 
    bitwise: true, 
    strict: true, 
    maxerr: 50, 
    indent: 4 */

/*global
    require 
    console 
    setTimeout */

"use strict";

var
http        = require('http'),
connect     = require('connect'),
fs          = require('fs'),
io          = require('socket.io'),
sanitizer   = require('sanitizer'),
config      = {
    port: 12345
};

// Basic server setup: ///////////////////////////////////
fs.readFile('client.html', function (err, fileData) {
    if (err) {
        throw err;
    }

    var baseServer,
        server,
        socket;

    baseServer = http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(fileData);
        res.end();
    });

    server = connect.createServer(
        connect.staticProvider(),
        baseServer
    );

    server.listen(config.port);
    console.log("Listening on port " + config.port);

    // END Basic server setup ////////////////////////////////

    // Socket.IO setup ///////////////////////////////////////
    socket = io.listen(server);

    socket.on('connection', function (client) {
        client.send({
            name: 'hello',
            args: ['this is a test']
        });

        setTimeout(function () {
            client.send({
                name: 'goodbye',
                args: ['http://lmn.us.to/']
            });
        }, 2500);

        client.on('message', function (data) {
            console.log(data);
        });

        client.on('disconnect', function () {
        });
    });
    // END Socket.IO setup ///////////////////////////////////

});
