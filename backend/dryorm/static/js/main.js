function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


$(document).ready(function() {
    var csrftoken = getCookie('csrftoken');

    $('#run_button').attr('disabled', 'disabled')

    $('#myModal').modal('show');

    // Setup CodeMirror

    var models_editor = CodeMirror.fromTextArea($('#code_models')[0], {
        mode: "python",
        lineNumbers: true,
    });

    var transactions_editor = CodeMirror.fromTextArea($('#code_transactions')[0], {
        mode: "python",
        lineNumbers: true,
    });

    var queries_editor = CodeMirror.fromTextArea($('#result_queries')[0], {
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
                    $("#job").html(data.key);
                    break;

                case 'job-done':
                    console.log(data.result.output);
                    $('#result_output').text(data.result.output);
                    var queries = [];

                    for(var i=0;i<data.result.queries.length;i++){
                        queries.push(data.result.queries[i].sql)
                    }

                    queries_editor.setValue(queries.join('\n\n'));
                    $('#run_button').removeAttr('disabled')
                    break;

                case 'job-internal-error':
                case 'job-code-error':
                    queries_editor.setValue(data.error);
                    $('#run_button').removeAttr('disabled')
                    break;
                case 'job-image-not-found-error':
                    $('#job').html('image not found!')
                    $('#run_button').removeAttr('disabled')
                    break;
            }
        }

        socket.onopen = function(e) {
            $('#job').html('connected aloha!');
            $('#run_button').removeAttr('disabled')
        }

        socket.onclose = function(e) {
            $('#job').html('connection died');
            setTimeout(function(){
                $('#job').html('reconnecting');
                connect();
            }, 2000);
        }
    }

    connect();

    // Handle button events

    $('#run_button').click(function(){
        $('#result_output').empty()
        queries_editor.setValue('');

        var payload = JSON.stringify({
            models: models_editor.getValue(),
            transactions: transactions_editor.getValue(),
            framework: $('#framework :selected').val()
        });

        socket.send(payload);

        $('#run_button').attr('disabled', 'disabled')
    });

    $('#save_button').click(function(){
        $.post('/save', {
            transactions_code: transactions_editor.getValue(),
            models_code: models_editor.getValue(),
            framework: $('#framework :selected').val(),
            csrfmiddlewaretoken: csrftoken
        }).done(function(data) {
            $("#job").html('new snippet saved');
            window.history.pushState('Dry ORM', 'Dry ORM', '/' + data);
        });
    });

    // Handle Codemirror Keymap

    $('#keymap').change(function(){
        var selected = $('#keymap :selected').val();

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

});
