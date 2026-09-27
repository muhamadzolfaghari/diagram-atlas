import { parseXmindToMermaid, exportMermaidToXmindBlob, createSampleXmindData } from '../utils/importers/xmind.js';
import { parsePlantUmlToMermaid } from '../utils/importers/plantuml.js';
import { parseDotToMermaid } from '../utils/importers/graphviz.js';
import { parseD2ToMermaid } from '../utils/importers/d2.js';
import { parseSqlDdlToMermaid } from '../utils/importers/sql-ddl.js';
import { parseOutline } from '../utils/importers/markdown-outline.js';
import { parseCsvToMermaid } from '../utils/importers/csv-table.js';
import JSZip from 'jszip';

/**
 * Universal Importer & Multi-Format Converter Modal for Mermaid Studio
 * Provides 100% free, offline client-side support for:
 * - XMind (.xmind) read, import & export
 * - PlantUML sequence/class/state conversion
 * - Graphviz DOT (.dot / .gv) to Flowcharts
 * - D2 Lang (.d2) to Flowcharts
 * - SQL Schema (CREATE TABLE) to ER Diagrams
 * - Markdown Outlines / Notes to Mindmaps & Flowcharts
 * - CSV / Tables to Flowcharts & ER Diagrams
 */

let activeTab = 'xmind';
let lastConvertedCode = '';
let onApplyCallback = null;
let getCurrentCodeCallback = null;

export function initImportModal({ onApply, getCurrentCode }) {
  onApplyCallback = onApply;
  getCurrentCodeCallback = getCurrentCode;

  let modalEl = document.getElementById('importConverterModal');
  if (!modalEl) {
    modalEl = createModalElement();
    document.body.appendChild(modalEl);
    attachEventListeners(modalEl);
  }
}

