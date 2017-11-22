$(document).ready(function() {
    var default_models_code = "from django.db import models\n\n\nclass Driver(models.Model):\n    name = models.CharField(max_length=50)\n\n\nclass Location(models.Model):\n    driver = models.ForeignKey(Driver)\n    latitude = models.IntegerField()\n    longitude = models.IntegerField()\n    some = models.BooleanField(default=True)\n";

    var default_transactions_code = "Driver.objects.bulk_create([\n    Driver(name='john'),\n    Driver(name='doe'),\n    Driver(name='jane'),\n    Driver(name='smith'),\n])\n\nqs = Driver.objects.all()\nnames = list(qs.values_list('name', flat=True))\n\nprint('Available Drivers:', names)\n";

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


    $('#run_button').click(function(){
        $.post({
            url: "/invoke/",
            data: {
                models: models_editor.getValue(),
                transactions: transactions_editor.getValue()
            }
        }).done(function(data) {
            $("#job").html(data.key);
            $('#result_output').empty()
            $('#result_queries').empty()

            var handle;

            var poll = function(){
                $.post({
                    url: "/check/",
                    data: { job: data.key }
                }).done(function(result){
                    if (result.success) {
                        clearInterval(handle);
                        $('#result_output').html(result.result.output);
                        for(var i=0;i<result.result.queries.length;i++){
                            var sql = result.result.queries[i].sql;
                            $('#result_queries').append('<li class="list-group-item">' + sql + '</li>');
                        }
                    }
                });
            }

            handle = setInterval(poll, 1000);
        });
    });            
});
