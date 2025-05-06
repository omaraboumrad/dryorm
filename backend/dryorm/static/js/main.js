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
    var run = document.getElementById('run');
    var save = document.getElementById('save');
    var job = document.getElementById('job');
    var loader = document.getElementById('loader');
    var output = document.getElementById('output');
    var queries = document.getElementById('queries');
    var name = document.getElementById('name');
    var isPrivate = document.getElementById('isPrivate');
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

                    handleReturnedData(data.result.returned);
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
        document.getElementById('returned-data').innerHTML = '';

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
        var template_text = templates[template_name] || '';
        models_editor.setValue(template_text);
    });

    document.querySelectorAll('[data-section]').forEach(header => {
        header.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            const indicator = this.querySelector('.collapse-indicator');

            if (section.style.display === 'none') {
                section.style.display = 'flex';
                indicator.textContent = '▼';
            } else {
                section.style.display = 'none';
                indicator.textContent = '▶';
            }
        });
    });

});

function addQuery(query) {
    const template = document.getElementById('query_template');
    const queries = document.getElementById('queries');

    const clone = template.content.cloneNode(true);
    const codeElement = clone.querySelector('div');
    codeElement.textContent = query;

    queries.appendChild(clone);
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

// --- AI Generated Code ---
//
//       ... works ...
//        ¯\_(ツ)_/¯
//            o
//           /\

function formatReturnedData(returned) {
    if (Array.isArray(returned) && returned.length > 0 && typeof returned[0] === 'object') {

        // Get all unique keys from all dictionaries
        const headers = new Set()
        returned.forEach(item => {
            Object.keys(item).forEach(key => headers.add(key));
        });

        // Get the template
        const template = document.getElementById('returned_data_template');
        const table = template.content.cloneNode(true);
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        const header = table.querySelector('[data-section]');
        const section = table.querySelector('.returned-data-section');

        // Generate a unique ID for this section
        const sectionId = `returned-data-${Math.random().toString(36).substr(2, 9)}`;
        header.setAttribute('data-section', sectionId);
        section.id = sectionId;

        // Add headers
        const headerRow = document.createElement('tr');
        headerRow.className = '';
        headers.forEach(header => {
            const th = document.createElement('th');
            th.className = 'p-2 text-left';
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Add rows
        returned.forEach(item => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.className = 'p-2';
                td.textContent = item[header] !== undefined ? item[header] : '';
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        return table;
    }
    return null;
}

function handleReturnedData(returned) {
    const returnedContainer = document.getElementById('returned-data');
    returnedContainer.innerHTML = '';
    
    if (!returned) return;
    
    if (Array.isArray(returned)) {
        // Case 1: List of dictionaries
        const table = formatReturnedData(returned);
        if (table) {
            const h3 = table.querySelector('h3');
            h3.textContent = 'Data';
            returnedContainer.appendChild(table);
        }
    } else if (typeof returned === 'object') {
        // Case 2: Dictionary with keys
        Object.entries(returned).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                const table = formatReturnedData(value);
                if (table) {
                    const h3 = table.querySelector('h3');
                    h3.textContent = key;
                    returnedContainer.appendChild(table);
                }
            }
        });
    }

    // Attach click handlers to the newly created sections
    returnedContainer.querySelectorAll('[data-section]').forEach(header => {
        header.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            const indicator = this.querySelector('.collapse-indicator');

            if (section.style.display === 'none') {
                section.style.display = 'flex';
                indicator.textContent = '▼';
            } else {
                section.style.display = 'none';
                indicator.textContent = '▶';
            }
        });
    });
}
