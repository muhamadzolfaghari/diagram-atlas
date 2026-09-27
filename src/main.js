import { DIAGRAM_TEMPLATES, getTemplateById } from './components/templates.js';
import { CanvasController } from './components/canvas.js';
import { EditorController } from './components/editor.js';
import { StorageManager } from './components/storage.js';
import { Exporter } from './components/exporter.js';
import { AIAssistant } from './components/ai-assistant.js';
import { MiniMapController } from './components/minimap.js';
import { initMermaid, renderMermaid, setMermaidTheme } from './utils/mermaid-renderer.js';
import { LandingPageController } from './components/landing.js';
import {
  buttonVariants,
  badgeVariants,
  cardVariants,
  inputVariants,
  createButton,
  createBadge,
  cn,
} from './components/ui/index.js';

// DOM Elements
const $ = (id) => document.getElementById(id);

const stageEl = $('stage');
const canvasEl = $('canvas');
const diagramContainer = $('diagram-container');
const zoomLabelEl = $('zoomLabel');
const fullscreenBtn = $('fullscreenBtn');

const codeEditorEl = $('codeEditor');
const lineNumbersEl = $('lineNumbers');
const statusDotEl = $('statusDot');
const statusTextEl = $('statusText');
const editorStatsEl = $('editorStats');
const diagramTypeBadgeEl = $('diagramTypeBadge');

const diagramTitleInput = $('diagramTitleInput');
const versionTag = $('versionTag');
const savedDotEl = $('savedDot');
const savedLabelEl = $('savedLabel');

const themeSelectEl = $('themeSelect');
const canvasAlertEl = $('canvasAlert');
const alertMessageEl = $('alertMessage');
const alertCloseBtn = $('alertCloseBtn');

const splitterEl = $('splitter');
const editorPaneEl = $('editorPane');
const canvasPaneEl = $('canvasPane');
const mobileTabsEl = $('mobileTabs');

// Sidebar Drawer & Rail
const sidebarDrawer = $('sidebarDrawer');
const aiDrawerContainer = $('aiDrawerContainer');
const templatesDrawerContainer = $('templatesDrawerContainer');
const savedDrawerContainer = $('savedDrawerContainer');

const railFilesBtn = $('railFilesBtn');
const railTemplatesBtn = $('railTemplatesBtn');
const railAiBtn = $('railAiBtn');
const railShortcutsBtn = $('railShortcutsBtn');
const railImportBtn = $('railImportBtn');
const openAiDrawerBtn = $('openAiDrawerBtn');

// Modals & Menus
const exportMenuBtn = $('exportMenuBtn');
const exportDropdown = $('exportDropdown');
const savedModal = $('savedModal');
const shortcutsModal = $('shortcutsModal');
const restoreModal = $('restoreModal');
const versionModal = $('versionModal');
const fileInput = $('fileInput');

// User Profile Popover
const userAvatarBtn = $('userAvatarBtn');
const userProfilePopover = $('userProfilePopover');

// Canvas Dock
const panToolBtn = $('panToolBtn');
const selectToolBtn = $('selectToolBtn');
const minimapToggleBtn = $('minimapToggleBtn');
const gridToggleBtn = $('gridToggleBtn');
const minimapContainer = $('minimapContainer');

// Node Inspector HUD
const nodeInspectorHud = $('nodeInspectorHud');
const nodeHudLabel = $('nodeHudLabel');
const nodeHudLocateBtn = $('nodeHudLocateBtn');
const nodeHudCloseBtn = $('nodeHudCloseBtn');

// State
let activeTemplateId = 'dependency-overview';
let activeDiagramTitle = 'Dependency Tree — Overview';
let canvasCtrl;
let editorCtrl;
let minimapCtrl;
let aiAssistant;
let currentGridStyle = 'dots';
let activeDrawer = null; // 'ai' | 'templates' | 'saved' | null
let viewMode = 'split'; // 'split' | 'canvas' | 'editor'
let currentToolMode = 'pan'; // 'pan' | 'select'
let selectedNodeEl = null;

let currentTemplateFilter = 'all';
let currentTemplateQuery = '';

// Pro Export State (Watermark-Free, Multi-Resolution)
let proExportFormat = 'png';
let proExportScale = 2;
let proExportBg = '#080c14';
let proExportPadding = 32;
let proExportPdf = 'fit';
let currentEmbedType = 'markdown';

// Presentation Mode State (Distraction-Free Zen & Laser Pointer)
let isPresentationMode = false;
let isLaserPointerActive = false;
let presentationBackdropIndex = 0;
const presentationBackdrops = ['', 'stage-oled', 'stage-white'];

