/*
 * Default Code
 */

var default_models_code = "from django.db import models\n\n\nclass Driver(models.Model):\n    name = models.CharField(max_length=50)\n\n\nclass Location(models.Model):\n    driver = models.ForeignKey(Driver)\n    latitude = models.IntegerField()\n    longitude = models.IntegerField()\n    some = models.BooleanField(default=True)\n";

var default_transactions_code = "Driver.objects.bulk_create([\n    Driver(name='john'),\n    Driver(name='doe'),\n    Driver(name='jane'),\n    Driver(name='smith'),\n])\n\nqs = Driver.objects.all()\nnames = list(qs.values_list('name', flat=True))\n\nprint('Available Drivers:', names)\n";

$(document).ready(function() {

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

    // Setup Websocket

    var socket = new WebSocket("ws://" + window.location.host + "/ws/");

    socket.onmessage = function(e) {
        var data = JSON.parse(e.data);

        switch(data.event){
            case 'job-fired':
                $("#job").html(data.key);
                break;

            case 'job-done':
                $('#result_output').html(data.result.output);

                for(var i=0;i<data.result.queries.length;i++){
                    var sql = data.result.queries[i].sql;
                    $('#result_queries').append('<li class="list-group-item">' + sql + '</li>');
                }
                break;
        }

    }

    // Handle button events

    $('#run_button').click(function(){
        $('#result_output').empty()
        $('#result_queries').empty()

        var payload = JSON.stringify({
            models: models_editor.getValue(),
            transactions: transactions_editor.getValue()
        });

        socket.send(payload);
    });
});
