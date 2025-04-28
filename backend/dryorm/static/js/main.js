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
    var csrftoken = getCookie('csrftoken');
    var runButton = document.getElementById('run_button');
    var saveButton = document.getElementById('save_button');
    var jobElement = document.getElementById('job');
    var resultOutput = document.getElementById('result_output');
    var frameworkSelect = document.getElementById('framework');
    var keymapSelect = document.getElementById('keymap');
    var modal = document.getElementById('myModal');
    var closeModalBtn = document.getElementById('closeModalBtn');
    var closeModalX = document.getElementById('closeModal');

    runButton.disabled = true;

    // Show modal
    modal.classList.remove('hidden');

    // Setup CodeMirror
    var models_editor = CodeMirror.fromTextArea(document.getElementById('code_models'), {
        mode: "python",
        lineNumbers: true,
    });

    var transactions_editor = CodeMirror.fromTextArea(document.getElementById('code_transactions'), {
        mode: "python",
        lineNumbers: true,
    });

    var queries_editor = CodeMirror.fromTextArea(document.getElementById('result_queries'), {
        mode: "text/x-sql",
        lineWrapping: true,
        readOnly: true
    });

    // Setup Websocket
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
                    console.log(data.result.output);
                    resultOutput.textContent = data.result.output;
                    var queries = [];

                    for(var i=0;i<data.result.queries.length;i++){
                        queries.push(data.result.queries[i].sql)
                    }

                    queries_editor.setValue(queries.join('\n\n'));
                    runButton.disabled = false;
                    break;

                case 'job-internal-error':
                case 'job-code-error':
                    queries_editor.setValue(data.error);
                    runButton.disabled = false;
                    break;
                case 'job-image-not-found-error':
                    jobElement.textContent = 'image not found!'
                    runButton.disabled = false;
                    break;
            }
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

    // Handle button events
    runButton.addEventListener('click', function(){
        resultOutput.textContent = '';
        queries_editor.setValue('');

        var payload = JSON.stringify({
            models: models_editor.getValue(),
            transactions: transactions_editor.getValue(),
            framework: frameworkSelect.value
        });

        socket.send(payload);
        runButton.disabled = true;
    });

    saveButton.addEventListener('click', function(){
        var formData = new FormData();
        formData.append('transactions_code', transactions_editor.getValue());
        formData.append('models_code', models_editor.getValue());
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

    // Handle Codemirror Keymap
    keymapSelect.addEventListener('change', function(){
        var selected = this.value;

        switch(selected){
            case 'vim':
                models_editor.setOption("emacsMode", false);
                transactions_editor.setOption("emacsMode", false);
                models_editor.setOption("vimMode", true);
                transactions_editor.setOption("vimMode", true);
                break;
            case 'emacs':
                models_editor.setOption("vimMode", false);
                transactions_editor.setOption("vimMode", false);
                models_editor.setOption("emacsMode", true);
                transactions_editor.setOption("emacsMode", true);
                break;
            default:
                models_editor.setOption("vimMode", false);
                transactions_editor.setOption("vimMode", false);
                models_editor.setOption("emacsMode", false);
                transactions_editor.setOption("emacsMode", false);
                break;
        }
    });

    // Modal close handlers
    function closeModal() {
        modal.classList.add('hidden');
    }

    closeModalBtn.addEventListener('click', closeModal);
    closeModalX.addEventListener('click', closeModal);
});
