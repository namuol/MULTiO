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
    require
    exports
    setTimeout
    */

var multio = require('../lib/multio'),
    buildSmocket;

exports['Basic Handler Tests (on & exec)'] = function (test) {
    var num = 0,
        handler = multio.buildEventHandler();

    handler.on('testMe', function () {
        num = 42;
    });
    handler.exec('testMe');

    setTimeout(function () {
        test.equal(num, 42);
        test.done();
    }, 50);
};

buildSmocket = function (type) {
    // Use the buildEventHandler function to create a socket mock (smocket):
    var smocket = multio.buildEventHandler();
    if (type === 'clientSide') {
        smocket.sentData = [];
        smocket.host = {};
        smocket.send = function (data) {
            smocket.sentData.push(data);
        };
    } else if (type === 'serverSide') {
        smocket.server = {};
        smocket.broadcastData = [];
        smocket.sentData = [];
        smocket.addListener = smocket.on;
        smocket.send = function (data) {
            smocket.sentData.push(data);
        };
        smocket.broadcast = function (data, except) {
            smocket.broadcastData.push({data: data, except: except});
        };
    } else if (type === 'serverSideClient') {
        smocket.broadcastData = [];
        smocket.sentData = [];
        smocket.send = function (data) {
            smocket.sentData.push(data);
        };
        smocket.broadcast = function (data) {
            smocket.broadcastData.push(data);
        };
    }
    return smocket;
};

exports['Client-Side Socket Event Received (listener.on)'] = function (test) {
    var smocket = buildSmocket('clientSide'),
        listener,
        result,
        testFunc = function (a, b, c) {
            return a + (b / c);
        };

    listener = multio.listen(smocket);
    
    listener.on('testMe', function (a, b, c) {
        result = testFunc(a, b, c);
    });

    // Simulate a message being received:
    smocket.exec('message', {
        name: 'testMe',
        args: [1, 16, 4]
    });

    setTimeout(function () {
        test.equal(result, testFunc(1, 16, 4));
        test.done();
    }, 50);

};

exports['Client-Side Socket Event Sent (listener.send)'] = function (test) {
    var smocket = buildSmocket('clientSide'),
        listener;

    listener = multio.listen(smocket);
    
    listener.on('testMe', function () {});
    
    listener.send('testMe', 42);

    setTimeout(function () {
        test.equal(smocket.sentData.length, 1);
        test.equal(smocket.sentData[0].name, 'testMe');
        test.equal(smocket.sentData[0].args.length, 1);
        test.equal(smocket.sentData[0].args[0], 42);
        test.done();
    }, 50);

};

exports['Client-Side Socket Event Fired (listener.fire)'] = function (test) {
    var smocket = buildSmocket('clientSide'),
        result,
        listener;

    listener = multio.listen(smocket);
    
    listener.on('testMe', function (value) {
        result = value;
    });
    
    listener.fire('testMe', 42);

    setTimeout(function () {
        test.equal(smocket.sentData.length, 1);
        test.equal(smocket.sentData[0].name, 'testMe');
        test.equal(smocket.sentData[0].args.length, 1);
        test.equal(smocket.sentData[0].args[0], 42);
        test.equal(result, 42);
        test.done();
    }, 50);

};

exports['Server-Side Socket Event Received (listener.on)'] = function (test) {
    var smocket = buildSmocket('serverSide'),
        listener,
        expectedClient = {},
        resultClient,
        result,
        testFunc = function (a, b, c) {
            return a + (b / c);
        };

    listener = multio.listen(smocket);
    
    listener.on('testMe', function (client, a, b, c) {
        resultClient = client;
        result = testFunc(a, b, c);
    });

    // Simulate a message being received:
    smocket.exec('onClientMessage', {
        name: 'testMe',
        args: [1, 16, 4]
    }, expectedClient);

    setTimeout(function () {
        test.equal(result, testFunc(1, 16, 4));
        test.done();
    }, 50);

};

exports['Server-Side Client Connected (server.on(\'$connection\', ...)'] = function (test) {
    var smocket = buildSmocket('serverSide'),
        clientSmocket = buildSmocket('serverSideClient'),
        expectedSessionId = 42,
        listener,
        resultClient;
    
    clientSmocket.sessionId = expectedSessionId;

    listener = multio.listen(smocket);
    
    listener.on('$connection', function (client) {
        resultClient = client; 
    });

    // Simulate a new connection:
    smocket.exec('connection', clientSmocket);

    setTimeout(function () {
        test.equal(resultClient.sessionId, 42);
        test.done();
    }, 50);
};

