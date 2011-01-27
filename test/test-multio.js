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
    var smocket = multio.buildEventHandler();
    if (type === 'clientSide') {
        smocket.host = {};
    } else if (type === 'serverSide') {
        smocket.server = {};
    }
    smocket.sentData = [];
    smocket.send = function (data) {
        smocket.sentData.push(data);
    };
    return smocket;
};

exports['Client-Side Socket Event Received (listener.on) (mocked)'] = function (test) {
    // Use the buildEventHandler function to create a socket mock (smocket):
    var smocket = buildSmocket('clientSide'),
        listener,
        result;

    listener = multio.listen(smocket);
    
    listener.on('testMe', function (a, b, c) {
        result = a + (b / c);
    });

    // Simulate a message being received:
    smocket.exec('message', {
        name: 'testMe',
        args: [1, 16, 4]
    });

    setTimeout(function () {
        test.equal(result, 1 + (16 / 4));
        test.done();
    }, 50);

};

exports['Client-Side Socket Event Sent (listener.send) (mocked)'] = function (test) {
    // Use the buildEventHandler function to create a socket mock (smocket):
    var smocket = buildSmocket('clientSide'),
        listener;

    listener = multio.listen(smocket);
    
    listener.on('testMe', function () {});
    
    listener.send('testMe', 42);

    setTimeout(function () {
        test.equal(smocket.sentData[0].name, 'testMe');
        test.equal(smocket.sentData[0].args.length, 1);
        test.equal(smocket.sentData[0].args[0], 42);
        test.done();
    }, 50);

};
