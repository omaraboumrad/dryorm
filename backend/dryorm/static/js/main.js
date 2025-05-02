function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', function() {
    hljs.highlightAll();
    var csrftoken = getCookie('csrftoken');
    var runButton = document.getElementById('run_button');
    var saveButton = document.getElementById('save_button');
    var jobElement = document.getElementById('job');
    var resultOutput = document.getElementById('result_output');
    var frameworkSelect = document.getElementById('framework');
    var keymapSelect = document.getElementById('keymap');
    var queriesContainer = document.getElementById('queries');
    runButton.disabled = true;

    // --- Code Area ---
    var models_editor = CodeMirror.fromTextArea(document.getElementById('code_models'), {
        mode: "python",
        lineNumbers: true,
        indentUnit: 4,
    });
    models_editor.setSize("100%", "100%");

    // --- Websocket ---
    var socket = null;

    var connect = function(){
        var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        socket = new WebSocket(ws_scheme + '://' + window.location.host + '/ws/');

        socket.onmessage = function(e) {
            var data = JSON.parse(e.data);

            switch(data.event){
                case 'job-fired':
                    jobElement.textContent = data.key;

                    break;

                case 'job-done':
                    resultOutput.textContent = data.result.output;

                    for(var i=0;i<data.result.queries.length;i++){
                        addQuery(data.result.queries[i].sql);
                    }

                    runButton.disabled = false;
                    break;

                case 'job-internal-error':
                case 'job-code-error':
                    resultOutput.textContent = data.error;
                    runButton.disabled = false;
                    break;
                case 'job-image-not-found-error':
                    jobElement.textContent = 'image not found!'
                    runButton.disabled = false;
                    break;
            }


            showRightColumn();
        }

        socket.onopen = function(e) {
            jobElement.textContent = 'connected aloha!';
            runButton.disabled = false;
        }

        socket.onclose = function(e) {
            jobElement.textContent = 'connection died';
            setTimeout(function(){
                jobElement.textContent = 'reconnecting';
                connect();
            }, 2000);
        }
    }

    connect();

    // --- Button Handlers ---
    runButton.addEventListener('click', function(){
        resultOutput.textContent = '';
        queriesContainer.innerHTML = '';

        var payload = JSON.stringify({
            code: models_editor.getValue(),
            framework: frameworkSelect.value
        });

        socket.send(payload);
        runButton.disabled = true;
    });

    saveButton.addEventListener('click', function(){
        var formData = new FormData();
        formData.append('code', models_editor.getValue());
        formData.append('framework', frameworkSelect.value);
        formData.append('csrfmiddlewaretoken', csrftoken);

        fetch('/save', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            jobElement.textContent = 'new snippet saved';
            window.history.pushState('Dry ORM', 'Dry ORM', '/' + data);
        });
    });

});

function addQuery(query) {
    const template = document.getElementById('query_template');
    const queriesContainer = document.getElementById('queries');

    const clone = template.content.cloneNode(true);
    const codeElement = clone.querySelector('pre code.language-sql');
    codeElement.textContent = query;

    queriesContainer.appendChild(clone);
    hljs.highlightAll();
}

function showRightColumn() {
    const rightColumn = document.getElementById('right_column');
    const grid = document.getElementById('main_grid');

    if (rightColumn.classList.contains('hidden')) {
        rightColumn.classList.remove('hidden');
        grid.classList.remove('grid-cols-1');
        grid.classList.add('grid-cols-2');
    }
}