// Initialize Application
async function initApp() {
  // 1. Initialize Theme & Storage
  const savedTheme = StorageManager.getTheme();
  if (themeSelectEl) themeSelectEl.value = savedTheme;
  initMermaid(savedTheme);

  currentGridStyle = StorageManager.getGridStyle() || 'dots';
  applyGridStyle(currentGridStyle);

  // 2. Initialize Canvas
  canvasCtrl = new CanvasController({
    stage: stageEl,
    canvas: canvasEl,
    container: diagramContainer,
    zoomLabel: zoomLabelEl,
    fullscreenBtn: fullscreenBtn,
  });

  // 3. Initialize MiniMap
  minimapCtrl = new MiniMapController({
    container: minimapContainer,
    canvasCtrl: canvasCtrl,
    diagramContainer: diagramContainer,
    stage: stageEl,
  });

  // Hook canvas changes into minimap rect update
  const origApply = canvasCtrl.applyTransform.bind(canvasCtrl);
  canvasCtrl.applyTransform = function () {
    origApply();
    if (minimapCtrl) minimapCtrl.updateRect();
  };

  // 4. Initialize Editor
  editorCtrl = new EditorController({
    textarea: codeEditorEl,
    lineNumbersEl: lineNumbersEl,
    statusDot: statusDotEl,
    statusText: statusTextEl,
    statsEl: editorStatsEl,
    typeBadgeEl: diagramTypeBadgeEl,
    onChange: handleCodeChange,
  });

  // 5. Initialize Mermaid AI Assistant
  aiAssistant = new AIAssistant({
    container: aiDrawerContainer,
    onApplyCode: (newCode, promptTitle) => {
      editorCtrl.setValue(newCode);
      if (promptTitle) {
        activeDiagramTitle = promptTitle;
        if (diagramTitleInput) diagramTitleInput.value = promptTitle;
      }
      closeSidebarDrawer();
      setTimeout(() => canvasCtrl.fit(true), 150);
    },
    onInsertCode: (snippet) => {
      editorCtrl.insertSnippet(snippet);
      closeSidebarDrawer();
    },
  });

  // 6. Setup Templates Gallery Drawer
  setupTemplatesDrawer();

  // 7. Load Initial Source
  const storedDraft = StorageManager.getDraft();
  const storedTplId = StorageManager.getActiveTemplateId();
  if (storedTplId && getTemplateById(storedTplId)) {
    activeTemplateId = storedTplId;
    activeDiagramTitle = getTemplateById(storedTplId).title;
  }
  if (diagramTitleInput) {
    diagramTitleInput.value = activeDiagramTitle;
  }

  if (storedDraft) {
    editorCtrl.setValue(storedDraft);
  } else {
    loadTemplate(activeTemplateId, false);
  }

  // 8. Setup Subsystems
  setupNodeInspector();
  setupVersionHistory();
  setupUserProfile();

  // 9. Bind UI Events & Interactions
  bindUIEvents();
  setupSplitter();
  setupMobileTabs();

  // 10. Initialize Landing Page Controller
  const landingCtrl = new LandingPageController({
    landingViewEl: $('landingView'),
    studioAppEl: $('app'),
    onLaunchStudio: (templateId) => {
      if (templateId) {
        loadTemplate(templateId, true);
      } else {
        setTimeout(() => {
          if (canvasCtrl) {
            canvasCtrl.measure();
            canvasCtrl.fit(false);
          }
          if (minimapCtrl) minimapCtrl.update();
        }, 120);
      }
    },
  });

  // Initial minimap sync
  setTimeout(() => {
    if (minimapCtrl) minimapCtrl.update();
  }, 300);
}

// Template Handling & Filter
function setupTemplatesDrawer() {
  renderTemplatesList();

  const searchInput = $('templatesSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentTemplateQuery = e.target.value.toLowerCase().trim();
      renderTemplatesList();
    });
  }

  const chips = document.querySelectorAll('.tpl-filter-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentTemplateFilter = chip.dataset.filter;
      renderTemplatesList();
    });
  });
}

function renderTemplatesList() {
  const container = $('templatesList');
  if (!container) return;
  container.innerHTML = '';

  const filtered = DIAGRAM_TEMPLATES.filter((tpl) => {
    const matchesFilter = currentTemplateFilter === 'all' || tpl.category.toLowerCase().includes(currentTemplateFilter.toLowerCase());
    const matchesQuery = !currentTemplateQuery || 
      tpl.title.toLowerCase().includes(currentTemplateQuery) || 
      tpl.description.toLowerCase().includes(currentTemplateQuery) || 
      tpl.kind.toLowerCase().includes(currentTemplateQuery);
    return matchesFilter && matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="diagram-empty-state">No templates match your search.</div>';
    return;
  }

  const categories = {};
  filtered.forEach((tpl) => {
    if (!categories[tpl.category]) {
      categories[tpl.category] = [];
    }
    categories[tpl.category].push(tpl);
  });

  Object.entries(categories).forEach(([categoryName, items]) => {
    const catHeader = document.createElement('div');
    catHeader.style.cssText = 'font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin: 12px 0 6px 0; letter-spacing: 0.05em;';
    catHeader.textContent = categoryName;
    container.appendChild(catHeader);

    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = cn(cardVariants({ variant: 'interactive', padding: 'sm' }), 'diagram-item');
      card.style.cursor = 'pointer';
      const kindBadgeClass = badgeVariants({ variant: 'ai', size: 'sm' });
      card.innerHTML = `
        <div class="diagram-item-info">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="${kindBadgeClass}">${item.kind}</span>
            <span class="diagram-item-name font-medium text-foreground">${escapeHtml(item.title)}</span>
          </div>
          <div class="diagram-item-date" style="margin-top: 4px;">${escapeHtml(item.description)}</div>
        </div>
      `;
      card.addEventListener('click', () => {
        loadTemplate(item.id, true);
        closeSidebarDrawer();
      });
      container.appendChild(card);
    });
  });
}

function loadTemplate(templateId, shouldFit = true) {
  const tpl = getTemplateById(templateId);
  activeTemplateId = tpl.id;
  activeDiagramTitle = tpl.title;
  if (diagramTitleInput) {
    diagramTitleInput.value = activeDiagramTitle;
  }
  editorCtrl.setValue(tpl.code);
  StorageManager.saveDraft(tpl.code, tpl.id);

  if (shouldFit) {
    setTimeout(() => {
      canvasCtrl.fit(true);
    }, 120);
  }
}

// Rendering & Error Management
async function handleCodeChange(code) {
  if (!code || !code.trim()) {
    editorCtrl.setStatus('rendering', 'Empty editor');
    setSavedIndicator(true);
    return;
  }

  setSavedIndicator(false);
  editorCtrl.setStatus('rendering', 'Rendering…');
  const startTime = performance.now();
  const result = await renderMermaid(diagramContainer, code);
  const duration = Math.round(performance.now() - startTime);

  if (result.aborted) return;

  if (result.success) {
    hideAlert();
    editorCtrl.setStatus('', `Rendered (${duration}ms)`);
    setSavedIndicator(true);
    StorageManager.saveDraft(code, activeTemplateId);
    canvasCtrl.measure();
    if (minimapCtrl) minimapCtrl.update();
  } else {
    showAlert(result.error);
    editorCtrl.setStatus('error', 'Syntax error');
    setSavedIndicator(true);
  }
}

