/**
 * NodeFlow WebAssembly Diagnostics & Benchmark Suite Modal
 * Real-time hardware inspection and performance benchmark runner
 * comparing JavaScript vs WebAssembly execution speeds.
 */

import {
  getWasmCapabilities,
  runWasmBenchmark,
} from '../utils/wasm/wasm-accelerator.js';

let modalEl = null;
let onSelectTemplateCallback = null;

export function initWasmModal(options = {}) {
  onSelectTemplateCallback = options.onSelectTemplate || null;

  if (document.getElementById('wasmBenchmarkModal')) {
    return;
  }

  modalEl = document.createElement('div');
  modalEl.id = 'wasmBenchmarkModal';
  modalEl.className = 'modal-backdrop';
  modalEl.style.display = 'none';
  modalEl.style.position = 'fixed';
  modalEl.style.inset = '0';
  modalEl.style.zIndex = '9999';
  modalEl.style.background = 'rgba(8, 12, 20, 0.85)';
  modalEl.style.backdropFilter = 'blur(12px)';
  modalEl.style.display = 'none';
  modalEl.style.alignItems = 'center';
  modalEl.style.justifyContent = 'center';
  modalEl.style.padding = '20px';

  modalEl.innerHTML = `
    <div class="wasm-modal-window" style="background: #0d1527; border: 1px solid rgba(56, 189, 248, 0.3); box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(14, 165, 233, 0.15); border-radius: 16px; width: 100%; max-width: 680px; overflow: hidden; display: flex; flex-direction: column; max-height: 90vh;">
      
      <!-- Modal Header -->
      <div style="padding: 18px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; background: rgba(14, 165, 233, 0.05);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #38bdf8); display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);">
            ⚡
          </div>
          <div>
            <h2 style="margin: 0; font-size: 17px; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em;">
              WebAssembly High-Performance Suite
            </h2>
            <p style="margin: 2px 0 0; font-size: 12px; color: var(--text-muted, #94a3b8);">
              Hardware-accelerated compilation, linear memory compositing, and Graphviz C engine
            </p>
          </div>
        </div>
        <button id="closeWasmModalBtn" type="button" style="background: transparent; border: none; color: #94a3b8; font-size: 22px; cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1;">
          ✕
        </button>
      </div>

      <!-- Modal Body -->
      <div style="padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Hardware Capability Grid -->
        <div>
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #38bdf8; margin-bottom: 10px;">
            Hardware & Runtime Capabilities
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
            
            <div class="wasm-cap-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
              <div style="font-size: 11px; color: #94a3b8;">Wasm Core Engine</div>
              <div id="wasmCapCore" style="font-size: 13px; font-weight: 700; color: #10b981; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                <span>●</span> Active
              </div>
            </div>

            <div class="wasm-cap-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
              <div style="font-size: 11px; color: #94a3b8;">128-bit SIMD</div>
              <div id="wasmCapSimd" style="font-size: 13px; font-weight: 700; color: #38bdf8; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                <span>●</span> Detecting…
              </div>
            </div>

            <div class="wasm-cap-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
              <div style="font-size: 11px; color: #94a3b8;">Threads / SAB</div>
              <div id="wasmCapThreads" style="font-size: 13px; font-weight: 700; color: #38bdf8; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                <span>●</span> Detecting…
              </div>
            </div>

            <div class="wasm-cap-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px;">
              <div style="font-size: 11px; color: #94a3b8;">Graphviz C Engine</div>
              <div id="wasmCapGv" style="font-size: 13px; font-weight: 700; color: #10b981; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
                <span>●</span> Loaded
              </div>
            </div>

          </div>
        </div>

        <!-- Live Benchmark Suite Card -->
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div>
              <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">
                Live Hardware Benchmark
              </div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">
                Measure real-time speedup vs standard V8 JavaScript
              </div>
            </div>
            <button id="runWasmBenchBtn" type="button" style="background: linear-gradient(135deg, #0284c7, #38bdf8); border: none; color: #041226; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
              <span id="benchBtnIcon">▶</span>
              <span id="benchBtnText">Run Benchmark</span>
            </button>
          </div>

          <div id="benchmarkResultsArea" style="display: flex; flex-direction: column; gap: 12px;">
            
            <!-- Hash Benchmark Row -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 600; color: #cbd5e1;">1. 32-bit FNV-1a Hashing (50,000 passes)</span>
                <span id="hashSpeedupBadge" style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 999px;">
                  Ready
                </span>
              </div>
              <div style="display: flex; gap: 16px; font-size: 12px; color: #94a3b8;">
                <div>JavaScript: <strong id="jsHashTime" style="color: #f1f5f9;">—</strong></div>
                <div>WebAssembly: <strong id="wasmHashTime" style="color: #38bdf8;">—</strong></div>
              </div>
            </div>

            <!-- Pixel Compositing Row -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 600; color: #cbd5e1;">2. 4K Pixel Buffer Compositing (100,000 pixels)</span>
                <span id="pixelSpeedupBadge" style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 999px;">
                  Ready
                </span>
              </div>
              <div style="display: flex; gap: 16px; font-size: 12px; color: #94a3b8;">
                <div>JavaScript: <strong id="jsPixelTime" style="color: #f1f5f9;">—</strong></div>
                <div>Wasm Linear Memory: <strong id="wasmPixelTime" style="color: #38bdf8;">—</strong></div>
              </div>
            </div>

            <!-- Graphviz C Engine Row -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 600; color: #cbd5e1;">3. Native Graphviz C Layout Engine (25 Nodes / 75 Edges)</span>
                <span id="gvSpeedupBadge" style="font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 999px;">
                  Ready
                </span>
              </div>
              <div style="display: flex; gap: 16px; font-size: 12px; color: #94a3b8;">
                <div>Layout Engine: <strong style="color: #f1f5f9;">Graphviz C (dot)</strong></div>
                <div>Render Time: <strong id="gvLayoutTime" style="color: #10b981;">—</strong></div>
              </div>
            </div>

          </div>
        </div>

        <!-- Quick Actions & Examples -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 8px;">
            <button id="loadK8sExampleBtn" type="button" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); color: #38bdf8; font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 6px; cursor: pointer;">
              🌐 Load Kubernetes Wasm Example
            </button>
            <button id="copyBenchReportBtn" type="button" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #e2e8f0; font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 6px; cursor: pointer;">
              📋 Copy Benchmark Report
            </button>
          </div>
          <button id="closeWasmFooterBtn" type="button" style="background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); color: #94a3b8; font-size: 12px; padding: 7px 16px; border-radius: 6px; cursor: pointer;">
            Close
          </button>
        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modalEl);

  // Bind Events
  const closeBtn = modalEl.querySelector('#closeWasmModalBtn');
  const closeFooterBtn = modalEl.querySelector('#closeWasmFooterBtn');
  const runBtn = modalEl.querySelector('#runWasmBenchBtn');
  const loadK8sBtn = modalEl.querySelector('#loadK8sExampleBtn');
  const copyReportBtn = modalEl.querySelector('#copyBenchReportBtn');

  closeBtn.addEventListener('click', closeWasmModal);
  closeFooterBtn.addEventListener('click', closeWasmModal);

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeWasmModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.style.display !== 'none') {
      closeWasmModal();
    }
  });

  runBtn.addEventListener('click', async () => {
    await executeBenchmarkUI();
  });

  loadK8sBtn.addEventListener('click', () => {
    closeWasmModal();
    if (typeof onSelectTemplateCallback === 'function') {
      onSelectTemplateCallback('graphviz-k8s-mesh');
    }
  });

  copyReportBtn.addEventListener('click', () => {
    const reportText = generateReportMarkdown();
    navigator.clipboard.writeText(reportText);
    copyReportBtn.textContent = 'Copied to Clipboard! ✅';
    setTimeout(() => {
      copyReportBtn.textContent = '📋 Copy Benchmark Report';
    }, 2000);
  });
}

let lastBenchmarkMetrics = null;

async function executeBenchmarkUI() {
  const runBtn = modalEl.querySelector('#runWasmBenchBtn');
  const benchBtnIcon = modalEl.querySelector('#benchBtnIcon');
  const benchBtnText = modalEl.querySelector('#benchBtnText');

  runBtn.disabled = true;
  benchBtnIcon.textContent = '⏳';
  benchBtnText.textContent = 'Benchmarking…';

  try {
    const results = await runWasmBenchmark();
    lastBenchmarkMetrics = results;

    // Update UI
    modalEl.querySelector('#jsHashTime').textContent = `${results.hash.jsTimeMs} ms`;
    modalEl.querySelector('#wasmHashTime').textContent = `${results.hash.wasmTimeMs} ms`;
    modalEl.querySelector('#hashSpeedupBadge').textContent = `⚡ ${results.hash.speedup}x Faster`;
    modalEl.querySelector('#hashSpeedupBadge').style.background = 'rgba(16, 185, 129, 0.15)';
    modalEl.querySelector('#hashSpeedupBadge').style.color = '#10b981';

    modalEl.querySelector('#jsPixelTime').textContent = `${results.pixel.jsTimeMs} ms`;
    modalEl.querySelector('#wasmPixelTime').textContent = `${results.pixel.wasmTimeMs} ms`;
    modalEl.querySelector('#pixelSpeedupBadge').textContent = `⚡ ${results.pixel.speedup}x Faster`;
    modalEl.querySelector('#pixelSpeedupBadge').style.background = 'rgba(16, 185, 129, 0.15)';
    modalEl.querySelector('#pixelSpeedupBadge').style.color = '#10b981';

    modalEl.querySelector('#gvLayoutTime').textContent = `${results.graphviz.layoutTimeMs} ms`;
    modalEl.querySelector('#gvSpeedupBadge').textContent = `Compiled (${results.graphviz.svgBytes} B SVG)`;

  } catch (err) {
    console.error('Benchmark execution failed:', err);
  } finally {
    runBtn.disabled = false;
    benchBtnIcon.textContent = '▶';
    benchBtnText.textContent = 'Run Benchmark';
  }
}

function generateReportMarkdown() {
  const m = lastBenchmarkMetrics;
  if (!m) {
    return `### NodeFlow WebAssembly Acceleration Report\n- Engine: WebAssembly Turbo v1.0\n- Graphviz: Native C Engine active\n- Status: Ready`;
  }

  return `### NodeFlow WebAssembly Performance Benchmark
- **Wasm Core Engine**: Active
- **SIMD Acceleration**: ${m.capabilities.simd ? '128-bit Active' : 'Fallback'}
- **Threading**: ${m.capabilities.threads ? 'Multi-Threaded' : 'Standard'}
- **1. 32-bit FNV-1a Hashing (50,000 passes)**:
  - JavaScript: ${m.hash.jsTimeMs} ms
  - WebAssembly: ${m.hash.wasmTimeMs} ms
  - **Speedup: ${m.hash.speedup}x faster**
- **2. 4K Pixel Buffer Compositing (100,000 pixels)**:
  - JavaScript: ${m.pixel.jsTimeMs} ms
  - Wasm Linear Memory: ${m.pixel.wasmTimeMs} ms
  - **Speedup: ${m.pixel.speedup}x faster**
- **3. Graphviz C Engine**:
  - Layout Algorithm: ${m.graphviz.engine}
  - Execution Time: ${m.graphviz.layoutTimeMs} ms
  - Rendered Vector Size: ${m.graphviz.svgBytes} bytes
`;
}

export async function openWasmModal() {
  if (!modalEl) {
    initWasmModal();
  }

  modalEl.style.display = 'flex';

  // Probe capabilities
  const caps = await getWasmCapabilities();
  const simdEl = modalEl.querySelector('#wasmCapSimd');
  const threadsEl = modalEl.querySelector('#wasmCapThreads');

  if (simdEl) {
    simdEl.innerHTML = caps.simd
      ? '<span style="color: #10b981;">●</span> 128-bit SIMD'
      : '<span style="color: #f59e0b;">●</span> Fallback (Standard)';
  }
  if (threadsEl) {
    threadsEl.innerHTML = caps.threads
      ? '<span style="color: #10b981;">●</span> Multi-Thread'
      : '<span style="color: #94a3b8;">●</span> Single-Thread';
  }
}

export function closeWasmModal() {
  if (modalEl) {
    modalEl.style.display = 'none';
  }
}
