// Basic outline of server-side API:
var io  = require('socket.io'),
    mio = require('multio');

var mocket = mio.listen(io.listen(server));

var passwords = {
    'louman': 'stupidPassword'
};

var validClients = [];

mocket.on('$connection', function (client) {
    for (var i = 0; i < log.length; ++i) {
    }

    client.on('login', function (name, password) {
        if (!(name in passwords) || passwords[name] !== password) {
            client.send('authenticationFailed');
            return;
        }

        client.send('authenticationSucceeded');
        client.broadcast('joined', name);
        validClients.push(client);

        client.on('chatMsg', function (msg) {
            client.broadcast('chatMsg', msg);
        });
    });    
});