function setSavedIndicator(isSaved) {
  if (savedDotEl && savedLabelEl) {
    if (isSaved) {
      savedDotEl.className = 'saved-dot';
      savedLabelEl.textContent = 'Saved';
    } else {
      savedDotEl.className = 'saved-dot saving';
      savedLabelEl.textContent = 'Editing…';
    }
  }
}

function showAlert(msg) {
  alertMessageEl.textContent = msg;
  canvasAlertEl.className = 'canvas-alert error show';
}

function hideAlert() {
  canvasAlertEl.className = 'canvas-alert error';
}

// Visual Options
function applyGridStyle(style) {
  stageEl.classList.remove('grid-lines', 'grid-none');
  if (style === 'lines') stageEl.classList.add('grid-lines');
  else if (style === 'none') stageEl.classList.add('grid-none');
}

// Sidebar Drawer Control
function toggleSidebarDrawer(drawerName) {
  if (activeDrawer === drawerName) {
    closeSidebarDrawer();
    return;
  }

  activeDrawer = drawerName;
  sidebarDrawer.classList.add('open');

  // Update rail buttons
  [railFilesBtn, railTemplatesBtn, railAiBtn].forEach((btn) => btn?.classList.remove('active'));

  aiDrawerContainer.style.display = 'none';
  templatesDrawerContainer.style.display = 'none';
  savedDrawerContainer.style.display = 'none';

  if (drawerName === 'ai') {
    aiDrawerContainer.style.display = 'flex';
    railAiBtn?.classList.add('active');
    setTimeout(() => $('aiPromptText')?.focus(), 150);
  } else if (drawerName === 'templates') {
    templatesDrawerContainer.style.display = 'flex';
    railTemplatesBtn?.classList.add('active');
  } else if (drawerName === 'saved') {
    savedDrawerContainer.style.display = 'flex';
    railFilesBtn?.classList.add('active');
    refreshDrawerSavedList();
  }
}

function closeSidebarDrawer() {
  activeDrawer = null;
  sidebarDrawer.classList.remove('open');
  [railFilesBtn, railTemplatesBtn, railAiBtn].forEach((btn) => btn?.classList.remove('active'));
}

// Layout View Switcher
function setViewMode(mode) {
  viewMode = mode;
  $('viewSplitBtn').classList.toggle('active', mode === 'split');
  $('viewCanvasBtn').classList.toggle('active', mode === 'canvas');
  $('viewEditorBtn').classList.toggle('active', mode === 'editor');

  if (mode === 'split') {
    editorPaneEl.style.display = 'flex';
    editorPaneEl.style.width = 'var(--editor-width)';
    canvasPaneEl.style.display = 'flex';
    splitterEl.style.display = 'block';
    setTimeout(() => canvasCtrl.applyTransform(), 50);
  } else if (mode === 'canvas') {
    editorPaneEl.style.display = 'none';
    canvasPaneEl.style.display = 'flex';
    splitterEl.style.display = 'none';
    setTimeout(() => {
      canvasCtrl.applyTransform();
      canvasCtrl.fit(false);
    }, 50);
  } else if (mode === 'editor') {
    editorPaneEl.style.display = 'flex';
    editorPaneEl.style.width = '100%';
    canvasPaneEl.style.display = 'none';
    splitterEl.style.display = 'none';
  }
}

// Interactive Node Inspector (Select Tool)
function setupNodeInspector() {
  panToolBtn.addEventListener('click', () => {
    currentToolMode = 'pan';
    panToolBtn.classList.add('active');
    selectToolBtn.classList.remove('active');
    stageEl.classList.remove('select-mode');
    clearSelectedNode();
  });

  selectToolBtn.addEventListener('click', () => {
    currentToolMode = 'select';
    selectToolBtn.classList.add('active');
    panToolBtn.classList.remove('active');
    stageEl.classList.add('select-mode');
  });

  // Clicking on canvas in select mode
  diagramContainer.addEventListener('click', (e) => {
    if (currentToolMode !== 'select') return;

    const nodeEl = e.target.closest('.node, [class*="node"], .actor');
    if (!nodeEl) {
      clearSelectedNode();
      return;
    }

    e.stopPropagation();
    selectNode(nodeEl);
  });

  nodeHudCloseBtn?.addEventListener('click', clearSelectedNode);

  nodeHudLocateBtn?.addEventListener('click', () => {
    if (!selectedNodeEl) return;
    const label = getNodeText(selectedNodeEl);
    locateTextInEditor(label);
  });
}

function selectNode(nodeEl) {
  clearSelectedNode();
  selectedNodeEl = nodeEl;
  selectedNodeEl.classList.add('selected-node');

  const label = getNodeText(nodeEl);
  if (nodeInspectorHud && nodeHudLabel) {
    nodeHudLabel.textContent = label;
    nodeInspectorHud.style.display = 'flex';
  }
}

function clearSelectedNode() {
  if (selectedNodeEl) {
    selectedNodeEl.classList.remove('selected-node');
    selectedNodeEl = null;
  }
  if (nodeInspectorHud) {
    nodeInspectorHud.style.display = 'none';
  }
}

function getNodeText(nodeEl) {
  const labelEl = nodeEl.querySelector('.nodeLabel, text');
  let text = labelEl ? labelEl.textContent.trim() : nodeEl.textContent.trim();
  if (!text) {
    text = nodeEl.id ? nodeEl.id.replace(/^flowchart-|-[\d]+$/g, '') : 'Node';
  }
  return text;
}

