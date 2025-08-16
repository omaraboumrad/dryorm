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

window.addEventListener('resize', function() {
    const app_state = Alpine.$data(document.querySelector('body'));
    const wasSmall = app_state.isSmall;
    app_state.isSmall = window.innerWidth < 1024;

    // If transitioning to small screen and both tabs are open, keep code open
    if (!wasSmall && app_state.isSmall && app_state.showCode && app_state.showResult) {
        app_state.showResult = false;
    }
    // If transitioning to large screen and code is open, show results panel
    else if (wasSmall && !app_state.isSmall && app_state.showCode) {
        app_state.showResult = true;
    }

});

document.addEventListener('DOMContentLoaded', function() {
    var app_state = Alpine.$data(document.querySelector('body'));
    var csrftoken = getCookie('csrftoken');
    var run_button = document.querySelector('.run');
    var job = document.getElementById('job');
    var output = document.getElementById('output');
    var queries = document.getElementById('queries');
    var name = document.getElementById('name');
    var isPrivate = document.getElementById('isPrivate');
    var templates = JSON.parse(document.getElementById('templates').textContent);
    var journeys = JSON.parse(document.getElementById('journeys').textContent);
    var template_select = document.getElementById('template-select');
    var database_select = document.getElementById('database-select');
    var ignore_cache = document.getElementById('ignore-cache');
    var erd_link = document.getElementById('erd');
    var query_filters = document.getElementById('query-filters');
    var query_count_number = document.getElementById('query-count-number');
    const show_template = document.getElementById('show-template');
    const dialog = document.getElementById('html-dialog');
    const iframe = document.getElementById('html-iframe');
    const shareDialog = document.getElementById('share-dialog');
    const shareTitleInput = shareDialog.querySelector('input[type="text"]');
    const saveButton = shareDialog.querySelector('button:nth-of-type(1)');
    const saveAndCopyButton = shareDialog.querySelector('button:nth-of-type(2)');

    // Store raw data
    let rawOutput = '';
    let rawQueries = [];

    // Setup copy buttons for static sections
    setupCopyButton(document.querySelector('[data-section="output-section"] .copy-indicator'), () => rawOutput);
    setupCopyButton(document.querySelector('[data-section="queries-section"] .copy-indicator'), () => {
        return rawQueries.map(q => `-- ${q.time}s\n${q.sql}`).join('\n\n');
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
                    query_count_number.textContent = rawQueries.length;
                    fillQueries(queries, rawQueries, state);

                    if (typeof data.result.returned === 'string' ){
                        // If the returned data is a string, show it as HTML
                        iframe.srcdoc = data.result.returned;
                        dialog.showModal();
                        show_template.classList.remove('hidden');
                    } else {
                        handleReturnedData(data.result.returned);
                    }

                    app_state.loading = false
                    run(true);

                    break;
                case 'job-timeout':
                case 'job-oom-killed':
                case 'job-network-disabled':
                case 'job-internal-error':
                case 'job-code-error':
                case 'job-image-not-found-error':
                case 'job-overloaded':
                    output.textContent = data.error;
                    run(true)
                    app_state.loading = false
                    break;
                default:
                    console.warn('Unhandled event:', data);
                    break;
            }

        }

        socket.onopen = function(e) {
            // job.textContent = 'connected';
            run(true)
            // if url has "?run" then run the code
            if (window.location.search.includes('?run') || window.location.pathname.endsWith("/run")) {
                execute();
            }
        }

        socket.onclose = function(e) {
            // job.textContent = 'connection died';
            run(false)
            setTimeout(function(){
                // job.textContent = 'reconnecting';
                connect();
            }, 2000);
        }
    }

    connect();
    models_editor.focus();

    // Journey functionality
    initializeJourneys();

    // Wait for journeys to be initialized before handling navigation
    setTimeout(() => {
        handleJourneyNavigation();
    }, 100);


    function execute() {
        app_state.loading = true;
        output.textContent = 'loading...';
        queries.innerHTML = 'loading...';
        query_count_number.textContent = '...';

        // Reset show template
        show_template.classList.add('hidden');

        // Reset ERD-related elements
        erd_link.classList.add('hidden');
        erd_link.href = '#';
        erd_link.onclick = null;

        document.getElementById('returned-data').innerHTML = '';

        if (models_editor.getValue().trim() === '') {
            alert('Please enter some code to run or select a template');
            return;
        }

        // Show results panel when running code
        if (app_state.isSmall) {
            app_state.showCode = false;
        }
        app_state.showResult = true;

        var payload = JSON.stringify({
            code: models_editor.getValue(),
            ignore_cache: ignore_cache.checked,
            database: database_select.value,
        });

        socket.send(payload);

        run.disabled = true;
    }


    template_select.addEventListener('change', function() {
        template_select.value = this.value;
        var template_text = templates[this.value] || '';
        models_editor.setValue(template_text);
        models_editor.focus();
        window.history.pushState('Dry ORM', 'Dry ORM', '/');
    });

    show_template.addEventListener('click', function() {
        dialog.showModal();
    });

    run_button.addEventListener('click', function(){
        execute()
        models_editor.focus();
    });

    // Save functionality for both desktop and mobile
    function handleSave(shouldCopy = false) {
        const errorElement = document.getElementById('save-error');
        errorElement.classList.add('hidden');

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
        .then(response => {
            if (!response.ok) {
                throw new Error('Save failed');
            }
            return response.json();
        })
        .then(data => {
            const slug = data.replace(/"/g, '');
            if (shouldCopy) {
                navigator.clipboard.writeText(window.location.origin + '/' + slug);
            }
            name.value = '';
            isPrivate.checked = false;
            window.history.pushState('Dry ORM', 'Dry ORM', '/' + data);
            // Close the dialog on success
            document.getElementById('share-dialog').close();
        })
        .catch(error => {
            console.error('Error saving:', error);
            errorElement.textContent = 'Failed to save. Please try again.';
            errorElement.classList.remove('hidden');
        });
    }

    // Add click handlers for save buttons
    document.getElementById('save-button').addEventListener('click', () => handleSave(false));
    document.getElementById('save-copy-button').addEventListener('click', () => handleSave(true));

    document.querySelectorAll('#query-filters button').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const state = Alpine.$data(query_filters);
            fillQueries(queries, rawQueries, state);
        });
    });

    function run(state){
        run_button.disabled = !state
    }

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
        const tokenMapper = {
            TCL: ['BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'SET'],
            DDL: ['CREATE', 'ALTER', 'DROP', 'TRUNCATE'],
            SELECT: ['SELECT'],
            INSERT: ['INSERT'],
            UPDATE: ['UPDATE'],
            DELETE: ['DELETE'],
        };

        const getTypes = sql => {
            const upper = sql.trim().toUpperCase();
            return Object.entries(tokenMapper)
                .filter(([_, tokens]) => tokens.some(token => upper.startsWith(token)))
                .map(([type]) => type);
        };

        const counts = {};
        const filtered = [];

        for (const query of rawQueries) {
            const types = getTypes(query.sql);
            types.forEach(type => counts[type] = (counts[type] || 0) + 1);

            // Only exclude queries if a type is explicitly toggled OFF
            const isExcluded = types.some(type => filters[`selected${type}`] === false);
            if (!isExcluded) filtered.push(query);
        }

        // Update filter labels
        document.querySelectorAll('#query-filters button .count').forEach(span => {
            const type = span.getAttribute('data-type');
            const count = counts[type] || 0;
            span.textContent = count > 0 ? ` (${count})` : '';
        });

        if (filters.selectedREVERSE) filtered.reverse();

        if (filtered.length === 0) {
            queries.innerHTML = '<span class="p-2 text-sm">No queries</span>';
            return;
        }

        // Clear the container and create individual collapsible query elements
        queries.innerHTML = '';

        filtered.forEach((q, index) => {
            const types = getTypes(q.sql);
            const typeLabel = types.length > 0 ? types[0] : 'QUERY';
            const previewLines = q.sql.split('\n').slice(0, 2);
            const preview = previewLines.join(' ').substring(0, 60);
            const hasMoreContent = q.sql.split('\n').length > 2 || q.sql.length > 60;

            // Create the query container
            const queryDiv = document.createElement('div');
            queryDiv.className = 'border-b border-django-primary/10 last:border-b-0 mb-2';
            queryDiv.setAttribute('x-data', '{ expanded: false }');

            queryDiv.innerHTML = `
                <div class="flex items-center justify-between p-3 cursor-pointer hover:bg-django-secondary/10 rounded-sm"
                     @click="expanded = !expanded">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="text-xs px-2 py-1 rounded bg-django-primary/20 text-django-primary font-medium whitespace-nowrap">${typeLabel}</span>
                        <span class="text-xs font-semibold text-django-primary/80 whitespace-nowrap">${q.time}s</span>
                        <span class="text-xs text-django-text truncate">${preview}${hasMoreContent ? '...' : ''}</span>
                    </div>
                    <div class="flex items-center ml-2">
                        <svg x-show="!expanded" class="w-4 h-4 text-django-text transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        <svg x-show="expanded" class="w-4 h-4 text-django-text transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </div>
                </div>
                <div x-show="expanded" x-cloak class="px-3 pb-3">
                    <div class="bg-django-secondary/10 p-3 rounded border">
                        <pre class="whitespace-pre-wrap text-xs font-mono text-django-text overflow-auto">${colorize(q.sql)}</pre>
                    </div>
                </div>
            `;

            queries.appendChild(queryDiv);
        });
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

    function initializeJourneys() {
        const journeyList = document.getElementById('journey-list');

        Object.values(journeys).forEach(journey => {
            const journeyDiv = document.createElement('div');
            journeyDiv.className = 'mb-4';
            journeyDiv.setAttribute('x-data', '{ expanded: false }');

            journeyDiv.innerHTML = `
                <div class="p-3 cursor-pointer hover:bg-django-secondary/20 transition-colors journey-header"
                     data-journey-slug="${journey.slug}"
                     @click="expanded = !expanded">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-django-text">${journey.title}</h3>
                        <svg x-show="!expanded" class="w-4 h-4 text-django-text transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        <svg x-show="expanded" class="w-4 h-4 text-django-text transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </div>
                </div>
                <div x-show="expanded" x-cloak class="chapter-list">
                    ${journey.chapters.map((chapter, index) => `
                        <div class="p-2 pl-6 hover:bg-django-secondary/20 cursor-pointer chapter-item"
                             data-journey-slug="${journey.slug}"
                             data-chapter-slug="${chapter.slug}"
                             data-chapter-index="${index}">
                            <span class="text-sm text-django-text">${chapter.title}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            journeyList.appendChild(journeyDiv);
        });

        // Add click handlers for chapters
        document.querySelectorAll('.chapter-item').forEach(item => {
            item.addEventListener('click', function() {
                const journeySlug = this.dataset.journeySlug;
                const chapterSlug = this.dataset.chapterSlug;
                const chapterIndex = parseInt(this.dataset.chapterIndex);

                loadChapter(journeySlug, chapterIndex);
                updateUrl(journeySlug, chapterSlug);

                // Visual feedback
                document.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('bg-django-secondary/30'));
                this.classList.add('bg-django-secondary/30');

                // Focus code editor after chapter loads
                setTimeout(() => {
                    if (typeof models_editor !== 'undefined' && models_editor) {
                        models_editor.focus();
                    }
                }, 100);
            });
        });
    }

    function loadChapter(journeySlug, chapterIndex) {
        const journey = journeys[journeySlug];
        if (journey && journey.chapters[chapterIndex]) {
            const chapter = journey.chapters[chapterIndex];
            models_editor.setValue(chapter.content);
            app_state.currentJourney = journeySlug;
            app_state.currentChapter = chapterIndex;
        }
    }

    function updateUrl(journeySlug, chapterSlug) {
        const newUrl = `/j/${journeySlug}#${chapterSlug}`;
        window.history.pushState({ journeySlug, chapterSlug }, '', newUrl);
    }

    function handleJourneyNavigation() {
        // Handle initial URL if it's a journey URL
        const path = window.location.pathname;
        const hash = window.location.hash.substring(1);

        if (path.startsWith('/j/')) {
            const journeySlug = path.split('/')[2];
            app_state.showJourneyNav = true;

            // Handle /j/ without specific journey - redirect to first journey and chapter
            if (!journeySlug || journeySlug === '') {
                // Find the journey with the lowest order value
                const firstJourney = Object.values(journeys).reduce((prev, current) => {
                    return (prev.order || 999) < (current.order || 999) ? prev : current;
                });

                if (firstJourney && firstJourney.chapters.length > 0) {
                    const firstChapter = firstJourney.chapters[0];
                    loadChapter(firstJourney.slug, 0);
                    updateUrl(firstJourney.slug, firstChapter.slug);

                    // Expand the journey section and highlight first chapter
                    setTimeout(() => {
                        const chapterElement = document.querySelector(`[data-chapter-slug="${firstChapter.slug}"]`);
                        if (chapterElement) {
                            chapterElement.classList.add('bg-django-secondary/30');
                            // Expand the journey section using Alpine
                            const journeyDiv = chapterElement.closest('[x-data]');
                            if (journeyDiv) {
                                const alpineData = Alpine.$data(journeyDiv);
                                alpineData.expanded = true;
                            }
                        }
                    }, 200);
                }
                return;
            }

            if (hash) {
                const chapterSlug = hash;
                const journey = journeys[journeySlug];
                if (journey) {
                    const chapterIndex = journey.chapters.findIndex(c => c.slug === chapterSlug);
                    if (chapterIndex >= 0) {
                        loadChapter(journeySlug, chapterIndex);
                        setTimeout(() => {
                            const chapterElement = document.querySelector(`[data-chapter-slug="${chapterSlug}"]`);
                            if (chapterElement) {
                                chapterElement.classList.add('bg-django-secondary/30');
                                // Expand the journey section using Alpine
                                const journeyDiv = chapterElement.closest('[x-data]');
                                if (journeyDiv) {
                                    Alpine.store = Alpine.store || {};
                                    const alpineData = Alpine.$data(journeyDiv);
                                    alpineData.expanded = true;
                                }
                            }
                        }, 100);
                    }
                }
            } else {
                // Load first chapter if no hash
                const journey = journeys[journeySlug];
                if (journey && journey.chapters.length > 0) {
                    loadChapter(journeySlug, 0);
                    updateUrl(journeySlug, journey.chapters[0].slug);

                    // Expand the journey section and highlight first chapter
                    setTimeout(() => {
                        const firstChapterSlug = journey.chapters[0].slug;
                        const chapterElement = document.querySelector(`[data-chapter-slug="${firstChapterSlug}"]`);
                        if (chapterElement) {
                            chapterElement.classList.add('bg-django-secondary/30');
                            // Expand the journey section using Alpine
                            const journeyDiv = chapterElement.closest('[x-data]');
                            if (journeyDiv) {
                                const alpineData = Alpine.$data(journeyDiv);
                                alpineData.expanded = true;
                            }
                        }
                    }, 100);
                }
            }
        }

        // Handle browser back/forward
        window.addEventListener('popstate', function(event) {
            if (event.state && event.state.journeySlug) {
                const journey = journeys[event.state.journeySlug];
                if (journey) {
                    const chapterIndex = journey.chapters.findIndex(c => c.slug === event.state.chapterSlug);
                    if (chapterIndex >= 0) {
                        loadChapter(event.state.journeySlug, chapterIndex);
                    }
                }
            }
        });
    }
});
