# Frontend Rewrite Plan

## Decisions

| Decision | Choice |
|----------|--------|
| Framework | **React** |
| State Management | **Built-in** (useState, useReducer, Context) |
| Django Data | **API-only** (remove json_script, fetch everything) |
| TypeScript | **No** (plain JavaScript) |
| Testing | **Later** (defer to post-launch) |

---

## Current Feature Inventory

### 1. Code Editor (CodeMirror 6)

| Feature | Location | Complexity |
|---------|----------|------------|
| Python syntax highlighting | main.js:11-18, 314 | Low |
| Custom keyword colors (Django green theme) | main.js:11-18 | Low |
| Line numbers | main.js:304 | Low |
| Active line highlighting | main.js:305, 313 | Low |
| History (undo/redo) | main.js:307 | Low |
| Multiple selections | main.js:310-312 | Low |
| Tab indentation (4 spaces) | main.js:329-330 | Low |
| Keyboard shortcuts: Cmd/Ctrl+Enter to execute | main.js:273-288 | Medium |
| Keyboard shortcuts: Shift+Cmd/Ctrl+Enter to force refresh | main.js:281-287 | Medium |
| Query line gutter markers (● or count) | main.js:21-70 | High |
| Query hover popup on mouse move | main.js:1175-1225, 1249-1271 | High |
| Alt-key toggle for templated vs actual queries | main.js:1146-1173, 1273-1285 | Medium |
| Click-to-navigate from query to line | main.js:1030-1056 | Medium |
| Bidirectional sync: cursor position highlights query | main.js:291-298, 1058-1098 | High |

### 2. Query Display & Filtering

| Feature | Location | Complexity |
|---------|----------|------------|
| Collapsible query list | main.js:1342-1384 | Medium |
| Query type badges (SELECT, INSERT, UPDATE, DELETE, DDL, TCL) | main.js:1289-1303, 1343-1344 | Low |
| Execution time display | main.js:1363 | Low |
| SQL syntax highlighting in results | main.js:1012-1028 | Medium |
| Filter by query type (toggle buttons) | main.js:1000-1006, index.html:274-342 | Medium |
| Reverse order toggle | main.js:1322, index.html:335-341 | Low |
| Query count display | main.js:374, 457 | Low |
| Line number links (L42) | main.js:1349-1350, 1386-1394 | Low |
| Query highlight animation (3s fade) | main.js:1093-1098 | Low |
| Copy all queries button | main.js:200-202 | Low |

### 3. Output Section

| Feature | Location | Complexity |
|---------|----------|------------|
| Collapsible output panel | index.html:222-241 | Low |
| Pre-formatted output display | main.js:362-363 | Low |
| Copy output button | main.js:199 | Low |
| "No output" placeholder | main.js:363 | Low |

### 4. Returned Data Tables

| Feature | Location | Complexity |
|---------|----------|------------|
| Dynamic table generation from JSON | main.js:1419-1461 | Medium |
| Multiple named datasets | main.js:1476-1486 | Medium |
| Collapsible sections per dataset | main.js:1489-1516 | Low |
| Copy table data (TSV format) | main.js:1501-1514 | Low |
| Auto-detect array of objects | main.js:1420, 1469-1470 | Low |

### 5. HTML Template Preview

| Feature | Location | Complexity |
|---------|----------|------------|
| Modal dialog for HTML output | main.js:377-380, index.html:381-390 | Low |
| Iframe sandbox rendering | index.html:389 | Low |
| "Show Template" link | main.js:380, 939-941 | Low |

### 6. ERD (Entity Relationship Diagram)

| Feature | Location | Complexity |
|---------|----------|------------|
| Kroki.io mermaid diagram link | main.js:365-370 | Low |
| Conditional visibility | main.js:366-367, 461-462 | Low |

### 7. Settings Panel

| Feature | Location | Complexity |
|---------|----------|------------|
| Toggle visibility | index.html:17-19, 64-112 | Low |
| No-cache checkbox | main.js:486, index.html:67-70 | Low |
| Database selector dropdown | main.js:487, 532-534, index.html:73-77 | Low |
| Template selector dropdown | main.js:244-265, 922-930, index.html:80-85 | Medium |
| ORM version selector | main.js:522-529, index.html:90-94 | Medium |
| Version label in editor (clickable) | main.js:212-242, index.html:208-212 | Low |

