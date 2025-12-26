import './styles.css';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, gutter, GutterMarker } from '@codemirror/view';
import { EditorState, Compartment, StateField, StateEffect, RangeSetBuilder } from '@codemirror/state';
import { defaultKeymap, indentWithTab, history, historyKeymap } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle, indentUnit } from '@codemirror/language';
// import { autocompletion } from '@codemirror/autocomplete';
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

// Query line marker for gutter
class QueryLineMarker extends GutterMarker {
    constructor(count) {
        super();
        this.count = count;
    }

    toDOM() {
        return document.createTextNode(this.count > 1 ? String(this.count) : "●");
    }

    eq(other) {
        return other instanceof QueryLineMarker && other.count === this.count;
    }
}

// Effect to update query lines
const setQueryLines = StateEffect.define();

// State field to track lines with queries (now stores Map of position -> count)
const queryLinesField = StateField.define({
    create() {
        return new Map();
    },
    update(value, tr) {
        for (let effect of tr.effects) {
            if (effect.is(setQueryLines)) {
                return effect.value;
            }
        }
        return value;
    }
});

// Gutter for query line markers
const queryLineGutter = gutter({
    class: "cm-query-gutter",
    markers: view => {
        const queryLines = view.state.field(queryLinesField);
        const builder = new RangeSetBuilder();

        // Convert Map to Array and sort positions (RangeSetBuilder requires sorted order)
        const positions = Array.from(queryLines.entries()).sort((a, b) => a[0] - b[0]);
        for (let [pos, count] of positions) {
            builder.add(pos, pos, new QueryLineMarker(count));
        }

        return builder.finish();
    },
    initialSpacer: () => new QueryLineMarker(1),
});

