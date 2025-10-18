import './styles.css';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle, indentUnit } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Custom theme for syntax highlighting
const customHighlightStyle = HighlightStyle.define([
    { tag: tags.string, color: '#164', fontWeight: '500' },
    { tag: tags.number, color: '#164' },
    { tag: tags.keyword, color: '#0C4B33', fontWeight: 'bold' },
    //{ tag: tags.variableName, color: '#0C4B33', fontWeight: 'bold' },
    { tag: tags.definitionKeyword, color: '#0C4B33', fontWeight: 'bold' },
    { tag: tags.comment, color: 'gray' },
]);

// Line highlighting extension
const lineHighlightCompartment = new Compartment();

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Resize listener removed - now using pure CSS media queries

document.addEventListener('DOMContentLoaded', function() {
    var app_state = Alpine.$data(document.querySelector('body'));
    var csrftoken = getCookie('csrftoken');

    // Dark mode functionality
    const themeToggle = document.getElementById('theme-toggle');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    const theme = localStorage.getItem('theme') || 'light';

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            darkIcon.classList.add('hidden');
            lightIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            lightIcon.classList.add('hidden');
            darkIcon.classList.remove('hidden');
        }
    }

    applyTheme(theme);

    themeToggle.addEventListener('click', function() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

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

    let rawOutput = '';
    let rawQueries = [];
    let lineToQueryMap = new Map();

    setupCopyButton(document.querySelector('[data-section="output-section"] .copy-indicator'), () => rawOutput);
    setupCopyButton(document.querySelector('[data-section="queries-section"] .copy-indicator'), () => {
        return rawQueries.map(q => `-- ${q.time}s\n${q.sql}`).join('\n\n');
    });

    // --- Code Editor with CodeMirror 6 ---
    const codeTextarea = document.getElementById('code_models');
    const initialCode = codeTextarea.value;

    // Custom keymap for Ctrl/Cmd+Enter
    const executeKeymap = keymap.of([
        {
            key: 'Mod-Enter',
            run: () => {
                execute(false);
                return true;
            }
        },
        {
            key: 'Shift-Mod-Enter',
            run: () => {
                execute(true);
                return true;
            }
        }
    ]);

    // Listener for cursor position changes
    const cursorPositionListener = EditorView.updateListener.of((update) => {
        if (update.selectionSet) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            const lineNumber = line.number;
            highlightQueryForLine(lineNumber);
        }
    });

    const models_editor = new EditorView({
        state: EditorState.create({
            doc: initialCode,
            extensions: [
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightSpecialChars(),
                history(),
                drawSelection(),
                dropCursor(),
                EditorState.allowMultipleSelections.of(true),
                rectangularSelection(),
                crosshairCursor(),
                highlightActiveLine(),
                python(),
                syntaxHighlighting(customHighlightStyle),
                keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                executeKeymap,
                cursorPositionListener,
                lineHighlightCompartment.of([]),
                EditorView.theme({
                    '&': { height: '100%', width: '100%', maxWidth: '100%' },
                    '.cm-scroller': { overflow: 'auto', maxWidth: '100%' },
                    '.cm-content': { fontFamily: 'monospace', maxWidth: '100%' },
                }),
                EditorState.tabSize.of(4),
                indentUnit.of("    "),
            ],
        }),
        parent: codeTextarea.parentElement,
    });

    // Hide the textarea
    codeTextarea.style.display = 'none';

    // Helper function to get editor value
    function getEditorValue() {
        return models_editor.state.doc.toString();
    }

    // Helper function to set editor value
    function setEditorValue(value) {
        models_editor.dispatch({
            changes: {
                from: 0,
                to: models_editor.state.doc.length,
                insert: value,
            },
        });
    }

    // Focus the editor
    models_editor.focus();

    // --- Websocket ---
    var socket = null;

    var connect = function(){
        var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
        socket = new WebSocket(ws_scheme + '://' + window.location.host + '/ws/');

        socket.onmessage = function(e) {
            var data = JSON.parse(e.data);

            switch(data.event){
                case 'job-fired':
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
            run(true)
            if (window.location.search.includes('?run') || window.location.pathname.endsWith("/run")) {
                execute();
            }
        }

        socket.onclose = function(e) {
            run(false)
            setTimeout(function(){
                connect();
            }, 2000);
        }
    }

    connect();

    initializeJourneys();

    setTimeout(() => {
        handleJourneyNavigation();
    }, 100);

    function execute(forceNoCache = false) {
        app_state.loading = true;
        output.textContent = 'loading...';
        queries.innerHTML = 'loading...';
        query_count_number.textContent = '...';

        show_template.classList.add('hidden');

        erd_link.classList.add('hidden');
        erd_link.href = '#';
        erd_link.onclick = null;

        document.getElementById('returned-data').innerHTML = '';

        const code = getEditorValue();
        if (code.trim() === '') {
            alert('Please enter some code to run or select a template');
            return;
        }

        // On mobile (<1024px), switch to result view
        if (window.innerWidth < 1024) {
            app_state.showCode = false;
            app_state.showResult = true;
        }

        var payload = JSON.stringify({
            code: code,
            ignore_cache: forceNoCache || ignore_cache.checked,
            database: database_select.value,
        });

        socket.send(payload);
        run.disabled = true;
    }

    template_select.addEventListener('change', function() {
        template_select.value = this.value;
        var template_text = templates[this.value] || '';
        setEditorValue(template_text);
        models_editor.focus();
        window.history.pushState('Dry ORM', 'Dry ORM', '/');
    });

    show_template.addEventListener('click', function() {
        dialog.showModal();
    });

    run_button.addEventListener('click', function(){
        execute();
        models_editor.focus();
    });

    function handleSave(shouldCopy = false) {
        const errorElement = document.getElementById('save-error');
        errorElement.classList.add('hidden');

        var formData = new FormData();
        formData.append('code', getEditorValue());
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
            document.getElementById('share-dialog').close();
        })
        .catch(error => {
            console.error('Error saving:', error);
            errorElement.textContent = 'Failed to save. Please try again.';
            errorElement.classList.remove('hidden');
        });
    }

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
            "BEGIN", "COMMIT", "SAVEPOINT", "RELEASE", "ROLLBACK", "TRUNCATE", "ESCAPE", "ADD", "ALL", "ALTER", "AND", "ANY", "AS", "ASC", "BACKUP", "BETWEEN", "BY", "CASE", "CHECK", "COLUMN", "CONSTRAINT", "CREATE", "CROSS", "DATABASE", "DEFAULT", "DELETE", "DESC", "DISTINCT", "DROP", "ELSE", "END", "EXISTS", "EXPLAIN", "FALSE", "FOREIGN", "FROM", "FULL", "GROUP", "HAVING", "IF", "IN", "INDEX", "INNER", "INSERT", "INTO", "IS", "JOIN", "KEY", "LEFT", "LIKE", "LIMIT", "NOT", "NULL", "ON", "OR", "ORDER", "OUTER", "PRIMARY", "REFERENCES", "RIGHT", "SELECT", "SET", "TABLE", "THEN", "TO", "TRUE", "UNION", "UNIQUE", "UPDATE", "VALUES", "VIEW", "WHEN", "WHERE", "WITH"
        ]);

        const lines = query.split('\n');
        const highlightedLines = lines.map((line, index) => {
            const highlighted = line.replace(/\b\w+\b/g, (token) => {
                return keywords.has(token.toUpperCase())
                    ? `<span class="font-bold text-django-primary dark:text-green-300">${token}</span>`
                    : token;
            });
            return index === 0 ? highlighted : ' '.repeat(padding) + highlighted;
        });

        return highlightedLines.join('\n');
    }

    function highlightLineInEditor(lineNumber) {
        if (!models_editor || !lineNumber) return;

        // Clear any existing highlights
        models_editor.dispatch({
            effects: lineHighlightCompartment.reconfigure([])
        });

        const line = models_editor.state.doc.line(lineNumber);
        if (!line) return;

        // Scroll to the line
        models_editor.dispatch({
            selection: { anchor: line.from },
            scrollIntoView: true,
        });

        // Focus the editor
        models_editor.focus();

        // Switch to code view if we're on mobile (<1024px)
        if (window.innerWidth < 1024) {
            const app_state = Alpine.$data(document.querySelector('body'));
            app_state.showCode = true;
            app_state.showResult = false;
        }
    }

    function highlightQueryForLine(lineNumber) {
        if (!lineNumber || !lineToQueryMap.has(lineNumber)) return;

        const queries = lineToQueryMap.get(lineNumber);
        if (!queries || queries.length === 0) return;

        document.querySelectorAll('.query-item').forEach(item => {
            item.classList.remove('query-highlighted');
            const alpineData = Alpine.$data(item);
            if (alpineData) {
                alpineData.expanded = false;
            }
        });

        queries.forEach((query, i) => {
            document.querySelectorAll('.query-item').forEach(item => {
                const itemSql = item.querySelector('pre')?.textContent;
                const cleanItemSql = itemSql?.replace(/<[^>]*>/g, '').trim();
                const cleanQuerySql = query.sql.trim();

                if (cleanItemSql === cleanQuerySql) {
                    item.classList.add('query-highlighted');

                    const alpineData = Alpine.$data(item);
                    if (alpineData) {
                        alpineData.expanded = true;
                    }

                    if (i === 0) {
                        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            });
        });

        setTimeout(() => {
            document.querySelectorAll('.query-item.query-highlighted').forEach(item => {
                item.classList.remove('query-highlighted');
            });
        }, 3000);
    }

    function updateQueryMarkers() {
        // This function would mark lines with queries in CodeMirror 6
        // For now, we'll skip this as it requires custom decorations
    }

    let queryPopup = null;

    function createQueryPopup() {
        if (queryPopup) return queryPopup;

        queryPopup = document.createElement('div');
        queryPopup.id = 'query-popup';
        queryPopup.style.cssText = `
            position: absolute;
            display: none;
            background: white;
            border: 2px solid #44B78B;
            border-radius: 4px;
            padding: 12px;
            max-width: 500px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            pointer-events: none;
            font-family: monospace;
            font-size: 12px;
            line-height: 1.4;
        `;
        document.body.appendChild(queryPopup);
        return queryPopup;
    }

    function showQueryPopup(lineNumber, x, y) {
        const popup = createQueryPopup();
        const queries = lineToQueryMap.get(lineNumber);

        if (!queries || queries.length === 0) {
            hideQueryPopup();
            return;
        }

        let content = '';
        queries.forEach((query, index) => {
            if (index > 0) content += '<hr style="margin: 8px 0; border: 1px solid #e5e7eb;">';
            content += `<div style="margin-bottom: 4px;">`;
            content += `<span style="color: #0C4B33; font-weight: bold;">${query.time}s</span>`;
            content += `</div>`;
            content += `<pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0; color: #333;">${escapeHtml(query.sql)}</pre>`;
        });

        popup.innerHTML = content;

        const isDarkMode = document.documentElement.classList.contains('dark');
        if (isDarkMode) {
            popup.style.background = '#0f2e1e';
            popup.style.border = '2px solid #34d399';
            popup.style.color = '#d1fae5';
        } else {
            popup.style.background = 'white';
            popup.style.border = '2px solid #44B78B';
            popup.style.color = '#333';
        }

        popup.style.left = x + 'px';
        popup.style.top = (y + 5) + 'px';
        popup.style.display = 'block';

        setTimeout(() => {
            const rect = popup.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                popup.style.left = (window.innerWidth - rect.width - 10) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                popup.style.top = (y - rect.height - 5) + 'px';
            }
        }, 0);
    }

    function hideQueryPopup() {
        if (queryPopup) {
            queryPopup.style.display = 'none';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function addQueryHoverListeners() {
        const editorElement = models_editor.dom;

        editorElement.addEventListener('mousemove', function(e) {
            const pos = models_editor.posAtCoords({ x: e.clientX, y: e.clientY });
            if (pos) {
                const line = models_editor.state.doc.lineAt(pos);
                const lineNumber = line.number;

                if (lineToQueryMap.has(lineNumber)) {
                    showQueryPopup(lineNumber, e.pageX, e.pageY);
                } else {
                    hideQueryPopup();
                }
            }
        });

        editorElement.addEventListener('mouseout', function(e) {
            if (!editorElement.contains(e.relatedTarget)) {
                hideQueryPopup();
            }
        });
    }

    function fillQueries(queries, rawQueries, filters) {
        const tokenMapper = {
            TCL: ['BEGIN', 'COMMIT', 'ROLLBACK', 'RELEASE', 'SAVEPOINT', 'SET'],
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

            const isExcluded = types.some(type => filters[`selected${type}`] === false);
            if (!isExcluded) filtered.push(query);
        }

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

        queries.innerHTML = '';
        lineToQueryMap.clear();

        filtered.forEach((q, index) => {
            if (q.line_number) {
                if (!lineToQueryMap.has(q.line_number)) {
                    lineToQueryMap.set(q.line_number, []);
                }
                lineToQueryMap.get(q.line_number).push(q);
            }
        });

        filtered.forEach((q, index) => {
            const types = getTypes(q.sql);
            const typeLabel = types.length > 0 ? types[0] : 'QUERY';
            const previewLines = q.sql.split('\n').slice(0, 2);
            const preview = previewLines.join(' ').substring(0, 60);
            const hasMoreContent = q.sql.split('\n').length > 2 || q.sql.length > 60;

            const lineNumberIndicator = q.line_number
                ? `<span class="text-xs text-django-primary/60 dark:text-green-300 font-mono ml-2 cursor-pointer hover:text-django-primary dark:hover:text-green-200 query-line-link" data-line="${q.line_number}" title="Click to highlight line ${q.line_number}">L${q.line_number}</span>`
                : '';

            const queryDiv = document.createElement('div');
            queryDiv.className = 'query-item border-b border-django-primary/10 dark:border-green-700 last:border-b-0 mb-2';
            queryDiv.setAttribute('x-data', '{ expanded: false }');
            queryDiv.setAttribute('data-query-index', index);

            queryDiv.innerHTML = `
                <div class="flex items-center justify-between p-3 cursor-pointer hover:bg-django-secondary/10 dark:hover:bg-green-700 rounded-sm"
                     @click="expanded = !expanded">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="text-xs px-2 py-1 rounded bg-django-primary/20 text-django-primary dark:bg-green-700 dark:text-green-100 font-medium whitespace-nowrap">${typeLabel}</span>
                        <span class="text-xs font-semibold text-django-primary/80 dark:text-green-100 whitespace-nowrap">${q.time}s</span>
                        ${lineNumberIndicator}
                        <span class="text-xs text-django-text dark:text-green-100 truncate">${preview}${hasMoreContent ? '...' : ''}</span>
                    </div>
                    <div class="flex items-center ml-2">
                        <svg x-show="!expanded" class="w-4 h-4 text-django-text dark:text-green-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        <svg x-show="expanded" class="w-4 h-4 text-django-text dark:text-green-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </div>
                </div>
                <div x-show="expanded" x-cloak class="px-3 pb-3">
                    <div class="bg-django-secondary/10 dark:bg-[#1a4d35] p-3 rounded border dark:border-green-600">
                        <pre class="whitespace-pre-wrap text-xs font-mono text-django-text dark:text-green-100 overflow-auto">${colorize(q.sql)}</pre>
                    </div>
                </div>
            `;

            queries.appendChild(queryDiv);
        });

        document.querySelectorAll('.query-line-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.stopPropagation();
                const lineNumber = parseInt(this.getAttribute('data-line'));
                if (lineNumber) {
                    highlightLineInEditor(lineNumber);
                }
            });
        });

        updateQueryMarkers();
        addQueryHoverListeners();
    }

    function setupCopyButton(button, getContent) {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
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
            const headers = new Set()
            returned.forEach(item => {
                Object.keys(item).forEach(key => headers.add(key));
            });

            const template = document.getElementById('returned_data_template');
            const table = template.content.cloneNode(true);
            const thead = table.querySelector('thead');
            const tbody = table.querySelector('tbody');
            const header = table.querySelector('[data-section]');
            const section = table.querySelector('.returned-data-section');

            const sectionId = `returned-data-${Math.random().toString(36).substr(2, 9)}`;
            header.setAttribute('data-section', sectionId);
            section.id = sectionId;

            const headerRow = document.createElement('tr');
            headerRow.className = '';
            headers.forEach(header => {
                const th = document.createElement('th');
                th.className = 'p-1 bg-slate-200 dark:bg-green-800 border border-slate-300 dark:border-green-600 text-left text-django-text dark:text-green-100';
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            returned.forEach(item => {
                const row = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.className = 'p-1 bg-slate-100 dark:bg-green-900 border border-slate-300 dark:border-green-600 text-django-text dark:text-green-100';
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
            const table = formatReturnedData(returned);
            if (table) {
                const h3 = table.querySelector('h3');
                h3.textContent = 'Data';
                returnedContainer.appendChild(table);
            }
        } else if (typeof returned === 'object') {
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

        returnedContainer.querySelectorAll('[data-section]').forEach(header => {
            const sectionId = header.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            const table = section.querySelector('table');

            const copyButtonContainer = document.createElement('div');
            copyButtonContainer.className = 'copy-indicator';
            copyButtonContainer.innerHTML = '<svg class="w-6 h-6 text-django-tertiary hidden group-hover:block" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 7 2 2 4-4m-5-9v4h4V3h-4Z" /></svg>';

            const headerContent = header.querySelector('div');
            headerContent.appendChild(copyButtonContainer);

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
                <div class="p-3 cursor-pointer hover:bg-django-secondary/20 dark:hover:bg-green-800/50 transition-colors journey-header"
                     data-journey-slug="${journey.slug}"
                     @click="expanded = !expanded">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-django-text dark:text-green-200">${journey.title}</h3>
                        <svg x-show="!expanded" class="w-4 h-4 text-django-text dark:text-green-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        <svg x-show="expanded" class="w-4 h-4 text-django-text dark:text-green-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </div>
                </div>
                <div x-show="expanded" x-cloak class="chapter-list">
                    ${journey.chapters.map((chapter, index) => `
                        <div class="p-2 pl-6 hover:bg-django-secondary/20 dark:hover:bg-green-800/50 cursor-pointer chapter-item"
                             data-journey-slug="${journey.slug}"
                             data-chapter-slug="${chapter.slug}"
                             data-chapter-index="${index}">
                            <span class="text-sm text-django-text dark:text-green-200">${chapter.title}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            journeyList.appendChild(journeyDiv);
        });

        document.querySelectorAll('.chapter-item').forEach(item => {
            item.addEventListener('click', function() {
                const journeySlug = this.dataset.journeySlug;
                const chapterSlug = this.dataset.chapterSlug;
                const chapterIndex = parseInt(this.dataset.chapterIndex);

                loadChapter(journeySlug, chapterIndex);
                updateUrl(journeySlug, chapterSlug);

                document.querySelectorAll('.chapter-item').forEach(c => c.classList.remove('bg-django-secondary/30'));
                this.classList.add('bg-django-secondary/30');

                setTimeout(() => {
                    if (models_editor) {
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
            setEditorValue(chapter.content);
            app_state.currentJourney = journeySlug;
            app_state.currentChapter = chapterIndex;
        }
    }

    function updateUrl(journeySlug, chapterSlug) {
        const newUrl = `/j/${journeySlug}#${chapterSlug}`;
        window.history.pushState({ journeySlug, chapterSlug }, '', newUrl);
    }

    function handleJourneyNavigation() {
        const path = window.location.pathname;
        const hash = window.location.hash.substring(1);

        if (path.startsWith('/j/')) {
            const journeySlug = path.split('/')[2];
            app_state.showJourneyNav = true;

            if (!journeySlug || journeySlug === '') {
                const firstJourney = Object.values(journeys).reduce((prev, current) => {
                    return (prev.order || 999) < (current.order || 999) ? prev : current;
                });

                if (firstJourney && firstJourney.chapters.length > 0) {
                    const firstChapter = firstJourney.chapters[0];
                    loadChapter(firstJourney.slug, 0);
                    updateUrl(firstJourney.slug, firstChapter.slug);

                    setTimeout(() => {
                        const chapterElement = document.querySelector(`[data-chapter-slug="${firstChapter.slug}"]`);
                        if (chapterElement) {
                            chapterElement.classList.add('bg-django-secondary/30');
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
                                const journeyDiv = chapterElement.closest('[x-data]');
                                if (journeyDiv) {
                                    const alpineData = Alpine.$data(journeyDiv);
                                    alpineData.expanded = true;
                                }
                            }
                        }, 100);
                    }
                }
            } else {
                const journey = journeys[journeySlug];
                if (journey && journey.chapters.length > 0) {
                    loadChapter(journeySlug, 0);
                    updateUrl(journeySlug, journey.chapters[0].slug);

                    setTimeout(() => {
                        const firstChapterSlug = journey.chapters[0].slug;
                        const chapterElement = document.querySelector(`[data-chapter-slug="${firstChapterSlug}"]`);
                        if (chapterElement) {
                            chapterElement.classList.add('bg-django-secondary/30');
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
