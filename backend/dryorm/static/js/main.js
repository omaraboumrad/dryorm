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
    console.log('starting')
    hljs.highlightAll();
    var csrftoken = getCookie('csrftoken');
    var run = document.getElementById('run');
    var save = document.getElementById('save');
    var job = document.getElementById('job');
    var loader = document.getElementById('loader');
    var output = document.getElementById('output');
    var queries = document.getElementById('queries');
    var name = document.getElementById('name');
    var isPrivate = document.getElementById('isPrivate');
    var templates = document.getElementById('templates');
    var templates = JSON.parse(document.getElementById('templates').textContent);
    var template_select = document.getElementById('template-select');

    // --- Code Area ---
    var models_editor = CodeMirror.fromTextArea(document.getElementById('code_models'), {
        mode: "python",
        lineNumbers: true,
        indentUnit: 4,
        insertSoftTabs: true,
        indentWithTabs: false,
        indentUnit: 4,
        extraKeys: {
            Tab: function(cm) {
                const spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                cm.replaceSelection(spaces);
            }
        }
    });
    models_editor.setSize("100%", "100%");

    // --- Websocket ---
    var socket = null;

    var connect = function(){
        var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        socket = new WebSocket(ws_scheme + '://' + window.location.host + '/ws/');

        socket.onmessage = function(e) {
            var data = JSON.parse(e.data);
            console.log(JSON.stringify(data));

            switch(data.event){
                case 'job-fired':
                    job.textContent = data.key;
                    break;

                case 'job-done':
                    output.textContent = data.result.output === '' ? 'No output' : data.result.output;

                    if(data.result.queries.length === 0){
                        queries.innerHTML = '<span class="p-2 text-lg">No queries</span>';
                    }

                    for(var i=0;i<data.result.queries.length;i++){
                        addQuery(data.result.queries[i].sql);
                    }

                    loader.classList.add('hidden');
                    run.disabled = false;
                    break;
                case 'job-timeout':
                case 'job-oom-killed':
                case 'job-network-disabled':
                case 'job-internal-error':
                case 'job-code-error':
                case 'job-image-not-found-error':
                    output.textContent = data.error;
                    run.disabled = false;
                    loader.classList.add('hidden');
                    break;
                default:
                    console.warn('Unhandled event:', data);
                    break;
            }


            showRightColumn();
        }

        socket.onopen = function(e) {
            job.textContent = 'connected';
            run.disabled = false;
        }

        socket.onclose = function(e) {
            job.textContent = 'connection died';
            run.disabled = true;
            setTimeout(function(){
                job.textContent = 'reconnecting';
                connect();
            }, 2000);
        }
    }

    connect();

    // --- Button Handlers ---
    run.addEventListener('click', function(){
        output.textContent = '';
        queries.innerHTML = '';

        if (models_editor.getValue().trim() === '') {
            alert('Please enter some code to run or select a template');
            return;
        }

        var payload = JSON.stringify({
            code: models_editor.getValue(),
        });

        socket.send(payload);
        loader.classList.remove('hidden');
        run.disabled = true;
    });

    save.addEventListener('click', function(){
        var formData = new FormData();
        formData.append('code', models_editor.getValue());
        formData.append('name', name.value);
        formData.append('private', isPrivate.checked);
        formData.append('csrfmiddlewaretoken', csrftoken);

        fetch('/save', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            job.textContent = 'new snippet saved';
            name.value = '';
            isPrivate.checked = false;
            window.history.pushState('Dry ORM', 'Dry ORM', '/' + data);
        });
    });

    template_select.addEventListener('change', function(event) {
        var template_name = event.target.value;
        console.log(template_name);
        var template_text = templates[template_name] || '';
        models_editor.setValue(template_text);
    });


});

function addQuery(query) {
    const template = document.getElementById('query_template');
    const queries = document.getElementById('queries');

    const clone = template.content.cloneNode(true);
    const codeElement = clone.querySelector('pre code.language-sql');
    codeElement.textContent = query;

    queries.appendChild(clone);
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