exports['Server-Side Client Event Received (client.on)'] = function (test) {
    var smocket = buildSmocket('serverSide'),
        clientSmocket = buildSmocket('serverSideClient'),
        expectedSessionId = 42,
        listener,
        resultClient,
        result,
        testFunc = function (a, b, c) {
            return a + (b / c);
        };
     
    clientSmocket.sessionId = expectedSessionId;

    listener = multio.listen(smocket);
    
    listener.on('$connection', function (client) {
        resultClient = client;
        client.on('testMe', function (a, b, c) {
            result = testFunc(a, b, c);
        });
    });

    // Simulate a new connection:
    smocket.exec('connection', clientSmocket);
    clientSmocket.exec('message', {
        name: 'testMe',
        args: [1, 16, 4]
    });

    setTimeout(function () {
        test.equal(result, testFunc(1, 16, 4));
        test.done();
    }, 50);
};

exports['Server-Side Client Event Sent (client.send)'] = function (test) {
    var smocket = buildSmocket('serverSide'),
        clientSmocket = buildSmocket('serverSideClient'),
        resultClient,
        listener;

    listener = multio.listen(smocket);

    listener.on('$connection', function (client) {
        resultClient = client;
        client.send('testMe', 42);
    });

    smocket.exec('connection', clientSmocket);

    setTimeout(function () {
        test.equal(clientSmocket.sentData.length, 1);
        test.equal(clientSmocket.sentData[0].name, 'testMe');
        test.equal(clientSmocket.sentData[0].args.length, 1);
        test.equal(clientSmocket.sentData[0].args[0], 42);
        test.done();
    }, 50);
};

exports['Server-Side Client Event Broadcast (client.broadcast)'] = function (test) {
    var smocket = buildSmocket('serverSide'),
        clientSmocket = buildSmocket('serverSideClient'),
        resultClient,
        listener;

    listener = multio.listen(smocket);

    listener.on('$connection', function (client) {
        resultClient = client;
        client.broadcast('testMe', 42);
    });

    smocket.exec('connection', clientSmocket);

    setTimeout(function () {
        test.equal(clientSmocket.broadcastData.length, 1);
        test.equal(clientSmocket.broadcastData[0].name, 'testMe');
        test.equal(clientSmocket.broadcastData[0].args.length, 1);
        test.equal(clientSmocket.broadcastData[0].args[0], 42);
        test.done();
    }, 50);
};

exports['Server-Side Event Broadcast (listener.broadcast)'] = function (test) {
    var smocket = buildSmocket('serverSide'),
        listener;

    listener = multio.listen(smocket);
    listener.broadcast('testMe', [42]);
    listener.broadcast('testMe2', [43, 4]);
    setTimeout(function () {
        test.equal(smocket.broadcastData.length, 2);
        test.equal(smocket.broadcastData[0].data.name, 'testMe');
        test.equal(smocket.broadcastData[0].data.args.length, 1);
        test.equal(smocket.broadcastData[0].data.args[0], 42);
        test.equal(smocket.broadcastData[1].data.name, 'testMe2');
        test.equal(smocket.broadcastData[1].data.args.length, 2);
        test.equal(smocket.broadcastData[1].data.args[0], 43);
        test.equal(smocket.broadcastData[1].data.args[1], 4);
        test.done();
    }, 50);
};

exports['Server-Side Event Broadcast (Except certain Clients) (client.broadcast)'] = function (test) {
    var smocket = buildSmocket('serverSide'),
        exceptClient = {},
        exceptClient2 = {},
        listener;

    listener = multio.listen(smocket);
    listener.broadcast('testMe', [42], exceptClient);
    listener.broadcast('testMe2', [43, 4], [exceptClient, exceptClient2]);
    setTimeout(function () {
        test.equal(smocket.broadcastData.length, 2);
        test.equal(smocket.broadcastData[0].except.length, 1);
        test.equal(smocket.broadcastData[0].except[0], exceptClient);
        test.equal(smocket.broadcastData[1].except.length, 2);
        test.equal(smocket.broadcastData[1].except[0], exceptClient);
        test.equal(smocket.broadcastData[1].except[1], exceptClient2);
        test.equal(smocket.broadcastData[0].data.name, 'testMe');
        test.equal(smocket.broadcastData[0].data.args.length, 1);
        test.equal(smocket.broadcastData[0].data.args[0], 42);
        test.equal(smocket.broadcastData[1].data.name, 'testMe2');
        test.equal(smocket.broadcastData[1].data.args.length, 2);
        test.equal(smocket.broadcastData[1].data.args[0], 43);
        test.equal(smocket.broadcastData[1].data.args[1], 4);

        test.done();
    }, 50);
};

exports['Server-Side Client Disconnect (client.on(\'$disconnect\', ...))'] = function (test) {
    var smocket = buildSmocket('serverSide'),
        clientSmocket = buildSmocket('serverSideClient'),
        result,
        expectedResult = 42,
        listener;

    listener = multio.listen(smocket);
    
    listener.on('$connection', function (client) {
        client.on('$disconnect', function () {
            result = expectedResult;
        });
    });

    // Simulate a new connection:
    smocket.exec('connection', clientSmocket);
    clientSmocket.exec('disconnect');

    setTimeout(function () {
        test.equal(result, expectedResult);
        test.done();
    }, 50);
};