### 8. GitHub Ref Selection (PR/Branch/Tag)

| Feature | Location | Complexity |
|---------|----------|------------|
| Modal dialog with tabs | main.js:536-567, index.html:115-199 | Medium |
| PR search with debounce | main.js:569-601, 720-721 | Medium |
| Branch search with debounce | main.js:724-725 | Medium |
| Tag search with debounce | main.js:728-729 | Medium |
| Search result rendering | main.js:603-716 | High |
| Cached badge indicator | main.js:610-612, 682-684 | Low |
| PR state (open/closed) display | main.js:614-617, 694-698 | Low |
| Author display | main.js:629, 701-703 | Low |
| SHA display (truncated) | main.js:642, 705 | Low |
| Click to select from results | main.js:650-716 | Medium |
| Fetch button for direct lookup | main.js:765-848, 850-880 | Medium |
| "Use this version" confirmation | main.js:884-911 | Low |
| Clear selected ref | main.js:914-919 | Low |
| Selected ref indicator badge | main.js:904-907, index.html:97-102 | Low |

### 9. Save & Share

| Feature | Location | Complexity |
|---------|----------|------------|
| Share dialog modal | index.html:392-425 | Low |
| Optional title input | main.js:954, index.html:402-406 | Low |
| Private checkbox | main.js:956, index.html:410-412 | Low |
| Save button | main.js:997 | Low |
| Save & Copy button (copies URL) | main.js:998, 982-984 | Low |
| Error display | main.js:990-993, index.html:407 | Low |
| URL update via pushState | main.js:987 | Low |

### 10. Journey Navigation (Learning Paths)