function locateTextInEditor(text) {
  if (!text) return;
  const code = editorCtrl.getValue();
  let idx = code.indexOf(text);
  if (idx === -1) {
    const firstWord = text.split(/[\s\[\(\{]+/)[0];
    if (firstWord) idx = code.indexOf(firstWord);
  }

  if (idx !== -1) {
    // If in canvas-only view, switch to split view so editor is visible
    if (viewMode === 'canvas') {
      setViewMode('split');
    }
    codeEditorEl.focus();
    codeEditorEl.setSelectionRange(idx, idx + text.length);
    const linesBefore = code.substring(0, idx).split('\n').length;
    const lineHeight = 21;
    codeEditorEl.scrollTop = Math.max(0, (linesBefore - 4) * lineHeight);
    editorCtrl.updateStats();
  }
}

// Version History & Snapshots
function setupVersionHistory() {
  versionTag?.addEventListener('click', () => {
    refreshVersionList();
    openModal('versionModal');
  });

  const saveSnapshotBtn = $('saveSnapshotBtn');
  const newSnapshotLabel = $('newSnapshotLabel');

  saveSnapshotBtn?.addEventListener('click', () => {
    const list = StorageManager.getSnapshots();
    const val = newSnapshotLabel.value.trim() || `v0.${list.length + 1}`;
    StorageManager.saveSnapshot(val, activeDiagramTitle, editorCtrl.getValue());
    newSnapshotLabel.value = '';
    versionTag.textContent = val.split(' ')[0];
    refreshVersionList();
    updateProfileStats();
  });
}

function refreshVersionList() {
  const container = $('versionListContainer');
  if (!container) return;
  const list = StorageManager.getSnapshots();
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div class="diagram-empty-state">No version snapshots saved yet. Create a snapshot above to preserve the current state.</div>';
    return;
  }

  list.forEach((item) => {
    const row = document.createElement('div');
    row.className = cn(cardVariants({ variant: 'interactive', padding: 'sm' }), 'version-item');

    const left = document.createElement('div');
    left.className = 'version-item-left flex items-center gap-3';

    const tagSpan = document.createElement('span');
    tagSpan.className = badgeVariants({ variant: 'outline', size: 'sm' });
    tagSpan.textContent = item.version;

    const info = document.createElement('div');
    info.className = 'version-info';
    info.innerHTML = `
      <span class="version-title font-medium text-foreground">${escapeHtml(item.title)}</span>
      <span class="version-time text-xs text-muted-foreground">${new Date(item.createdAt).toLocaleString()}</span>
    `;

    left.appendChild(tagSpan);
    left.appendChild(info);

    const right = document.createElement('div');
    right.className = 'flex items-center gap-2';

    const restoreBtn = createButton({
      variant: 'default',
      size: 'xs',
      content: 'Restore',
      onClick: () => {
        editorCtrl.setValue(item.code);
        activeDiagramTitle = item.title;
        if (diagramTitleInput) diagramTitleInput.value = item.title;
        if (versionTag) versionTag.textContent = item.version.split(' ')[0];
        closeModal('versionModal');
        setTimeout(() => canvasCtrl.fit(true), 120);
      },
    });

    const deleteBtn = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      className: 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
      content: '🗑️',
      attributes: { title: 'Delete snapshot' },
      onClick: () => {
        StorageManager.deleteSnapshot(item.id);
        refreshVersionList();
        updateProfileStats();
      },
    });

    right.appendChild(restoreBtn);
    right.appendChild(deleteBtn);

    row.appendChild(left);
    row.appendChild(right);
    container.appendChild(row);
  });
}

// User Profile Popover
function setupUserProfile() {
  userAvatarBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = userProfilePopover.style.display === 'flex';
    userProfilePopover.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) updateProfileStats();
  });

  document.addEventListener('click', (e) => {
    if (userProfilePopover && !userProfilePopover.contains(e.target) && e.target !== userAvatarBtn) {
      userProfilePopover.style.display = 'none';
    }
  });

  $('popoverViewSavedBtn')?.addEventListener('click', () => {
    userProfilePopover.style.display = 'none';
    refreshSavedList();
    openModal('savedModal');
  });

  $('popoverShortcutsBtn')?.addEventListener('click', () => {
    userProfilePopover.style.display = 'none';
    openModal('shortcutsModal');
  });

  updateProfileStats();
}

function updateProfileStats() {
  const savedCount = StorageManager.getSavedDiagrams().length;
  const snapshotCount = StorageManager.getSnapshots().length;
  if ($('statSavedCount')) $('statSavedCount').textContent = savedCount;
  if ($('statSnapshotCount')) $('statSnapshotCount').textContent = snapshotCount;
}