export function openImportModal(initialTab = 'xmind') {
  const modalEl = document.getElementById('importConverterModal');
  if (!modalEl) return;

  switchTab(initialTab);
  modalEl.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

export function closeImportModal() {
  const modalEl = document.getElementById('importConverterModal');
  if (!modalEl) return;

  modalEl.style.display = 'none';
  document.body.style.overflow = '';
}

function createModalElement() {
  const overlay = document.createElement('div');
  overlay.id = 'importConverterModal';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'none';

  overlay.innerHTML = `
    <div class="modal-card import-modal-card" style="max-width: 900px; width: 94%; max-height: 90vh; display: flex; flex-direction: column;">
      <!-- Header -->
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">📥</span>
          <div>
            <h2 class="modal-title" style="margin: 0; font-size: 18px;">Universal Importer &amp; Diagram Converter</h2>
            <p class="modal-subtitle" style="margin: 2px 0 0; font-size: 12px; color: var(--text-muted);">
              Replace expensive diagram subscriptions. Free, offline &amp; client-side.
            </p>
          </div>
        </div>
        <button id="closeImportModalBtn" class="modal-close-btn" type="button" aria-label="Close Modal">✕</button>
      </div>

      <!-- Tab Navigation -->
      <div class="import-tabs" style="display: flex; gap: 4px; padding: 10px 16px; border-bottom: 1px solid var(--line); background: var(--surface-2); overflow-x: auto;">
        <button class="import-tab-btn active" data-tab="xmind" type="button">
          <span>🧠 XMind</span>
        </button>
        <button class="import-tab-btn" data-tab="plantuml" type="button">
          <span>📐 PlantUML</span>
        </button>
        <button class="import-tab-btn" data-tab="graphviz" type="button">
          <span>🌐 Graphviz DOT</span>
        </button>
        <button class="import-tab-btn" data-tab="d2" type="button">
          <span>⚡ D2 Lang</span>
        </button>
        <button class="import-tab-btn" data-tab="sql" type="button">
          <span>🗄️ SQL Schema</span>
        </button>
        <button class="import-tab-btn" data-tab="outline" type="button">
          <span>📝 Outline</span>
        </button>
        <button class="import-tab-btn" data-tab="csv" type="button">
          <span>📊 CSV Table</span>
        </button>
      </div>

      <!-- Tab Contents -->
      <div class="import-modal-body" style="flex: 1; overflow-y: auto; padding: 18px 20px;">
        <!-- TAB 1: XMIND -->
        <div id="tabContentXmind" class="tab-pane active">
          <div class="xmind-dropzone" id="xmindDropzone" style="border: 2px dashed var(--line); border-radius: 12px; padding: 30px 20px; text-align: center; background: rgba(99, 102, 241, 0.04); cursor: pointer; transition: all .2s ease;">
            <div style="font-size: 38px; margin-bottom: 8px;">🧠</div>
            <h3 style="margin: 0 0 6px; font-size: 16px;">Drop your .xmind file here</h3>
            <p style="margin: 0 0 16px; font-size: 13px; color: var(--text-muted); max-width: 600px; margin-left: auto; margin-right: auto;">
              Supports modern XMind (.xmind / ZEN JSON) and legacy XMind 8 XML. Automatically converts topics into interactive Mermaid Mindmaps.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
              <button id="browseXmindBtn" class="btn btn-primary" type="button">
                <span>📁 Select .xmind File</span>
              </button>
              <button id="demoXmindBtn" class="btn btn-secondary" type="button">
                <span>⚡ Load Sample Architecture</span>
              </button>
              <button id="exportCurrentToXmindBtn" class="btn btn-secondary" type="button" title="Save your current Mermaid Mindmap as an actual .xmind file">
                <span>💾 Export to .xmind</span>
              </button>
            </div>
            <input type="file" id="xmindFileInput" accept=".xmind" style="display: none;" />
          </div>
        </div>

        <!-- TAB 2: PLANTUML -->
        <div id="tabContentPlantuml" class="tab-pane" style="display: none;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
            Paste PlantUML Sequence, Class, or State Code:
          </label>
          <textarea id="plantumlInput" spellcheck="false" style="width: 100%; height: 150px; font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); resize: vertical;">@startuml
autonumber
actor Client
participant "API Gateway" as Gateway
participant "Auth Service" as Auth
database "User DB" as DB

Client -> Gateway: POST /api/v1/auth/login
Gateway -> Auth: Verify Credentials
Auth -> DB: Query User Hash
DB --> Auth: Return Hash & Salt
Auth --> Gateway: 200 OK + JWT Token
Gateway --> Client: Bearer Token Response
@enduml</textarea>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
            <button id="convertPlantumlBtn" class="btn btn-primary" type="button">
              <span>Convert to Mermaid ↵</span>
            </button>
          </div>
        </div>

        <!-- TAB 3: GRAPHVIZ DOT -->
        <div id="tabContentGraphviz" class="tab-pane" style="display: none;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
            Paste Graphviz DOT (.dot / .gv) Directed Graph:
          </label>
          <textarea id="graphvizInput" spellcheck="false" style="width: 100%; height: 150px; font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); resize: vertical;">digraph DistributedSystem {
  rankdir=LR;
  EdgeRouter [label="Cloud Edge Router"];
  AuthCluster [label="OAuth2 Cluster"];
  KafkaBus [label="Event Streaming Bus"];
  Database [label="Postgres Master"];

  EdgeRouter -> AuthCluster [label="Verify JWT"];
  AuthCluster -> KafkaBus [label="Publish Audit"];
  KafkaBus -> Database [label="Sync Commit"];
}</textarea>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
            <button id="convertGraphvizBtn" class="btn btn-primary" type="button">
              <span>Convert DOT to Mermaid ↵</span>
            </button>
          </div>
        </div>

        <!-- TAB 4: D2 LANG -->
        <div id="tabContentD2" class="tab-pane" style="display: none;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
            Paste D2 Declarative Diagram Code:
          </label>
          <textarea id="d2Input" spellcheck="false" style="width: 100%; height: 150px; font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); resize: vertical;">direction: right

client: "Web Browser (Client)"
cdn: "Cloudflare Edge"
app: "Node.js Application"
db: "Distributed Storage"

client -> cdn: Request Assets
cdn -> app: Cache Miss
app -> db: Read Record
app -> client: JSON Payload</textarea>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
            <button id="convertD2Btn" class="btn btn-primary" type="button">
              <span>Convert D2 to Mermaid ↵</span>
            </button>
          </div>
        </div>

        <!-- TAB 5: SQL SCHEMA -->
        <div id="tabContentSql" class="tab-pane" style="display: none;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
            Paste SQL DDL (CREATE TABLE Statements):
          </label>
          <textarea id="sqlInput" spellcheck="false" style="width: 100%; height: 150px; font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); resize: vertical;">CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total DECIMAL(10,2),
  status VARCHAR(20)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT,
  quantity INT
);</textarea>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
            <button id="convertSqlBtn" class="btn btn-primary" type="button">
              <span>Generate ER Diagram ↵</span>
            </button>
          </div>
        </div>

        <!-- TAB 6: OUTLINE -->
        <div id="tabContentOutline" class="tab-pane" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 600; color: var(--text-muted);">
              Paste Bullet Outline or Indented Notes:
            </label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; color: var(--text-muted);">Target:</span>
              <select id="outlineTargetSelect" class="theme-dropdown-select" style="padding: 4px 8px; font-size: 12px;">
                <option value="mindmap">Mermaid Mindmap</option>
                <option value="flowchart">Mermaid Flowchart</option>
              </select>
            </div>
          </div>
          <textarea id="outlineInput" spellcheck="false" style="width: 100%; height: 150px; font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); resize: vertical;">Product Architecture
- Discovery & Research
  - Customer Interviews
  - Competitor R&D
- Architecture & Platform
  - WebLLM AI Assistant
  - Vector PDF & 4K PNG
- Growth & Distribution
  - GitHub Pages Live App
  - Technical SEO Google #1</textarea>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
            <button id="convertOutlineBtn" class="btn btn-primary" type="button">
              <span>Convert Outline ↵</span>
            </button>
          </div>
        </div>

        <!-- TAB 7: CSV / TABLE -->
        <div id="tabContentCsv" class="tab-pane" style="display: none;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
            Paste Tabular CSV (Flowchart From/To or ER Diagram columns):
          </label>
          <textarea id="csvInput" spellcheck="false" style="width: 100%; height: 150px; font-family: monospace; font-size: 13px; padding: 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--text); resize: vertical;">From,To,Action
User Browser,Cloudflare Edge,TLS Handshake
Cloudflare Edge,Vite Static Host,Serve index.html
User Browser,Local WebGPU LLM,Run Qwen2.5 Model
User Browser,GitHub Pages,Deploy Artifacts</textarea>
          <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
            <button id="convertCsvBtn" class="btn btn-primary" type="button">
              <span>Convert CSV to Mermaid ↵</span>
            </button>
          </div>
        </div>

        <!-- Conversion Output Section -->
        <div id="conversionResultWrap" style="margin-top: 16px; border-top: 1px solid var(--line); padding-top: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
              Generated Mermaid Syntax Preview
            </span>
            <span id="convertStatusBadge" class="badge" style="background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); font-size: 11px; padding: 2px 8px; border-radius: 999px;">
              Ready
            </span>
          </div>
          <textarea id="conversionOutput" spellcheck="false" readonly style="width: 100%; height: 130px; font-family: monospace; font-size: 12px; padding: 10px; border-radius: 8px; border: 1px solid var(--line); background: #07090e; color: #a5f3fc; resize: none;"></textarea>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer" style="padding: 12px 20px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; background: var(--surface);">
        <span style="font-size: 12px; color: var(--text-muted);">
          100% Free &amp; Private: Zero server uploads, completely client-side.
        </span>
        <div style="display: flex; gap: 8px;">
          <button id="copyConvertedBtn" class="btn btn-secondary" type="button">
            <span>📋 Copy Code</span>
          </button>
          <button id="applyConvertedBtn" class="btn btn-success" type="button" style="background: #10b981; color: #fff; font-weight: 700;">
            <span>🚀 Insert into Studio</span>
          </button>
        </div>
      </div>
    </div>
  `;

  return overlay;
}

function attachEventListeners(modalEl) {
  modalEl.querySelector('#closeImportModalBtn').addEventListener('click', closeImportModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeImportModal();
  });

  modalEl.querySelectorAll('.import-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // 1. XMind
  const dropzone = modalEl.querySelector('#xmindDropzone');
  const fileInput = modalEl.querySelector('#xmindFileInput');
  const browseBtn = modalEl.querySelector('#browseXmindBtn');
  const demoBtn = modalEl.querySelector('#demoXmindBtn');
  const exportXmindBtn = modalEl.querySelector('#exportCurrentToXmindBtn');

  browseBtn.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#818cf8';
    dropzone.style.background = 'rgba(99, 102, 241, 0.12)';
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--line)';
    dropzone.style.background = 'rgba(99, 102, 241, 0.04)';
  });
  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--line)';
    dropzone.style.background = 'rgba(99, 102, 241, 0.04)';
    const file = e.dataTransfer?.files?.[0];
    if (file) handleXmindFile(file);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) handleXmindFile(file);
  });

  demoBtn.addEventListener('click', async () => {
    setStatus('Loading sample architecture...', 'info');
    try {
      const sampleData = createSampleXmindData();
      const zip = new JSZip();
      zip.file('content.json', JSON.stringify(sampleData));
      const blob = await zip.generateAsync({ type: 'blob' });
      await handleXmindFile(blob, 'Cloud Native Architecture.xmind');
    } catch (err) {
      setStatus(`Sample failed: ${err.message}`, 'error');
    }
  });

  exportXmindBtn.addEventListener('click', async () => {
    const currentCode = getCurrentCodeCallback ? getCurrentCodeCallback() : '';
    if (!currentCode || !currentCode.trim().startsWith('mindmap')) {
      alert('To export as XMind (.xmind), current diagram in editor must be a Mermaid mindmap.');
      return;
    }

    try {
      setStatus('Generating .xmind archive...', 'info');
      const blob = await exportMermaidToXmindBlob(currentCode, 'Mermaid Studio Map');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mermaid-mindmap.xmind';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Downloaded mermaid-mindmap.xmind! ✅', 'success');
    } catch (err) {
      alert(`Export failed: ${err.message}`);
      setStatus(`Export failed: ${err.message}`, 'error');
    }
  });

  // 2. PlantUML
  modalEl.querySelector('#convertPlantumlBtn').addEventListener('click', () => {
    const input = modalEl.querySelector('#plantumlInput').value;
    try {
      const mermaidCode = parsePlantUmlToMermaid(input);
      setResult(mermaidCode, 'Converted from PlantUML successfully! ✅');
    } catch (err) {
      setStatus(`Error: ${err.message}`, 'error');
    }
  });

  // 3. Graphviz DOT
  modalEl.querySelector('#convertGraphvizBtn').addEventListener('click', () => {
    const input = modalEl.querySelector('#graphvizInput').value;
    try {
      const mermaidCode = parseDotToMermaid(input);
      setResult(mermaidCode, 'Converted Graphviz DOT to Mermaid! ✅');
    } catch (err) {
      setStatus(`Error: ${err.message}`, 'error');
    }
  });

  // 4. D2 Lang
  modalEl.querySelector('#convertD2Btn').addEventListener('click', () => {
    const input = modalEl.querySelector('#d2Input').value;
    try {
      const mermaidCode = parseD2ToMermaid(input);
      setResult(mermaidCode, 'Converted D2 to Mermaid! ✅');
    } catch (err) {
      setStatus(`Error: ${err.message}`, 'error');
    }
  });

  // 5. SQL Schema (DDL)
  modalEl.querySelector('#convertSqlBtn').addEventListener('click', () => {
    const input = modalEl.querySelector('#sqlInput').value;
    try {
      const mermaidCode = parseSqlDdlToMermaid(input);
      setResult(mermaidCode, 'Generated ER Diagram from SQL DDL! ✅');
    } catch (err) {
      setStatus(`Error: ${err.message}`, 'error');
    }
  });

  // 6. Outline
  modalEl.querySelector('#convertOutlineBtn').addEventListener('click', () => {
    const input = modalEl.querySelector('#outlineInput').value;
    const target = modalEl.querySelector('#outlineTargetSelect').value;
    try {
      const mermaidCode = parseOutline(input, target);
      setResult(mermaidCode, `Converted outline to ${target}! ✅`);
    } catch (err) {
      setStatus(`Error: ${err.message}`, 'error');
    }
  });

  // 7. CSV
  modalEl.querySelector('#convertCsvBtn').addEventListener('click', () => {
    const input = modalEl.querySelector('#csvInput').value;
    try {
      const mermaidCode = parseCsvToMermaid(input);
      setResult(mermaidCode, 'Converted CSV to Mermaid diagram! ✅');
    } catch (err) {
      setStatus(`Error: ${err.message}`, 'error');
    }
  });

  // Copy Result
  modalEl.querySelector('#copyConvertedBtn').addEventListener('click', async () => {
    if (!lastConvertedCode) return;
    try {
      await navigator.clipboard.writeText(lastConvertedCode);
      setStatus('Copied to clipboard! 📋', 'success');
    } catch {
      setStatus('Select text in box to copy', 'info');
    }
  });

  // Apply to Studio
  modalEl.querySelector('#applyConvertedBtn').addEventListener('click', () => {
    if (!lastConvertedCode) {
      alert('Please convert a diagram first.');
      return;
    }
    if (onApplyCallback) {
      onApplyCallback(lastConvertedCode);
    }
    closeImportModal();
  });
}