| Feature | Location | Complexity |
|---------|----------|------------|
| Collapsible journey sidebar | main.js:1519-1554, index.html:36-40 | Medium |
| Lazy loading of journeys | main.js:412-434 | Low |
| Journey list with expandable chapters | main.js:1522-1551 | Medium |
| Chapter click to load content | main.js:1556-1574 | Low |
| URL-based navigation (/j/slug#chapter) | main.js:1587-1590, 1592-1665 | Medium |
| Browser back/forward support | main.js:1667-1677 | Medium |
| Auto-expand current journey on load | main.js:1610-1620, 1632-1642 | Low |
| Highlight current chapter | main.js:1565-1566, 1613, 1635 | Low |

### 11. Dark Mode

| Feature | Location | Complexity |
|---------|----------|------------|
| Toggle button | main.js:112-114, 132-137 | Low |
| localStorage persistence | main.js:116, 133-136 | Low |
| HTML class toggling | main.js:118-127 | Low |
| CodeMirror dark theme | styles.css:60-122 | Medium |
| Query highlight dark variants | styles.css:96-122 | Low |
| Tailwind dark: classes throughout | index.html (throughout) | N/A |

### 12. Responsive Design

| Feature | Location | Complexity |
|---------|----------|------------|
| Mobile Code/Result tabs | index.html:45-62 | Low |
| Auto-switch to Result on mobile execute | main.js:478-482 | Low |
| Auto-switch to Code when clicking line link | main.js:1051-1055 | Low |
| Journey nav hidden on mobile | index.html:36 | Low |
| 1024px breakpoint (lg:) | main.js:479, 1051 | N/A |
| Responsive query filter labels | index.html:280-333 | Low |

### 13. Execution

| Feature | Location | Complexity |
|---------|----------|------------|
| Execute button with loading spinner | main.js:453-519, index.html:20-25 | Medium |
| Disable button during execution | main.js:499, 386, 397 | Low |
| Force no-cache option | main.js:284-286, 486 | Low |
| Auto-run on ?run or /run URL | main.js:407-409 | Low |
| Payload construction (code, database, version/ref) | main.js:484-497 | Medium |
| Response handling by event type | main.js:359-404 | Medium |
| Error display (timeout, OOM, network, code error) | main.js:389-399 | Low |

### 14. Utilities

| Feature | Location | Complexity |
|---------|----------|------------|
| CSRF token extraction | main.js:90-103, 109 | Low |
| getCookie helper | main.js:90-103 | Low |
| escapeHtml helper | main.js:1243-1247 | Low |
| Debounce for search | main.js:569-601 | Low |
| Copy to clipboard | main.js:1407, 983 | Low |

### 15. Icons (18 SVG components)

All in `backend/dryorm/templates/components/icons/`:
- cog, play, terminal, info, list, clipboard-copy, reverse
- journey, grid, dryorm, erd, save, search, code
- minus, db, plus, share

### 16. Zen Mode (NEW)

| Feature | Complexity |
|---------|------------|
| Toggle zen mode (keyboard shortcut: Escape or Cmd+.) | Low |
| Hide header/action bar | Low |
| Hide settings panel | Low |
| Hide journey sidebar | Low |
| Hide query filters | Low |
| Hide version label | Low |
| Expand editor to full height | Low |
| Minimal floating run button | Medium |
| Minimal floating result indicator | Medium |
| Smooth transition animation | Low |
| Persist preference in localStorage | Low |
| Exit on Escape key | Low |

**Zen Mode Behavior:**
- Editor takes full screen (minus thin result strip or overlay)
- Floating semi-transparent Run button (bottom-right corner)
- Results appear as slide-in panel from right (or bottom on mobile)
- Query count badge floats near Run button
- Double-tap Escape or click outside to exit
- All chrome fades out with smooth transition

---

## New API Endpoints Required

Since we're going API-only, Django needs to expose:

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/execute` | POST | Run code | Exists |
| `/save` | POST | Save snippet | Exists |
| `/search-refs` | GET | Search PR/branch/tag | Exists |
| `/api/journeys` | GET | Get all journeys | Exists |
| `/api/templates` | GET | Get code templates | **NEW** |
| `/api/databases` | GET | Get database options | **NEW** |
| `/api/orm-versions` | GET | Get ORM version options | **NEW** |
| `/api/snippet/<slug>` | GET | Get snippet data | **NEW** |
| `/api/config` | GET | Get all config (templates, databases, versions) | **NEW (optional, combines above)** |

---

## Component Structure (React)

```
src/
├── index.jsx                     # Entry point, render App
├── App.jsx                       # Root component, layout
├── context/
│   └── AppContext.jsx           # Global state provider
├── hooks/
│   ├── useAppState.js           # App state hook
│   ├── useCodeMirror.js         # Editor hook
│   ├── useApi.js                # API calls hook
│   ├── useDebounce.js           # Debounce hook
│   ├── useLocalStorage.js       # localStorage hook
│   └── useZenMode.js            # Zen mode logic
├── components/
│   ├── Layout/
│   │   ├── Header.jsx           # Top bar with actions
│   │   ├── MobileTabs.jsx       # Code/Result toggle
│   │   └── SplitPane.jsx        # Desktop split view
│   ├── Editor/
│   │   ├── CodeEditor.jsx       # CodeMirror wrapper
│   │   ├── VersionLabel.jsx     # Floating version badge
│   │   └── QueryPopup.jsx       # Hover popup
│   ├── Results/
│   │   ├── ResultPanel.jsx      # Container
│   │   ├── OutputSection.jsx    # Output display
│   │   ├── QueriesSection.jsx   # Query list container
│   │   ├── QueryFilters.jsx     # Filter buttons
│   │   ├── QueryItem.jsx        # Individual query
│   │   └── ReturnedData.jsx     # Data tables
│   ├── Settings/
│   │   └── SettingsPanel.jsx    # All settings
│   ├── Dialogs/
│   │   ├── RefDialog.jsx        # GitHub ref picker
│   │   ├── ShareDialog.jsx      # Save/share
│   │   └── HtmlPreview.jsx      # Template preview
│   ├── Journeys/
│   │   ├── JourneyNav.jsx       # Sidebar
│   │   ├── JourneyList.jsx      # Journey accordion
│   │   └── ChapterItem.jsx      # Chapter link
│   ├── ZenMode/
│   │   ├── ZenModeWrapper.jsx   # Handles zen state
│   │   ├── FloatingControls.jsx # Run button, query count
│   │   └── SlidePanel.jsx       # Results overlay
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Dialog.jsx
│   │   ├── Select.jsx
│   │   ├── Checkbox.jsx
│   │   ├── CopyButton.jsx
│   │   └── Collapsible.jsx
│   └── icons/
│       └── index.jsx            # All 18 icons as components
├── lib/
│   ├── codemirror/
│   │   ├── setup.js             # Editor extensions
│   │   ├── queryGutter.js       # Gutter markers
│   │   └── theme.js             # Custom theme
│   ├── api.js                   # API client
│   └── utils.js                 # Helpers
└── styles/
    └── index.css                # Tailwind + custom CSS
```

---

## State Shape

```javascript
// AppContext state
{
  // UI State
  loading: false,
  showSettings: false,
  showCode: true,        // Mobile toggle
  showResult: false,     // Mobile toggle
  showJourneyNav: false,
  zenMode: false,        // NEW

  // Theme
  darkMode: false,       // From localStorage

  // Editor
  code: '',

  // Execution Results
  rawOutput: '',
  rawQueries: [],
  returnedData: null,
  erdLink: null,
  htmlTemplate: null,
  error: null,

  // Settings
  database: 'postgresql',
  ormVersion: 'django-5.2',
  ignoreCache: false,
  currentRefInfo: null,  // { type, id, sha, title, ... }

  // Config (from API)
  templates: {},
  databases: [],
  ormVersions: [],

  // Journeys
  journeys: {},
  currentJourney: null,
  currentChapter: null,

  // Query UI
  queryFilters: {
    TCL: false,
    DDL: true,
    SELECT: true,
    INSERT: true,
    UPDATE: true,
    DELETE: true,
    reverse: false,
  },

  // Editor-Query linking
  lineToQueryMap: new Map(),
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Day 1)

#### 1.1 Project Setup
- [ ] Create React project with Vite (`npm create vite@latest frontend -- --template react`)
- [ ] Configure Tailwind CSS with Django theme colors
- [ ] Configure Vite build output to `../backend/dryorm/static/dist`
- [ ] Set up ESLint (basic config)
- [ ] Create folder structure

#### 1.2 API Layer
- [ ] Create api.js with fetch wrappers
- [ ] Implement: fetchConfig() - templates, databases, versions
- [ ] Implement: fetchSnippet(slug)
- [ ] Implement: execute(payload)
- [ ] Implement: save(data)
- [ ] Implement: searchRefs(type, query)
- [ ] Implement: fetchJourneys()
- [ ] CSRF token handling

#### 1.3 State & Context
- [ ] Create AppContext with useReducer
- [ ] Define actions: SET_LOADING, SET_RESULTS, SET_CONFIG, etc.
- [ ] Create useAppState hook
- [ ] Create useLocalStorage hook (theme, zen mode)

#### 1.4 Icon Components
- [ ] Create icons/index.jsx with all 18 SVG icons
- [ ] Consistent props: size, className, color

#### 1.5 Common Components
- [ ] Button (variants: primary, secondary, icon)
- [ ] Dialog (modal wrapper with backdrop)
- [ ] Select (styled dropdown)
- [ ] Checkbox
- [ ] CopyButton (with feedback)
- [ ] Collapsible (with animation)

---

### Phase 2: Core Editor (Day 1-2)

#### 2.1 CodeMirror Setup
- [ ] Install @codemirror/* packages
- [ ] Create lib/codemirror/setup.js with base extensions
- [ ] Create lib/codemirror/theme.js (Django green)
- [ ] Create useCodeMirror hook

#### 2.2 CodeEditor Component
- [ ] Mount CodeMirror in container ref
- [ ] Expose getValue/setValue via ref or callback
- [ ] Keyboard shortcuts (Cmd+Enter, Shift+Cmd+Enter)
- [ ] Focus management
- [ ] Cleanup on unmount

#### 2.3 Query Gutter
- [ ] Port QueryLineMarker class
- [ ] Port queryLinesField StateField
- [ ] Port queryLineGutter extension
- [ ] Implement updateQueryMarkers()
- [ ] Wire to lineToQueryMap state

#### 2.4 Query Popup
- [ ] Create QueryPopup component
- [ ] Track mouse position over editor
- [ ] Show popup on query lines
- [ ] Template grouping logic
- [ ] Alt-key toggle
- [ ] Viewport boundary adjustment
- [ ] Hide on mouse leave

#### 2.5 Cursor-Query Sync
- [ ] Listen to cursor position changes
- [ ] Update highlighted query in list
- [ ] Scroll query into view
- [ ] 3-second highlight fade

---

### Phase 3: Results Panel (Day 2)

#### 3.1 ResultPanel Container
- [ ] Create ResultPanel with sections
- [ ] Handle empty states

#### 3.2 OutputSection
- [ ] Collapsible wrapper
- [ ] Pre-formatted output
- [ ] Copy button
- [ ] "No output" placeholder

#### 3.3 QueriesSection
- [ ] Create QueryFilters (7 toggle buttons)
- [ ] Filter logic (by type, reverse)
- [ ] Query count display
- [ ] Create QueryItem component
- [ ] Collapsible query details
- [ ] SQL syntax highlighting (colorize function)
- [ ] Query type badge
- [ ] Execution time
- [ ] Line number link (click to navigate)

#### 3.4 ReturnedData
- [ ] Dynamic table from JSON
- [ ] Multiple named datasets
- [ ] Collapsible sections
- [ ] Copy as TSV

#### 3.5 Other Results
- [ ] ERD link (conditional)
- [ ] HtmlPreview dialog
- [ ] "Show Template" link

---

### Phase 4: Settings & Dialogs (Day 2-3)

#### 4.1 SettingsPanel
- [ ] Toggle visibility from header
- [ ] No-cache checkbox
- [ ] Database selector (from API)
- [ ] Template selector (from API, grouped by ORM)
- [ ] ORM version selector (from API)
- [ ] Auto-update templates when ORM changes
- [ ] VersionLabel component (floating, clickable)

#### 4.2 RefDialog
- [ ] Dialog with three tabs (PR, Branch, Tag)
- [ ] Search input with debounce
- [ ] Search results list
- [ ] Result item (cached badge, state, author, SHA)
- [ ] Click to select
- [ ] Fetch button for direct lookup
- [ ] Status display
- [ ] Use/Cancel buttons
- [ ] Selected ref indicator in settings
- [ ] Clear ref button

#### 4.3 ShareDialog
- [ ] Title input
- [ ] Private checkbox
- [ ] Save button
- [ ] Save & Copy button
- [ ] Error display
- [ ] Success: update URL, close dialog

---

### Phase 5: Layout & Navigation (Day 3)

#### 5.1 App Layout
- [ ] Header with action buttons (Journey, Share, Settings, Run)
- [ ] Loading spinner on Run button
- [ ] SplitPane for desktop (50/50)
- [ ] MobileTabs for mobile (Code/Result toggle)
- [ ] Auto-switch to Result on execute (mobile)

#### 5.2 JourneyNav
- [ ] Sidebar (desktop only)
- [ ] Toggle from header
- [ ] Fetch journeys on first open
- [ ] JourneyList with expandable items
- [ ] ChapterItem with click to load
- [ ] Highlight current chapter
- [ ] URL sync (/j/slug#chapter)
- [ ] Browser back/forward (popstate)

#### 5.3 Dark Mode
- [ ] ThemeToggle button in header
- [ ] Toggle dark class on <html>
- [ ] Persist to localStorage
- [ ] Load preference on mount

---

### Phase 6: Zen Mode (Day 3)

#### 6.1 ZenMode State
- [ ] Add zenMode to context
- [ ] Persist to localStorage
- [ ] Keyboard shortcut: Cmd+. or Escape to toggle

#### 6.2 ZenModeWrapper
- [ ] Conditionally hide: Header, Settings, JourneyNav, QueryFilters, VersionLabel
- [ ] Expand editor to full viewport
- [ ] Smooth fade transition (opacity + transform)

#### 6.3 FloatingControls
- [ ] Semi-transparent Run button (bottom-right)
- [ ] Query count badge
- [ ] Loading spinner integration
- [ ] Click to run

#### 6.4 SlidePanel (Results in Zen Mode)
- [ ] Results slide in from right (desktop) or bottom (mobile)
- [ ] Triggered after execution
- [ ] Compact view: output + queries (collapsed by default)
- [ ] Click outside or swipe to dismiss
- [ ] Can expand to full result view

#### 6.5 Zen Mode Exit
- [ ] Escape key exits
- [ ] Click on floating "exit zen" button
- [ ] Restore all hidden elements with animation

---

### Phase 7: Execution & Integration (Day 3-4)

#### 7.1 Execute Flow
- [ ] Gather payload (code, database, version/ref, ignoreCache)
- [ ] Set loading state
- [ ] Call execute API
- [ ] Handle response by event type
- [ ] Update state: output, queries, returnedData, erd, html
- [ ] Handle errors (display in output)
- [ ] Clear loading state

#### 7.2 Snippet Loading
- [ ] Check URL for slug (not /, not /j/...)
- [ ] Fetch snippet data from API
- [ ] Populate: code, database, version/ref
- [ ] Check for ?run or /run, auto-execute

#### 7.3 Initial Load
- [ ] Fetch config on mount (templates, databases, versions)
- [ ] Apply saved theme preference
- [ ] Apply saved zen mode preference
- [ ] Parse URL for journey or snippet

---

### Phase 8: Polish (Day 4)

#### 8.1 Responsive Verification
- [ ] Mobile tab switching works
- [ ] Auto-switch on execute
- [ ] Auto-switch on line link click
- [ ] Journey nav hidden on mobile
- [ ] Zen mode works on mobile

#### 8.2 Edge Cases
- [ ] Empty code validation (alert)
- [ ] No queries state
- [ ] No output state
- [ ] All error types display correctly
- [ ] Long query lists perform well

#### 8.3 Dark Mode Audit
- [ ] All components render correctly
- [ ] CodeMirror theme matches
- [ ] Query highlights visible
- [ ] Dialogs styled correctly
- [ ] Zen mode controls visible

#### 8.4 Keyboard Shortcuts
- [ ] Cmd+Enter: Execute
- [ ] Shift+Cmd+Enter: Execute (force refresh)
- [ ] Cmd+.: Toggle Zen Mode
- [ ] Escape: Exit Zen Mode (if in zen)
- [ ] Alt (hold): Show templated queries in popup

#### 8.5 Animations
- [ ] Zen mode enter/exit transitions
- [ ] Query highlight fade (3s)
- [ ] Collapsible expand/collapse
- [ ] Dialog open/close
- [ ] Loading spinner

---

## Django Backend Changes Required

### New API Endpoints

```python
# views.py additions

def api_config(request):
    """Returns templates, databases, and ORM versions"""
    return JsonResponse({
        'templates': get_all_templates(),
        'databases': get_database_options(),
        'ormVersions': get_orm_versions(),
    })

def api_snippet(request, slug):
    """Returns snippet data for loading"""
    snippet = get_object_or_404(Snippet, slug=slug)
    return JsonResponse({
        'code': snippet.code,
        'database': snippet.database,
        'ormVersion': snippet.orm_version,
        'refType': snippet.ref_type,
        'refId': snippet.ref_id,
        'refSha': snippet.ref_sha,
        'name': snippet.name,
    })
```

### Template Changes

```html
<!-- base.html - simplified -->
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="{% static 'dist/styles.css' %}">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="{% static 'dist/main.js' %}"></script>
</body>
</html>
```

Remove all Alpine.js directives, json_script blocks, and inline HTML from index.html. The React app handles everything.

---

## Feature Complexity Summary

| Complexity | Count | Examples |
|------------|-------|----------|
| Low | 44 | Copy buttons, toggles, badges, icons, basic displays |
| Medium | 20 | Query filtering, dialogs, template system, zen floating controls |
| High | 4 | Query gutter markers, hover popup, cursor sync, search results |

**Estimated Total: 4-5 days** (added zen mode and API migration work)

---

## Risk Areas

1. **CodeMirror Integration** - Custom gutter and popup are complex. Build and test early.

2. **API Migration** - Need to add new endpoints before frontend can work. Plan backend work first.

3. **State Complexity** - lineToQueryMap drives multiple UI updates. Keep flow clean.

4. **Zen Mode UX** - Floating controls need careful positioning. Test on various screen sizes.

5. **Bundle Size** - React + CodeMirror will be larger than current. Monitor and optimize.

---

## Success Criteria

- [ ] All 60+ existing features work identically
- [ ] Zen mode provides distraction-free editing experience
- [ ] No json_script dependencies (pure API)
- [ ] Dark mode works throughout
- [ ] Mobile responsive behavior preserved
- [ ] Bundle size < 500KB gzipped
- [ ] No console errors in production