// Theme for query line markers
const queryLineTheme = EditorView.baseTheme({
    ".cm-query-gutter": {
        color: "#44B78B",
        paddingLeft: "4px",
        paddingRight: "4px",
        fontWeight: "bold",
        minWidth: "1.8em",
        textAlign: "center",
    },
    ".dark .cm-query-gutter": {
        color: "#34d399 !important",
    }
});

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
    var allTemplates = JSON.parse(document.getElementById('templates').textContent);
    var currentOrmType = 'django'; // Track current ORM type
    var journeys = null; // Lazy-loaded
    var journeysInitialized = false;
    var template_select = document.getElementById('template-select');
    var database_select = document.getElementById('database-select');
    var orm_version_select = document.getElementById('orm-version-select');
    var ignore_cache = document.getElementById('ignore-cache');
    var erd_link = document.getElementById('erd');
    // Ref dialog elements (PR/Branch/Tag)
    var ref_dialog = document.getElementById('ref-dialog');
    var select_ref_button = document.getElementById('select-ref-button');
    var close_ref_dialog = document.getElementById('close-ref-dialog');
    var cancel_ref_button = document.getElementById('cancel-ref-button');
    var use_ref_button = document.getElementById('use-ref-button');
    var ref_select_actions = document.getElementById('ref-select-actions');
    var ref_status = document.getElementById('ref-status');
    var selected_ref_indicator = document.getElementById('selected-ref-indicator');
    var selected_ref_label = document.getElementById('selected-ref-label');
    var clear_ref_button = document.getElementById('clear-ref-button');

    // Tab-specific inputs
    var pr_id_input = document.getElementById('pr-id-input');
    var fetch_pr_button = document.getElementById('fetch-pr-button');
    var branch_input = document.getElementById('branch-input');
    var fetch_branch_button = document.getElementById('fetch-branch-button');
    var tag_input = document.getElementById('tag-input');
    var fetch_tag_button = document.getElementById('fetch-tag-button');

    // Search result containers
    var pr_search_results = document.getElementById('pr-search-results');
    var branch_search_results = document.getElementById('branch-search-results');
    var tag_search_results = document.getElementById('tag-search-results');

    // Current ref state - initialize from json_script if loading a saved snippet with ref
    var snippetRefInfoEl = document.getElementById('snippet-ref-info');
    window.currentRefInfo = snippetRefInfoEl ? JSON.parse(snippetRefInfoEl.textContent) : null;
    var pendingRefInfo = null;  // Ref info waiting to be confirmed in dialog
    var currentRefTab = 'pr';  // Current active tab in dialog
    var searchDebounceTimers = { pr: null, branch: null, tag: null };
    var query_filters = document.getElementById('query-filters');
    var query_count_number = document.getElementById('query-count-number');
    const show_template = document.getElementById('show-template');
    var version_label_orm = document.getElementById('version-label-orm');
    var version_label_db = document.getElementById('version-label-db');
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

    // Helper function to get ORM type from version string
    function getOrmType(ormVersion) {
        if (ormVersion.startsWith('django-')) return 'django';
        if (ormVersion.startsWith('sqlalchemy-')) return 'sqlalchemy';
        if (ormVersion.startsWith('prisma-')) return 'prisma';
        return 'django';
    }

    // Function to update the version label in the code editor
    function updateVersionLabel() {
        // Get ORM version - either from ref or from dropdown
        let ormText;
        if (window.currentRefInfo) {
            switch (window.currentRefInfo.type) {
                case 'pr':
                    ormText = `PR #${window.currentRefInfo.id}`;
                    break;
                case 'branch':
                    ormText = `${window.currentRefInfo.id}`;
                    break;
                case 'tag':
                    ormText = `${window.currentRefInfo.id}`;
                    break;
                default:
                    ormText = window.currentRefInfo.id;
            }
        } else {
            // Get the selected option text from dropdown
            const selectedOption = orm_version_select.options[orm_version_select.selectedIndex];
            ormText = selectedOption ? selectedOption.text : orm_version_select.value;
        }

        // Get database version - get the selected option text
        const selectedDb = database_select.options[database_select.selectedIndex];
        const dbText = selectedDb ? selectedDb.text : database_select.value;

        version_label_orm.textContent = ormText;
        version_label_db.textContent = dbText;
    }

    // Function to update template dropdown based on ORM type
    function updateTemplateDropdown(ormType, autoLoadTemplate = false) {
        var templates = allTemplates[ormType] || {};
        template_select.innerHTML = '';

        Object.keys(templates).forEach(function(key) {
            var option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            template_select.appendChild(option);
        });

        // Auto-select first template
        if (template_select.options.length > 0) {
            template_select.selectedIndex = 0;

            // Only auto-load template if explicitly requested (e.g., when switching ORM types)
            if (autoLoadTemplate) {
                var firstTemplate = templates[template_select.value] || '';
                setEditorValue(firstTemplate);
            }
        }
    }

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
                // autocompletion(),
                queryLinesField,
                queryLineGutter,
                queryLineTheme,
                executeKeymap,
                keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
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

    // --- HTTP Request Handler ---
    function handleResponse(data) {
        switch(data.event){
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
                run_button.disabled = false;

                break;
            case 'job-timeout':
            case 'job-oom-killed':
            case 'job-network-disabled':
            case 'job-internal-error':
            case 'job-code-error':
            case 'job-image-not-found-error':
            case 'job-overloaded':
                output.textContent = data.error;
                run_button.disabled = false;
                app_state.loading = false
                break;
            default:
                console.warn('Unhandled event:', data);
                break;
        }
    }

    // Check if auto-run is requested
    if (window.location.search.includes('?run') || window.location.pathname.endsWith("/run")) {
        execute();
    }

    // Lazy load journeys function
    async function ensureJourneysLoaded() {
        if (journeysInitialized) return;

        const journeysElement = document.getElementById('journeys');
        const journeysData = JSON.parse(journeysElement.textContent);

        // Check if journeys are already loaded from backend (journey URL)
        if (Object.keys(journeysData).length > 0) {
            journeys = journeysData;
        } else {
            // Fetch from API endpoint for regular pages
            try {
                const response = await fetch('/api/journeys');
                journeys = await response.json();
            } catch (error) {
                console.error('Error loading journeys:', error);
                journeys = {};
            }
        }

        initializeJourneys();
        journeysInitialized = true;
    }

    // Check if we need to load journeys immediately (journey URL)
    const isJourneyUrl = window.location.pathname.startsWith('/j/');
    if (isJourneyUrl) {
        ensureJourneysLoaded();
        setTimeout(() => {
            handleJourneyNavigation();
        }, 100);
    }

    // Watch for journey nav toggle and load journeys on first open
    const journeyNavButton = document.querySelector('[\\@click="showJourneyNav = !showJourneyNav"]');
    if (journeyNavButton) {
        journeyNavButton.addEventListener('click', async function() {
            await ensureJourneysLoaded();
        });
    }

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

        // Clear query markers
        lineToQueryMap.clear();
        updateQueryMarkers();

        const code = getEditorValue();
        if (code.trim() === '') {
            alert('Please enter some code to run or select a template');
            app_state.loading = false;
            return;
        }

        // On mobile (<1024px), switch to result view
        if (window.innerWidth < 1024) {
            app_state.showCode = false;
            app_state.showResult = true;
        }

        var payload = {
            code: code,
            ignore_cache: forceNoCache || ignore_cache.checked,
            database: database_select.value,
        };

        // Check if a ref is selected (PR/Branch/Tag), otherwise use version
        if (window.currentRefInfo) {
            payload.ref_type = window.currentRefInfo.type;
            payload.ref_id = window.currentRefInfo.id;
        } else {
            payload.orm_version = orm_version_select.value;
        }

        run_button.disabled = true;

        // Use fetch API instead of WebSocket
        fetch('/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            handleResponse(data);
        })
        .catch(error => {
            console.error('Error:', error);
            output.textContent = 'Connection error: ' + error.message;
            run_button.disabled = false;
            app_state.loading = false;
        });
    }

    // Event listener for ORM version changes
    orm_version_select.addEventListener('change', function() {
        var newOrmType = getOrmType(this.value);
        if (newOrmType !== currentOrmType) {
            currentOrmType = newOrmType;
            updateTemplateDropdown(newOrmType, true); // Auto-load template when switching ORMs
        }
        updateVersionLabel();
    });

    // Event listener for database changes
    database_select.addEventListener('change', function() {
        updateVersionLabel();
    });

    // Ref Dialog: Tab switching
    function switchRefTab(tabName) {
        currentRefTab = tabName;

        // Update tab styles
        document.querySelectorAll('.ref-tab').forEach(tab => {
            if (tab.dataset.refTab === tabName) {
                tab.classList.add('border-django-primary', 'text-django-primary', 'dark:text-green-100');
                tab.classList.remove('border-transparent', 'text-django-text/60', 'dark:text-green-300');
            } else {
                tab.classList.remove('border-django-primary', 'text-django-primary', 'dark:text-green-100');
                tab.classList.add('border-transparent', 'text-django-text/60', 'dark:text-green-300');
            }
        });

        // Show/hide tab content
        document.querySelectorAll('.ref-tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById('ref-tab-' + tabName).classList.remove('hidden');

        // Clear status and actions when switching tabs
        ref_status.innerHTML = '';
        ref_select_actions.classList.add('hidden');
        pendingRefInfo = null;
    }

    document.querySelectorAll('.ref-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchRefTab(this.dataset.refTab);
        });
    });

    // Debounced search for refs
    function debounceSearch(refType, query) {
        // Clear any pending timer for this ref type
        if (searchDebounceTimers[refType]) {
            clearTimeout(searchDebounceTimers[refType]);
        }

        const resultsContainer = {
            pr: pr_search_results,
            branch: branch_search_results,
            tag: tag_search_results
        }[refType];

        // Clear results if query is empty
        if (!query || query.trim() === '') {
            resultsContainer.innerHTML = '';
            return;
        }

        // Show loading state
        resultsContainer.innerHTML = '<div class="text-sm text-django-text/50 dark:text-green-300 p-2">Searching...</div>';

        // Set debounce timer
        searchDebounceTimers[refType] = setTimeout(async () => {
            try {
                const response = await fetch(`/search-refs?type=${refType}&q=${encodeURIComponent(query.trim())}`);
                const data = await response.json();
                renderSearchResults(refType, data.results || [], resultsContainer);
            } catch (error) {
                resultsContainer.innerHTML = '<div class="text-sm text-red-500 p-2">Search failed</div>';
            }
        }, 500);
    }

    function renderSearchResults(refType, results, container) {
        if (results.length === 0) {
            container.innerHTML = '<div class="text-sm text-django-text/50 dark:text-green-300 p-2">No results found</div>';
            return;
        }

        container.innerHTML = results.map(item => {
            if (refType === 'pr') {
                const stateColor = item.state === 'open'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400';
                return `
                    <div class="search-result-item p-2 hover:bg-django-secondary/20 dark:hover:bg-green-700 cursor-pointer rounded border-b border-django-primary/10 dark:border-green-700 last:border-b-0"
                         data-ref-type="pr" data-ref-id="${item.id}">
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-django-primary dark:text-green-300">#${item.id}</span>
                            <span class="${stateColor} text-xs">${item.state}</span>
                        </div>
                        <div class="text-sm text-django-text dark:text-green-100 truncate">${escapeHtml(item.title)}</div>
                        <div class="text-xs text-django-text/50 dark:text-green-300">by ${item.author}</div>
                    </div>
                `;
            } else {
                // Branch or tag
                return `
                    <div class="search-result-item p-2 hover:bg-django-secondary/20 dark:hover:bg-green-700 cursor-pointer rounded border-b border-django-primary/10 dark:border-green-700 last:border-b-0"
                         data-ref-type="${refType}" data-ref-id="${item.name}">
                        <div class="flex items-center justify-between">
                            <span class="font-mono text-django-primary dark:text-green-300">${escapeHtml(item.name)}</span>
                            <span class="text-xs text-django-text/50 dark:text-green-300 font-mono">${item.sha}</span>
                        </div>
                    </div>
                `;
            }
        }).join('');

        // Add click handlers to results
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const refType = this.dataset.refType;
                const refId = this.dataset.refId;

                // Set the input value and trigger fetch
                if (refType === 'pr') {
                    pr_id_input.value = refId;
                    fetch_pr_button.click();
                } else if (refType === 'branch') {
                    branch_input.value = refId;
                    fetch_branch_button.click();
                } else if (refType === 'tag') {
                    tag_input.value = refId;
                    fetch_tag_button.click();
                }

                // Clear search results
                container.innerHTML = '';
            });
        });
    }

    // Add input event listeners for search
    pr_id_input.addEventListener('input', function() {
        debounceSearch('pr', this.value);
    });

    branch_input.addEventListener('input', function() {
        debounceSearch('branch', this.value);
    });

    tag_input.addEventListener('input', function() {
        debounceSearch('tag', this.value);
    });

    // Ref Dialog: Open dialog
    select_ref_button.addEventListener('click', function() {
        pr_id_input.value = '';
        branch_input.value = '';
        tag_input.value = '';
        ref_status.innerHTML = '';
        ref_select_actions.classList.add('hidden');
        pendingRefInfo = null;
        // Clear search results
        pr_search_results.innerHTML = '';
        branch_search_results.innerHTML = '';
        tag_search_results.innerHTML = '';
        switchRefTab('pr');  // Default to PR tab
        ref_dialog.showModal();
        pr_id_input.focus();
    });

    // Ref Dialog: Close handlers
    close_ref_dialog.addEventListener('click', function() {
        ref_dialog.close();
    });

    cancel_ref_button.addEventListener('click', function() {
        ref_dialog.close();
    });

    ref_dialog.addEventListener('click', function(e) {
        if (e.target === ref_dialog) {
            ref_dialog.close();
        }
    });

    // Generic fetch function for any ref type
    async function fetchRef(refType, refId, fetchButton) {
        const typeLabels = { pr: 'PR', branch: 'branch', tag: 'tag' };
        const typeLabel = typeLabels[refType];

        ref_status.innerHTML = `<span class="text-django-text dark:text-green-100">Fetching ${typeLabel} ${refId}...</span>`;
        ref_select_actions.classList.add('hidden');
        fetchButton.disabled = true;

        try {
            const response = await fetch('/fetch-pr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ref_type: refType, ref_id: refId })
            });

            const data = await response.json();

            if (data.success) {
                pendingRefInfo = data.ref;
                const cachedBadge = data.ref.cached
                    ? '<span class="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-200 rounded">cached</span>'
                    : '<span class="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 rounded">fetched</span>';

                let statusHtml = `
                    <div class="p-2 bg-django-secondary/10 dark:bg-green-800 rounded border border-django-primary/20 dark:border-green-600">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-django-text dark:text-green-100">${escapeHtml(data.ref.title)}</span>
                            ${cachedBadge}
                        </div>
                        <div class="text-xs mt-1 flex gap-3 flex-wrap">`;

                if (refType === 'pr' && data.ref.state) {
                    const stateColor = data.ref.state === 'open'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400';
                    statusHtml += `<span class="${stateColor} font-medium">${data.ref.state}</span>`;
                }

                if (data.ref.author) {
                    statusHtml += `<span class="text-django-text/70 dark:text-green-200">by ${data.ref.author}</span>`;
                }

                statusHtml += `<span class="text-django-text/50 dark:text-green-300 font-mono">${data.ref.sha.substring(0, 7)}</span>
                        </div>
                    </div>
                `;

                ref_status.innerHTML = statusHtml;
                ref_select_actions.classList.remove('hidden');
            } else {
                pendingRefInfo = null;
                ref_status.innerHTML = '<span class="text-red-600 dark:text-red-400">' + escapeHtml(data.error) + '</span>';
                ref_select_actions.classList.add('hidden');
            }
        } catch (error) {
            pendingRefInfo = null;
            ref_status.innerHTML = '<span class="text-red-600 dark:text-red-400">Error fetching: ' + escapeHtml(error.message) + '</span>';
            ref_select_actions.classList.add('hidden');
        } finally {
            fetchButton.disabled = false;
        }
    }

    // Fetch PR button handler
    fetch_pr_button.addEventListener('click', async function() {
        const prId = pr_id_input.value.trim();
        if (!prId || isNaN(parseInt(prId))) {
            ref_status.innerHTML = '<span class="text-red-600 dark:text-red-400">Please enter a valid PR number</span>';
            ref_select_actions.classList.add('hidden');
            return;
        }
        await fetchRef('pr', prId, fetch_pr_button);
    });

    // Fetch Branch button handler
    fetch_branch_button.addEventListener('click', async function() {
        const branchName = branch_input.value.trim();
        if (!branchName) {
            ref_status.innerHTML = '<span class="text-red-600 dark:text-red-400">Please enter a branch name</span>';
            ref_select_actions.classList.add('hidden');
            return;
        }
        await fetchRef('branch', branchName, fetch_branch_button);
    });

    // Fetch Tag button handler
    fetch_tag_button.addEventListener('click', async function() {
        const tagName = tag_input.value.trim();
        if (!tagName) {
            ref_status.innerHTML = '<span class="text-red-600 dark:text-red-400">Please enter a tag name</span>';
            ref_select_actions.classList.add('hidden');
            return;
        }
        await fetchRef('tag', tagName, fetch_tag_button);
    });

    // Ref Dialog: Use this version button
    use_ref_button.addEventListener('click', function() {
        if (pendingRefInfo) {
            window.currentRefInfo = pendingRefInfo;

            // Create label based on ref type
            let label;
            switch (pendingRefInfo.type) {
                case 'pr':
                    label = `PR #${pendingRefInfo.id}`;
                    break;
                case 'branch':
                    label = `branch:${pendingRefInfo.id}`;
                    break;
                case 'tag':
                    label = `tag:${pendingRefInfo.id}`;
                    break;
                default:
                    label = pendingRefInfo.id;
            }

            selected_ref_label.textContent = label;
            selected_ref_indicator.classList.remove('hidden');
            selected_ref_indicator.classList.add('flex');
            orm_version_select.classList.add('hidden');
            ref_dialog.close();
            updateVersionLabel();
        }
    });

    // Clear selected ref
    clear_ref_button.addEventListener('click', function() {
        window.currentRefInfo = null;
        selected_ref_indicator.classList.add('hidden');
        selected_ref_indicator.classList.remove('flex');
        orm_version_select.classList.remove('hidden');
        updateVersionLabel();
    });

    // Event listener for template selection changes
    template_select.addEventListener('change', function() {
        template_select.value = this.value;
        var templates = allTemplates[currentOrmType] || {};
        var template_text = templates[this.value] || '';
        setEditorValue(template_text);
        models_editor.focus();
        window.history.pushState('Dry ORM', 'Dry ORM', '/');
    });

    // Initialize template dropdown for current ORM version (don't auto-load to preserve saved snippets)
    currentOrmType = getOrmType(orm_version_select.value);
    updateTemplateDropdown(currentOrmType, false);

    // Initialize version label
    updateVersionLabel();

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

        // Add version info - either orm_version or ref_type+ref_id+sha
        if (window.currentRefInfo) {
            formData.append('ref_type', window.currentRefInfo.type);
            formData.append('ref_id', window.currentRefInfo.id);
            if (window.currentRefInfo.sha) {
                formData.append('sha', window.currentRefInfo.sha);
            }
        } else {
            formData.append('orm_version', orm_version_select.value);
        }

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
        // Update the query line markers in the gutter
        const queryLinePositions = new Map();

        // Convert line numbers to document positions and count queries per line
        lineToQueryMap.forEach((queries, lineNumber) => {
            if (lineNumber > 0 && lineNumber <= models_editor.state.doc.lines) {
                const line = models_editor.state.doc.line(lineNumber);
                queryLinePositions.set(line.from, queries.length);
            }
        });

        // Dispatch the effect to update query line markers
        models_editor.dispatch({
            effects: setQueryLines.of(queryLinePositions)
        });
    }

    let queryPopup = null;
    let isAltPressed = false;
    let currentPopupData = null; // Store current popup state for alt-key toggling

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

    function generatePopupContent(templateGroups, forceTemplated = false) {
        let content = '';
        let groupIndex = 0;

        templateGroups.forEach((groupQueries, template) => {
            if (groupIndex > 0) content += '<hr style="margin: 8px 0; border: 1px solid #e5e7eb;">';

            const totalTime = groupQueries.reduce((sum, q) => sum + parseFloat(q.time), 0).toFixed(3);
            const count = groupQueries.length;

            content += `<div style="margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">`;
            content += `<span style="color: #0C4B33; font-weight: bold;">${totalTime}s</span>`;

            if (count > 1) {
                content += `<span style="color: #dc2626; font-weight: bold; margin-left: 8px;">${count} Similar</span>`;
            }

            content += `</div>`;

            // Show templated query if Alt is pressed or if there are similarities
            const queryToShow = (forceTemplated || count > 1) ? template : groupQueries[0].sql;
            content += `<pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0; color: #333;">${escapeHtml(queryToShow)}</pre>`;

            groupIndex++;
        });

        return content;
    }

    function showQueryPopup(lineNumber, x, y) {
        const popup = createQueryPopup();
        const queries = lineToQueryMap.get(lineNumber);

        if (!queries || queries.length === 0) {
            hideQueryPopup();
            return;
        }

        // Group queries by template
        const templateGroups = new Map();
        queries.forEach(query => {
            const template = query.template || query.sql;
            if (!templateGroups.has(template)) {
                templateGroups.set(template, []);
            }
            templateGroups.get(template).push(query);
        });

        // Store current popup data for alt-key toggling
        currentPopupData = { lineNumber, x, y, templateGroups };

        // Generate content based on Alt key state
        const content = generatePopupContent(templateGroups, isAltPressed);
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
        currentPopupData = null;
    }

    function updatePopupContent() {
        if (!currentPopupData || !queryPopup || queryPopup.style.display === 'none') {
            return;
        }

        const content = generatePopupContent(currentPopupData.templateGroups, isAltPressed);
        queryPopup.innerHTML = content;
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

        // Add Alt key listeners to toggle between templated and actual queries
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Alt' && !isAltPressed) {
                isAltPressed = true;
                updatePopupContent();
            }
        });

        document.addEventListener('keyup', function(e) {
            if (e.key === 'Alt' && isAltPressed) {
                isAltPressed = false;
                updatePopupContent();
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

        queries.innerHTML = '';
        lineToQueryMap.clear();

        if (filtered.length === 0) {
            queries.innerHTML = '<span class="p-2 text-sm">No queries</span>';
            updateQueryMarkers();
            return;
        }

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