// UI Event Bindings
function bindUIEvents() {
  // Breadcrumb Title Rename
  diagramTitleInput.addEventListener('change', () => {
    const val = diagramTitleInput.value.trim() || 'Untitled Diagram';
    activeDiagramTitle = val;
    StorageManager.saveDraft(editorCtrl.getValue(), activeTemplateId);
  });

  // View Switcher Buttons
  $('viewSplitBtn').addEventListener('click', () => setViewMode('split'));
  $('viewCanvasBtn').addEventListener('click', () => setViewMode('canvas'));
  $('viewEditorBtn').addEventListener('click', () => setViewMode('editor'));

  // Left Rail & Drawer Buttons
  railAiBtn.addEventListener('click', () => toggleSidebarDrawer('ai'));
  openAiDrawerBtn.addEventListener('click', () => toggleSidebarDrawer('ai'));
  railTemplatesBtn.addEventListener('click', () => toggleSidebarDrawer('templates'));
  railFilesBtn.addEventListener('click', () => toggleSidebarDrawer('saved'));
  railShortcutsBtn.addEventListener('click', () => openModal('shortcutsModal'));
  railImportBtn.addEventListener('click', () => fileInput.click());

  $('closeAiDrawerBtn')?.addEventListener('click', closeSidebarDrawer);
  $('closeTemplatesDrawerBtn')?.addEventListener('click', closeSidebarDrawer);
  $('closeSavedDrawerBtn')?.addEventListener('click', closeSidebarDrawer);

  $('drawerNewDiagramBtn')?.addEventListener('click', () => {
    activeDiagramTitle = 'New Diagram';
    diagramTitleInput.value = activeDiagramTitle;
    editorCtrl.setValue('flowchart TD\n    Start([Start]) --> Process[Process Task]\n    Process --> Done{{Complete}}');
    closeSidebarDrawer();
    setTimeout(() => canvasCtrl.fit(true), 150);
  });

  // Canvas Dock Island Controls
  $('zoomIn').addEventListener('click', () => canvasCtrl.setZoom(canvasCtrl.zoom * 1.2));
  $('zoomOut').addEventListener('click', () => canvasCtrl.setZoom(canvasCtrl.zoom / 1.2));
  $('zoomLabel').addEventListener('click', () => canvasCtrl.reset(true));
  $('fitBtn').addEventListener('click', () => canvasCtrl.fit(true));
  $('recenterBtn').addEventListener('click', () => canvasCtrl.center(true));
  fullscreenBtn.addEventListener('click', () => canvasCtrl.toggleFullscreen());

  // Minimap Toggle
  minimapToggleBtn.addEventListener('click', () => {
    minimapCtrl.toggle();
    minimapToggleBtn.classList.toggle('active', minimapCtrl.isVisible);
  });

  // Grid Cycle Toggle (Dots -> Lines -> Blank)
  gridToggleBtn.addEventListener('click', () => {
    if (currentGridStyle === 'dots') currentGridStyle = 'lines';
    else if (currentGridStyle === 'lines') currentGridStyle = 'none';
    else currentGridStyle = 'dots';

    StorageManager.setGridStyle(currentGridStyle);
    applyGridStyle(currentGridStyle);
  });

  // Theme Dropdown
  themeSelectEl.addEventListener('change', (e) => {
    const theme = e.target.value;
    StorageManager.setTheme(theme);
    setMermaidTheme(theme);
    handleCodeChange(editorCtrl.getValue());
  });

  alertCloseBtn.addEventListener('click', hideAlert);

  // Editor Actions & Snippets
  $('formatCodeBtn').addEventListener('click', () => {
    editorCtrl.formatCode();
  });

  $('restoreTemplateBtn').addEventListener('click', () => {
    openModal('restoreModal');
  });

  $('confirmRestoreBtn').addEventListener('click', () => {
    closeModal('restoreModal');
    loadTemplate(activeTemplateId, true);
  });

  $('clearEditorBtn').addEventListener('click', () => {
    editorCtrl.setValue('');
  });

  // Snippet Chips
  document.querySelectorAll('.snippet-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      const snippet = btn.dataset.snippet;
      if (snippet) {
        editorCtrl.insertSnippet(`\n${snippet}\n`);
      }
    });
  });

  // Export Menu
  // Export Menu Dropdown Toggle
  exportMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportDropdown.style.display = exportDropdown.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (!exportDropdown.contains(e.target) && e.target !== exportMenuBtn) {
      exportDropdown.style.display = 'none';
    }
  });

  // Pro Export Studio Modal
  $('openProExportBtn')?.addEventListener('click', () => {
    openProExportModal();
  });

  // Direct 1-Click Clipboard Image Copy
  $('copyPngClipboardBtn')?.addEventListener('click', async () => {
    await copyPngToClipboardDirect();
  });

  $('proCopyImageBtn')?.addEventListener('click', async () => {
    await copyPngToClipboardDirect();
  });

  // Standard Direct Exports
  $('exportSvgBtn')?.addEventListener('click', () => {
    try {
      Exporter.downloadSvg(diagramContainer, activeDiagramTitle);
      exportDropdown.style.display = 'none';
    } catch (err) {
      showAlert(err.message);
    }
  });

  $('exportPngBtn')?.addEventListener('click', async () => {
    try {
      editorCtrl.setStatus('rendering', 'Exporting PNG…');
      await Exporter.downloadPng(diagramContainer, activeDiagramTitle, 2);
      editorCtrl.setStatus('', 'Rendered');
      exportDropdown.style.display = 'none';
    } catch (err) {
      editorCtrl.setStatus('error', 'Export error');
      showAlert(err.message);
    }
  });

  // Print-Ready Vector PDF Export
  $('exportPdfBtn')?.addEventListener('click', async () => {
    try {
      editorCtrl.setStatus('rendering', 'Generating PDF…');
      exportDropdown.style.display = 'none';
      await Exporter.downloadPdf(diagramContainer, activeDiagramTitle, {
        pageSize: 'fit',
        background: '#ffffff',
        padding: 32,
      });
      editorCtrl.setStatus('', 'PDF exported!');
      setTimeout(() => editorCtrl.setStatus('', 'Rendered'), 2000);
    } catch (err) {
      editorCtrl.setStatus('error', 'PDF error');
      showAlert(err.message);
    }
  });

  // Standalone Interactive HTML Export
  $('exportHtmlBtn')?.addEventListener('click', () => {
    try {
      exportDropdown.style.display = 'none';
      Exporter.downloadStandaloneHtml(diagramContainer, editorCtrl.getValue(), activeDiagramTitle);
      editorCtrl.setStatus('', 'Standalone HTML exported!');
      setTimeout(() => editorCtrl.setStatus('', 'Rendered'), 2000);
    } catch (err) {
      showAlert(err.message);
    }
  });

  $('downloadMmdBtn')?.addEventListener('click', () => {
    Exporter.downloadSource(editorCtrl.getValue(), activeDiagramTitle);
    exportDropdown.style.display = 'none';
  });

  // Embed & Share Modal
  $('openEmbedModalBtn')?.addEventListener('click', () => {
    openEmbedModal();
  });

  $('copyEmbedCodeBtn')?.addEventListener('click', async () => {
    const text = $('embedCodeTextarea')?.value;
    if (text) {
      await navigator.clipboard.writeText(text);
      const btn = $('copyEmbedCodeBtn');
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<span>✅ Copied!</span>';
        setTimeout(() => { btn.innerHTML = orig; }, 1800);
      }
    }
  });

  // Pro Export Modal Execute Button
  $('proExecuteExportBtn')?.addEventListener('click', executeProExport);

  // Setup Pro Export Studio Chips
  setupProExportChips();
  setupEmbedTabs();

  // Presentation Mode Triggers & HUD Controls
  $('presentBtn')?.addEventListener('click', enterPresentationMode);
  $('exitPresentationBtn')?.addEventListener('click', exitPresentationMode);
  $('laserPointerToggleBtn')?.addEventListener('click', toggleLaserPointer);

  $('presZoomInBtn')?.addEventListener('click', () => {
    canvasCtrl.setZoom(canvasCtrl.zoom * 1.2);
    updatePresentationZoomLabel();
  });

  $('presZoomOutBtn')?.addEventListener('click', () => {
    canvasCtrl.setZoom(canvasCtrl.zoom / 1.2);
    updatePresentationZoomLabel();
  });

  $('presFitBtn')?.addEventListener('click', () => {
    canvasCtrl.fit(false);
    updatePresentationZoomLabel();
  });

  $('presThemeToggleBtn')?.addEventListener('click', () => {
    presentationBackdropIndex = (presentationBackdropIndex + 1) % presentationBackdrops.length;
    document.body.classList.remove('stage-oled', 'stage-white');
    const nextCls = presentationBackdrops[presentationBackdropIndex];
    if (nextCls) document.body.classList.add(nextCls);
  });

  // Track laser pointer cursor
  window.addEventListener('mousemove', (e) => {
    if (isPresentationMode && isLaserPointerActive) {
      const pointer = $('laserPointer');
      if (pointer) {
        pointer.style.left = `${e.clientX}px`;
        pointer.style.top = `${e.clientY}px`;
      }
    }
  });

  // Import File
  fileInput.addEventListener('change', handleFileImport);

  // Drag and drop onto editor
  editorPaneEl.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  editorPaneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      readImportedFile(e.dataTransfer.files[0]);
    }
  });

  // Saved Diagrams Modal Save Button
  $('modalSaveBtn').addEventListener('click', () => {
    const title = $('newDiagramTitle').value.trim() || 'Untitled Diagram';
    StorageManager.saveDiagram(title, editorCtrl.getValue());
    activeDiagramTitle = title;
    diagramTitleInput.value = title;
    refreshSavedList();
    updateProfileStats();
  });

  // Close modals on [data-close] or backdrop click
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      closeModal(btn.dataset.close);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    const isTyping = e.target.matches('input, textarea, [contenteditable="true"]');

    if (e.key === 'Escape') {
      if (isPresentationMode) {
        exitPresentationMode();
        return;
      }
      document.querySelectorAll('.modal-overlay.open').forEach((m) => m.classList.remove('open'));
      exportDropdown.style.display = 'none';
      userProfilePopover.style.display = 'none';
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      $('newDiagramTitle').value = activeDiagramTitle;
      refreshSavedList();
      openModal('savedModal');
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      fileInput.click();
    } else if (e.shiftKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      editorCtrl.formatCode();
    } else if (e.key === '?' && !isTyping) {
      e.preventDefault();
      openModal('shortcutsModal');
    } else if (!isTyping) {
      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (isPresentationMode) exitPresentationMode();
        else enterPresentationMode();
      } else if (e.key.toLowerCase() === 'l' && isPresentationMode) {
        e.preventDefault();
        toggleLaserPointer();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        canvasCtrl.fit(true);
        if (isPresentationMode) updatePresentationZoomLabel();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        canvasCtrl.center(true);
      } else if (e.key === '0') {
        e.preventDefault();
        canvasCtrl.reset(true);
        if (isPresentationMode) updatePresentationZoomLabel();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        canvasCtrl.setZoom(canvasCtrl.zoom * 1.2);
        if (isPresentationMode) updatePresentationZoomLabel();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        canvasCtrl.setZoom(canvasCtrl.zoom / 1.2);
        if (isPresentationMode) updatePresentationZoomLabel();
      }
    }
  });
}