async function handleXmindFile(file, customName) {
  const fileName = customName || file.name || 'document.xmind';
  setStatus(`Parsing ${fileName}...`, 'info');

  try {
    const buffer = await file.arrayBuffer();
    const result = await parseXmindToMermaid(buffer);
    setResult(result.mermaidCode, `Parsed XMind: "${result.title}" (${result.sheets.join(', ')}) ✅`);
  } catch (err) {
    console.error('XMind parsing error:', err);
    setStatus(`Failed to parse XMind: ${err.message}`, 'error');
  }
}

function switchTab(tabId) {
  activeTab = tabId;
  const modalEl = document.getElementById('importConverterModal');
  if (!modalEl) return;

  modalEl.querySelectorAll('.import-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  modalEl.querySelectorAll('.tab-pane').forEach(pane => {
    pane.style.display = 'none';
  });

  const activePane = modalEl.querySelector(`#tabContent${capitalize(tabId)}`);
  if (activePane) {
    activePane.style.display = 'block';
  }
}

function setResult(code, statusMessage) {
  lastConvertedCode = code;
  const outputEl = document.getElementById('conversionOutput');
  if (outputEl) outputEl.value = code;
  setStatus(statusMessage, 'success');
}

function setStatus(msg, type = 'info') {
  const badge = document.getElementById('convertStatusBadge');
  if (!badge) return;

  badge.textContent = msg;
  if (type === 'error') {
    badge.style.background = 'rgba(239, 68, 68, 0.15)';
    badge.style.color = '#ef4444';
    badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
  } else if (type === 'success') {
    badge.style.background = 'rgba(74, 222, 128, 0.15)';
    badge.style.color = '#4ade80';
    badge.style.borderColor = 'rgba(74, 222, 128, 0.3)';
  } else {
    badge.style.background = 'rgba(99, 102, 241, 0.15)';
    badge.style.color = '#818cf8';
    badge.style.borderColor = 'rgba(99, 102, 241, 0.3)';
  }
}

function capitalize(str) {
  if (str === 'd2') return 'D2';
  if (str === 'sql') return 'Sql';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
