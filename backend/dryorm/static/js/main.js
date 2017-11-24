/*
 * Default Code
 */

var default_models_code = "from django.db import models\n\n\nclass Driver(models.Model):\n    name = models.CharField(max_length=50)\n\n\nclass Location(models.Model):\n    driver = models.ForeignKey(Driver)\n    latitude = models.IntegerField()\n    longitude = models.IntegerField()\n    some = models.BooleanField(default=True)";

var default_transactions_code = "Driver.objects.bulk_create([\n    Driver(name='john'),\n    Driver(name='doe'),\n    Driver(name='jane'),\n    Driver(name='smith'),\n])\n\nqs = Driver.objects.all()\nnames = list(qs.values_list('name', flat=True))\n\nprint('Available Drivers:', names)\n";

$(document).ready(function() {
    $('#run_button').attr('disabled', 'disabled')

    // Setup CodeMirror

    var models_editor = CodeMirror.fromTextArea($('#code_models')[0], {
        mode: "python",
        lineNumbers: true,
    });

    models_editor.setValue(default_models_code);

    var transactions_editor = CodeMirror.fromTextArea($('#code_transactions')[0], {
        mode: "python",
        lineNumbers: true,
    });

    transactions_editor.setValue(default_transactions_code);

    var queries_editor = CodeMirror.fromTextArea($('#result_queries')[0], {
        mode: "text/x-sql",
        lineWrapping: true,
        readOnly: true
    });

    // Setup Websocket

    var socket = null;

    var connect = function(){
        socket= new WebSocket("ws://" + window.location.host + "/ws/");

        socket.onmessage = function(e) {
            var data = JSON.parse(e.data);

            switch(data.event){
                case 'job-fired':
                    $("#job").html(data.key);
                    break;

                case 'job-done':
                    $('#result_output').html(data.result.output);
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
            transactions: transactions_editor.getValue()
        });

        socket.send(payload);

        $('#run_button').attr('disabled', 'disabled')
    });
});