function handleFileImport(e) {
  const file = e.target.files?.[0];
  if (file) {
    readImportedFile(file);
    fileInput.value = '';
  }
}

function readImportedFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const code = event.target.result;
    activeDiagramTitle = file.name.replace(/\.[^/.]+$/, '');
    diagramTitleInput.value = activeDiagramTitle;
    editorCtrl.setValue(code);
    setTimeout(() => canvasCtrl.fit(true), 120);
  };
  reader.readAsText(file);
}

function refreshDrawerSavedList() {
  const container = $('drawerSavedList');
  if (!container) return;
  const diagrams = StorageManager.getSavedDiagrams();
  container.innerHTML = '';

  if (diagrams.length === 0) {
    container.innerHTML = `<div class="diagram-empty-state">No saved diagrams yet. Use the Save button in the editor.</div>`;
    return;
  }

  diagrams.forEach((item) => {
    const row = document.createElement('div');
    row.className = cn(cardVariants({ variant: 'interactive', padding: 'sm' }), 'diagram-item');

    const info = document.createElement('div');
    info.className = 'diagram-item-info';
    info.innerHTML = `
      <div class="diagram-item-name font-medium text-foreground">${escapeHtml(item.title)}</div>
      <div class="diagram-item-date">${new Date(item.updatedAt).toLocaleString()}</div>
    `;
    info.addEventListener('click', () => {
      activeDiagramTitle = item.title;
      diagramTitleInput.value = item.title;
      editorCtrl.setValue(item.code);
      closeSidebarDrawer();
      setTimeout(() => canvasCtrl.fit(true), 100);
    });

    const actions = document.createElement('div');
    actions.className = 'diagram-item-actions';

    const deleteBtn = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      className: 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
      content: '🗑️',
      attributes: { title: 'Delete saved diagram' },
      onClick: (e) => {
        e.stopPropagation();
        StorageManager.deleteDiagram(item.id);
        refreshDrawerSavedList();
        updateProfileStats();
      },
    });

    actions.appendChild(deleteBtn);
    row.appendChild(info);
    row.appendChild(actions);
    container.appendChild(row);
  });
}

