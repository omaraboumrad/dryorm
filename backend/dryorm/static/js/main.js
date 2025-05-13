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
    var database_select = document.getElementById('database-select');
    var ignore_cache = document.getElementById('ignore_cache');
    var erd_link = document.getElementById('erd');
    var query_filters = document.getElementById('query-filters');
    var query_count = document.getElementById('query-count');

    // Store raw data
    let rawOutput = '';
    let rawQueries = [];

    // Setup copy buttons for static sections
    setupCopyButton(document.querySelector('[data-section="output-section"] .copy-indicator'), () => rawOutput);
    setupCopyButton(document.querySelector('[data-section="queries-section"] .copy-indicator'), () => {
        return rawQueries.map(q => `${q.sql}`).join('\n\n');
    });

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
            },
            'Ctrl-Enter': (cm) => execute(),
            'Cmd-Enter': (cm) => execute(),
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
                    // job.textContent = data.key;
                    break;

                case 'job-done':
                    rawOutput = data.result.output;
                    output.textContent = rawOutput === '' ? 'No output' : rawOutput;

                    let erd = data.result.erd;
                    if (erd && erd.length > 0) {
                        erd_link.classList.remove('hidden');
                        erd_link.href = `https://kroki.io/mermaid/svg/${erd}`;
                        erd_link.target = '_blank';
                    }

                    const state = Alpine.$data(query_filters);
                    rawQueries = data.result.queries;
                    query_count.textContent = `Total: ${rawQueries.length} queries`;
                    fillQueries(queries, rawQueries, state);

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
                case 'job-overloaded':
                    output.textContent = data.error;
                    run.disabled = false;
                    loader.classList.add('hidden');
                    break;
                default:
                    console.warn('Unhandled event:', data);
                    break;
            }

        }

        socket.onopen = function(e) {
            // job.textContent = 'connected';
            run.disabled = false;
            // if url has "?run" then run the code
            if (window.location.search.includes('?run')) {
                execute();
            }
        }

        socket.onclose = function(e) {
            // job.textContent = 'connection died';
            run.disabled = true;
            setTimeout(function(){
                // job.textContent = 'reconnecting';
                connect();
            }, 2000);
        }
    }

    connect();
    models_editor.focus();


    function execute() {
        output.textContent = 'loading...';
        queries.innerHTML = 'loading...';
        query_count.textContent = 'loading...';

        // Reset ERD-related elements
        erd_link.classList.add('hidden');
        erd_link.href = '#';
        erd_link.onclick = null;

        document.getElementById('returned-data').innerHTML = '';

        if (models_editor.getValue().trim() === '') {
            alert('Please enter some code to run or select a template');
            return;
        }

        var payload = JSON.stringify({
            code: models_editor.getValue(),
            ignore_cache: ignore_cache.checked,
            database: database_select.value,
        });

        socket.send(payload);
        loader.classList.remove('hidden');
        run.disabled = true;
    }

    // --- Button Handlers ---
    run.addEventListener('click', function(){
        execute()
        models_editor.focus();
    });

    save.addEventListener('click', function(){
        var formData = new FormData();
        formData.append('code', models_editor.getValue());
        formData.append('name', name.value);
        formData.append('database', database_select.value);
        formData.append('private', isPrivate.checked);
        formData.append('csrfmiddlewaretoken', csrftoken);

        fetch('/save', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // job.textContent = 'new snippet saved';
            name.value = '';
            isPrivate.checked = false;
            window.history.pushState('Dry ORM', 'Dry ORM', '/' + data);
        });
    });

    template_select.addEventListener('change', function(event) {
        var template_name = event.target.value;
        var template_text = templates[template_name] || '';
        models_editor.setValue(template_text);
        models_editor.focus();
        window.history.pushState('Dry ORM', 'Dry ORM', '/');
    });

    document.querySelectorAll('#query-filters a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); 
            const state = Alpine.$data(query_filters);
            fillQueries(queries, rawQueries, state);
        });
    });


    function colorize(query, padding = 0){
        const keywords = new Set([
            "BEGIN", "COMMIT", "SAVEPOINT", "ROLLBACK", "TRUNCATE", "ESCAPE", "ADD", "ALL", "ALTER", "AND", "ANY", "AS", "ASC", "BACKUP", "BETWEEN", "BY", "CASE", "CHECK", "COLUMN", "CONSTRAINT", "CREATE", "CROSS", "DATABASE", "DEFAULT", "DELETE", "DESC", "DISTINCT", "DROP", "ELSE", "END", "EXISTS", "EXPLAIN", "FALSE", "FOREIGN", "FROM", "FULL", "GROUP", "HAVING", "IF", "IN", "INDEX", "INNER", "INSERT", "INTO", "IS", "JOIN", "KEY", "LEFT", "LIKE", "LIMIT", "NOT", "NULL", "ON", "OR", "ORDER", "OUTER", "PRIMARY", "REFERENCES", "RIGHT", "SELECT", "SET", "TABLE", "THEN", "TO", "TRUE", "UNION", "UNIQUE", "UPDATE", "VALUES", "VIEW", "WHEN", "WHERE", "WITH"
        ]);

        const lines = query.split('\n');
        const highlightedLines = lines.map((line, index) => {
            const highlighted = line.replace(/\b\w+\b/g, (token) => {
                return keywords.has(token.toUpperCase())
                    ? `<span class="font-bold text-django-primary">${token}</span>`
                    : token;
            });
            // Add padding to all lines except the first one
            return index === 0 ? highlighted : ' '.repeat(padding) + highlighted;
        });

        return highlightedLines.join('\n');
    }

    function fillQueries(queries, rawQueries, filters) {
        var clonedQueries = rawQueries.slice(0);

        if (filters.selectedReverse) {
            clonedQueries = clonedQueries.reverse();
        }
        queries.innerHTML = '';
        var query_html = [];

        for (var i = 0; i < clonedQueries.length; i++) {
            let query = clonedQueries[i];
            let sql = query.sql.trim();

            // Match the beginning of the SQL statement using regex
            if (
                (/^(BEGIN|COMMIT|ROLLBACK|SAVEPOINT)/i.test(sql) && !filters.selectedTCL) ||
                (/^(CREATE|ALTER|DROP|TRUNCATE)/i.test(sql) && !filters.selectedDDL) ||
                (/^SELECT/i.test(sql) && !filters.selectedSelect) ||
                (/^INSERT/i.test(sql) && !filters.selectedInsert) ||
                (/^UPDATE/i.test(sql) && !filters.selectedUpdate) ||
                (/^DELETE/i.test(sql) && !filters.selectedDelete)
                // (/^REVERSE/i.test(sql) && !filters.selectedReverse)
            ) {
                continue;
            }

            let padding = query.time.toString().length + 2;
            let colorized = colorize(query.sql, padding);
            query_html.push(
                `<span class="font-semibold text-django-primary/80">${query.time}s</span> ${colorized}\n\n`
            );
        }

        queries.innerHTML = query_html.length > 0
            ? query_html.join('')
            : '<span class="p-2 text-lg">No queries</span>';
    }


    // --- AI Generated Code ---
    //
    //       ... works ...
    //        ¯\_(ツ)_/¯
    //            o
    //           /\

    // Reusable copy function
    function setupCopyButton(button, getContent) {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent the click from triggering the collapse
            const content = getContent();
            const copiedLabel = document.createElement('span');
            copiedLabel.className = 'text-green-500 text-sm ml-2';
            copiedLabel.textContent = 'Copied!';
            navigator.clipboard.writeText(content).then(() => {
                const icon = this.querySelector('svg');
                icon.classList.remove('group-hover:block');
                icon.parentNode.appendChild(copiedLabel);
                setTimeout(() => {
                    copiedLabel.remove();
                    icon.classList.add('group-hover:block');
                }, 1000);
            });
        });
    }

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
                th.className = 'p-1 bg-slate-200 border border-slate-300 text-left';
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            // Add rows
            returned.forEach(item => {
                const row = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.className = 'p-1 bg-slate-100 border border-slate-300';
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
            // Add copy button to each returned data section
            const sectionId = header.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            const table = section.querySelector('table');

            // Create copy button container
            const copyButtonContainer = document.createElement('div');
            copyButtonContainer.className = 'copy-indicator';
            copyButtonContainer.innerHTML = '<svg class="w-6 h-6 text-django-tertiary hidden group-hover:block" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>';

            // Add copy button to the header
            const headerContent = header.querySelector('div');
            headerContent.appendChild(copyButtonContainer);

            // Setup copy functionality
            setupCopyButton(copyButtonContainer, () => {
                if (table) {
                    const rows = table.querySelectorAll('tbody tr');
                    let content = '';
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        cells.forEach(cell => {
                            content += cell.textContent.trim() + '\t';
                        });
                        content += '\n';
                    });
                    return content;
                }
                return '';
            });
        });
    }
});