function refreshSavedList() {
  const container = $('savedListContainer');
  if (!container) return;
  const diagrams = StorageManager.getSavedDiagrams();
  container.innerHTML = '';

  if (diagrams.length === 0) {
    container.innerHTML = `<div class="diagram-empty-state">No saved diagrams yet. Save your current diagram above!</div>`;
    return;
  }

  diagrams.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'diagram-item';

    const info = document.createElement('div');
    info.className = 'diagram-item-info';
    info.innerHTML = `
      <div class="diagram-item-name">${escapeHtml(item.title)}</div>
      <div class="diagram-item-date">${new Date(item.updatedAt).toLocaleString()}</div>
    `;
    info.addEventListener('click', () => {
      activeDiagramTitle = item.title;
      diagramTitleInput.value = item.title;
      editorCtrl.setValue(item.code);
      closeModal('savedModal');
      setTimeout(() => canvasCtrl.fit(true), 100);
    });

    const actions = document.createElement('div');
    actions.className = 'diagram-item-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'editor-tool-btn';
    deleteBtn.title = 'Delete saved diagram';
    deleteBtn.textContent = '🗑️';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      StorageManager.deleteDiagram(item.id);
      refreshSavedList();
      updateProfileStats();
    });

    actions.appendChild(deleteBtn);
    row.appendChild(info);
    row.appendChild(actions);
    container.appendChild(row);
  });
}

// Splitter Dragging
function setupSplitter() {
  let isDraggingSplitter = false;

  splitterEl.addEventListener('pointerdown', (e) => {
    isDraggingSplitter = true;
    splitterEl.classList.add('dragging');
    splitterEl.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDraggingSplitter) return;
    const activityRailOffset = 50;
    const newWidth = Math.max(260, Math.min(window.innerWidth * 0.75, e.clientX - activityRailOffset));
    document.documentElement.style.setProperty('--editor-width', `${newWidth}px`);
  });

  const stopSplitter = (e) => {
    if (isDraggingSplitter) {
      isDraggingSplitter = false;
      splitterEl.classList.remove('dragging');
      if (splitterEl.hasPointerCapture(e.pointerId)) {
        splitterEl.releasePointerCapture(e.pointerId);
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      canvasCtrl.applyTransform();
    }
  };

  window.addEventListener('pointerup', stopSplitter);
  window.addEventListener('pointercancel', stopSplitter);
}

// Mobile Tab Switcher
function setupMobileTabs() {
  const tabs = mobileTabsEl.querySelectorAll('.mobile-tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;

      if (target === 'editor') {
        editorPaneEl.classList.remove('tab-hidden');
        canvasPaneEl.classList.add('tab-hidden');
      } else {
        editorPaneEl.classList.add('tab-hidden');
        canvasPaneEl.classList.remove('tab-hidden');
        setTimeout(() => canvasCtrl.fit(false), 50);
      }
    });
  });
}

// ==========================================================================
// Pro Export Studio Modal Handlers
// ==========================================================================
function openProExportModal() {
  exportDropdown.style.display = 'none';
  const previewInner = $('proExportPreviewInner');
  const previewBox = $('proExportPreviewBox');
  const svgEl = diagramContainer.querySelector('svg');
  if (!svgEl) {
    showAlert('Please create or render a diagram first.');
    return;
  }

  if (previewBox) {
    previewBox.style.background = proExportBg === 'transparent'
      ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px'
      : proExportBg;
  }

  if (previewInner) {
    previewInner.innerHTML = '';
    const clone = svgEl.cloneNode(true);
    clone.style.maxWidth = '100%';
    clone.style.maxHeight = '200px';
    clone.style.width = 'auto';
    clone.style.height = 'auto';
    previewInner.appendChild(clone);
  }

  updateProExportSpecs();
  openModal('proExportModal');
}

function updateProExportSpecs() {
  const svgEl = diagramContainer.querySelector('svg');
  const box = svgEl?.viewBox?.baseVal;
  const baseW = (box?.width || svgEl?.clientWidth || 1200) + proExportPadding * 2;
  const baseH = (box?.height || svgEl?.clientHeight || 800) + proExportPadding * 2;

  const finalW = Math.round(baseW * proExportScale);
  const finalH = Math.round(baseH * proExportScale);

  if ($('proSpecDimensions')) {
    $('proSpecDimensions').textContent = `${finalW} × ${finalH} px`;
  }
  if ($('proSpecDpi')) {
    const dpi = proExportScale === 1 ? '72 DPI (Web)' : proExportScale === 2 ? '144 DPI (Retina)' : proExportScale === 3 ? '216 DPI (HD Print)' : '300+ DPI (Ultra 4K)';
    $('proSpecDpi').textContent = `${proExportScale}x (${dpi})`;
  }
  if ($('proSpecSize')) {
    const approxKb = Math.round((finalW * finalH * 4) / 45000);
    $('proSpecSize').textContent = `~${Math.max(45, approxKb)} KB`;
  }

  const isRasterOrPdf = ['png', 'webp', 'pdf'].includes(proExportFormat);
  const isPdf = proExportFormat === 'pdf';
  const scaleGroup = $('proScaleOptionGroup');
  const pdfGroup = $('proPdfLayoutGroup');

  if (scaleGroup) scaleGroup.style.display = isRasterOrPdf ? 'block' : 'none';
  if (pdfGroup) pdfGroup.style.display = isPdf ? 'block' : 'none';
}

function setupProExportChips() {
  // Format selection
  document.querySelectorAll('#exportFormatGroup .export-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#exportFormatGroup .export-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      proExportFormat = btn.dataset.format;
      updateProExportSpecs();
    });
  });

  // Scale selection
  document.querySelectorAll('#exportScaleGroup .export-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#exportScaleGroup .export-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      proExportScale = Number(btn.dataset.scale);
      updateProExportSpecs();
    });
  });

  // Background selection
  document.querySelectorAll('#exportBgGroup .export-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#exportBgGroup .export-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      proExportBg = btn.dataset.bg;
      const previewBox = $('proExportPreviewBox');
      if (previewBox) {
        previewBox.style.background = proExportBg === 'transparent'
          ? 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 16px 16px'
          : proExportBg;
      }
      updateProExportSpecs();
    });
  });

  // Padding selection
  document.querySelectorAll('#exportPaddingGroup .export-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#exportPaddingGroup .export-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      proExportPadding = Number(btn.dataset.padding);
      updateProExportSpecs();
    });
  });

  // PDF Page layout selection
  document.querySelectorAll('#exportPdfLayoutSelect .export-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#exportPdfLayoutSelect .export-chip').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      proExportPdf = btn.dataset.pdf;
    });
  });
}

async function executeProExport() {
  try {
    editorCtrl.setStatus('rendering', `Exporting ${proExportFormat.toUpperCase()}…`);
    closeModal('proExportModal');

    if (proExportFormat === 'png') {
      await Exporter.downloadPng(diagramContainer, activeDiagramTitle, {
        scale: proExportScale,
        background: proExportBg,
        padding: proExportPadding,
      });
    } else if (proExportFormat === 'svg') {
      Exporter.downloadSvg(diagramContainer, activeDiagramTitle, {
        background: proExportBg,
        padding: proExportPadding,
      });
    } else if (proExportFormat === 'pdf') {
      await Exporter.downloadPdf(diagramContainer, activeDiagramTitle, {
        pageSize: proExportPdf,
        background: proExportBg,
        padding: proExportPadding,
      });
    } else if (proExportFormat === 'webp') {
      await Exporter.downloadWebp(diagramContainer, activeDiagramTitle, {
        scale: proExportScale,
        background: proExportBg,
        padding: proExportPadding,
      });
    } else if (proExportFormat === 'html') {
      Exporter.downloadStandaloneHtml(diagramContainer, editorCtrl.getValue(), activeDiagramTitle);
    } else if (proExportFormat === 'mmd') {
      Exporter.downloadSource(editorCtrl.getValue(), activeDiagramTitle);
    }

    editorCtrl.setStatus('', 'Export complete!');
    setTimeout(() => editorCtrl.setStatus('', 'Rendered'), 2500);
  } catch (err) {
    editorCtrl.setStatus('error', 'Export failed');
    showAlert(err.message);
  }
}

async function copyPngToClipboardDirect() {
  try {
    editorCtrl.setStatus('rendering', 'Copying image to clipboard…');
    exportDropdown.style.display = 'none';
    closeModal('proExportModal');
    await Exporter.copyImageToClipboard(diagramContainer, {
      scale: proExportScale || 2,
      background: proExportBg || '#080c14',
      padding: proExportPadding || 32,
    });
    editorCtrl.setStatus('', 'Image copied! Ready to paste (Cmd+V)');
    setTimeout(() => editorCtrl.setStatus('', 'Rendered'), 3000);
  } catch (err) {
    editorCtrl.setStatus('error', 'Clipboard error');
    showAlert(err.message || 'Clipboard copy failed. Try standard download.');
  }
}

// ==========================================================================
// Embed & Share Modal Handlers
// ==========================================================================
function openEmbedModal() {
  exportDropdown.style.display = 'none';
  updateEmbedContent();
  openModal('embedModal');
}

function updateEmbedContent() {
  const snippets = Exporter.generateEmbedSnippets(editorCtrl.getValue(), diagramContainer, activeDiagramTitle);
  const textarea = $('embedCodeTextarea');
  const desc = $('embedDescText');
  if (!textarea) return;

  if (currentEmbedType === 'markdown') {
    textarea.value = snippets.markdown;
    if (desc) desc.textContent = 'Paste into GitHub README.md, GitLab, Notion, or GitBook.';
  } else if (currentEmbedType === 'html') {
    textarea.value = snippets.html;
    if (desc) desc.textContent = 'Embed directly into any website, blog, or documentation HTML.';
  } else if (currentEmbedType === 'datauri') {
    textarea.value = snippets.dataUri;
    if (desc) desc.textContent = 'Use as an inline <img src="data:image/svg+xml;utf8,..."> without external image files.';
  } else if (currentEmbedType === 'svg') {
    textarea.value = snippets.svg;
    if (desc) desc.textContent = 'Standard clean XML SVG markup for vector graphics.';
  }
}

function setupEmbedTabs() {
  document.querySelectorAll('#embedTabGroup .ai-engine-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#embedTabGroup .ai-engine-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentEmbedType = tab.dataset.embed;
      updateEmbedContent();
    });
  });
}

// ==========================================================================
// Presentation Mode Handlers (Distraction-Free Zen & Laser Pointer)
// ==========================================================================
function enterPresentationMode() {
  isPresentationMode = true;
  document.body.classList.add('presentation-active');
  const hud = $('presentationHud');
  if (hud) hud.style.display = 'block';

  document.body.classList.remove('stage-oled', 'stage-white');
  presentationBackdropIndex = 0;

  setTimeout(() => {
    canvasCtrl.measure();
    canvasCtrl.fit(false);
    updatePresentationZoomLabel();
  }, 80);
}

function exitPresentationMode() {
  isPresentationMode = false;
  document.body.classList.remove('presentation-active', 'stage-oled', 'stage-white');
  const hud = $('presentationHud');
  if (hud) hud.style.display = 'none';

  disableLaserPointer();
  setTimeout(() => {
    canvasCtrl.measure();
    canvasCtrl.applyTransform();
  }, 80);
}

function toggleLaserPointer() {
  isLaserPointerActive = !isLaserPointerActive;
  const btn = $('laserPointerToggleBtn');
  const pointer = $('laserPointer');
  if (btn) btn.classList.toggle('active', isLaserPointerActive);
  if (pointer) pointer.style.display = isLaserPointerActive ? 'block' : 'none';
}

function disableLaserPointer() {
  isLaserPointerActive = false;
  const btn = $('laserPointerToggleBtn');
  const pointer = $('laserPointer');
  if (btn) btn.classList.remove('active');
  if (pointer) pointer.style.display = 'none';
}

function updatePresentationZoomLabel() {
  const lbl = $('presZoomLabel');
  if (lbl && canvasCtrl) lbl.textContent = `${Math.round(canvasCtrl.zoom * 100)}%`;
}

// Modal Helpers
function openModal(id) {
  const modal = $(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = $(id);
  if (modal) modal.classList.remove('open');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
