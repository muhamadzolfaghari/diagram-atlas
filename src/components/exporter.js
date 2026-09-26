/**
 * Exporter utilities for Mermaid Studio
 * Provides professional-grade, watermark-free exports:
 * - High-DPI PNG (1x, 2x Retina, 3x, 4x Ultra-HD 4K)
 * - Vector SVG with custom padding & backgrounds
 * - Print-Ready PDF with auto-centering & page layout choices
 * - WebP & JPEG image formats
 * - Standalone Offline Interactive HTML diagram viewer
 * - Direct "Copy Image to Clipboard" (PNG via ClipboardItem)
 * - Embed snippets (GitHub Markdown, HTML, SVG Data URI)
 */

export class Exporter {
  static sanitizeFilename(name) {
    return (name || 'diagram')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'mermaid-diagram';
  }

  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 600);
  }

  static downloadSource(code, title = 'diagram') {
    const filename = `${this.sanitizeFilename(title)}.mmd`;
    const blob = new Blob([code], { type: 'text/vnd.mermaid;charset=utf-8' });
    this.downloadBlob(blob, filename);
  }

  /**
   * Serializes the diagram SVG with optional custom background and padding.
   */
  static getCleanSvgString(svgEl, options = {}) {
    if (!svgEl) return null;
    const { background = 'transparent', padding = 0 } = options;

    const clone = svgEl.cloneNode(true);

    if (!clone.getAttribute('xmlns')) {
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    if (!clone.getAttribute('xmlns:xlink')) {
      clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    }

    // Handle dimensions and viewBox
    const box = svgEl.viewBox?.baseVal;
    let width = box?.width || svgEl.clientWidth || 1200;
    let height = box?.height || svgEl.clientHeight || 800;

    // Apply padding if requested
    if (padding > 0) {
      const paddedX = (box?.x || 0) - padding;
      const paddedY = (box?.y || 0) - padding;
      const paddedW = width + padding * 2;
      const paddedH = height + padding * 2;
      clone.setAttribute('viewBox', `${paddedX} ${paddedY} ${paddedW} ${paddedH}`);
      clone.setAttribute('width', `${paddedW}`);
      clone.setAttribute('height', `${paddedH}`);

      if (background && background !== 'transparent') {
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', `${paddedX}`);
        bgRect.setAttribute('y', `${paddedY}`);
        bgRect.setAttribute('width', `${paddedW}`);
        bgRect.setAttribute('height', `${paddedH}`);
        bgRect.setAttribute('fill', background);
        clone.insertBefore(bgRect, clone.firstChild);
      }
    } else if (background && background !== 'transparent') {
      const x = box?.x || 0;
      const y = box?.y || 0;
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', `${x}`);
      bgRect.setAttribute('y', `${y}`);
      bgRect.setAttribute('width', `${width}`);
      bgRect.setAttribute('height', `${height}`);
      bgRect.setAttribute('fill', background);
      clone.insertBefore(bgRect, clone.firstChild);
    }

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);

    if (!svgString.startsWith('<?xml')) {
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    }
    return svgString;
  }

  /**
   * Renders SVG to a high-DPI HTML Canvas with custom scaling, background, and padding.
   */
  static async renderToCanvas(container, options = {}) {
    const {
      scale = 2,
      background = '#080c14',
      padding = 32,
    } = options;

    const svgEl = container.querySelector('svg');
    if (!svgEl) throw new Error('No diagram found to render.');

    const svgString = this.getCleanSvgString(svgEl, { background: 'transparent', padding });
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const box = svgEl.viewBox?.baseVal;
    let baseW = box?.width || svgEl.clientWidth || 1200;
    let baseH = box?.height || svgEl.clientHeight || 800;
    if (container.classList.contains('is-gantt')) {
      baseW = Math.max(baseW, 2400);
    }

    const totalW = baseW + padding * 2;
    const totalH = baseH + padding * 2;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(totalW * scale);
          canvas.height = Math.round(totalH * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context not available'));
            return;
          }

          if (background && background !== 'transparent') {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, totalW, totalH);

          URL.revokeObjectURL(url);
          resolve({ canvas, width: canvas.width, height: canvas.height });
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to rasterize diagram SVG into canvas.'));
      };

      img.src = url;
    });
  }

  /**
   * Renders the diagram into an image Blob (PNG, JPEG, WebP).
   */
  static async renderToBlob(container, options = {}) {
    const { format = 'image/png', quality = 0.95 } = options;
    const { canvas, width, height } = await this.renderToCanvas(container, options);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, width, height });
          else reject(new Error(`Failed to encode canvas as ${format}`));
        },
        format,
        quality
      );
    });
  }

  /**
   * Professional PNG Download with custom DPI/Scale (1x to 4x Ultra-HD)
   */
  static async downloadPng(container, title = 'diagram', options = {}) {
    const opts = typeof options === 'number' ? { scale: options } : options;
    const { blob } = await this.renderToBlob(container, {
      scale: 2,
      background: '#080c14',
      padding: 32,
      ...opts,
      format: 'image/png',
    });
    const filename = `${this.sanitizeFilename(title)}.png`;
    this.downloadBlob(blob, filename);
  }

  /**
   * WebP Download (Modern web format, superior compression)
   */
  static async downloadWebp(container, title = 'diagram', options = {}) {
    const { blob } = await this.renderToBlob(container, {
      scale: 2,
      background: '#080c14',
      padding: 32,
      ...options,
      format: 'image/webp',
    });
    const filename = `${this.sanitizeFilename(title)}.webp`;
    this.downloadBlob(blob, filename);
  }

  /**
   * JPEG Download (Ideal for documents and print)
   */
  static async downloadJpeg(container, title = 'diagram', options = {}) {
    const { blob } = await this.renderToBlob(container, {
      scale: 2,
      background: '#ffffff',
      padding: 32,
      ...options,
      format: 'image/jpeg',
      quality: 0.95,
    });
    const filename = `${this.sanitizeFilename(title)}.jpg`;
    this.downloadBlob(blob, filename);
  }

  /**
   * Vector SVG Download with optional custom padding & background
   */
  static downloadSvg(container, title = 'diagram', options = {}) {
    const svgEl = container.querySelector('svg');
    if (!svgEl) throw new Error('No diagram found to export.');

    const svgString = this.getCleanSvgString(svgEl, options);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const filename = `${this.sanitizeFilename(title)}.svg`;
    this.downloadBlob(blob, filename);
  }

  /**
   * One-Click "Copy Image to Clipboard"
   * Direct paste into Slack, Notion, Jira, Figma, Google Docs!
   */
  static async copyImageToClipboard(container, options = {}) {
    if (typeof navigator === 'undefined' || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
      throw new Error('Direct image clipboard copying is not supported in this browser.');
    }

    const { blob } = await this.renderToBlob(container, {
      scale: 2,
      background: '#080c14',
      padding: 24,
      ...options,
      format: 'image/png',
    });

    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  }

  /**
   * Standalone Print-Ready Vector PDF Export
   * Synthesizes a compliant PDF 1.4 document client-side with 0 external dependencies.
   */
  static async downloadPdf(container, title = 'diagram', options = {}) {
    const {
      pageSize = 'fit', // 'fit' | 'a4-landscape' | 'a4-portrait' | 'letter-landscape' | 'letter-portrait'
      background = '#ffffff',
      padding = 32,
    } = options;

    // Render at high-density (3x scale) for print sharpness
    const { blob, width, height } = await this.renderToBlob(container, {
      scale: 3,
      background,
      padding,
      format: 'image/jpeg',
      quality: 0.96,
    });

    const arrayBuffer = await blob.arrayBuffer();
    const jpegBytes = new Uint8Array(arrayBuffer);

    const pdfBytes = this.synthesizePdfFromJpeg(jpegBytes, width, height, {
      pageSize,
      title,
    });

    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const filename = `${this.sanitizeFilename(title)}.pdf`;
    this.downloadBlob(pdfBlob, filename);
  }

  /**
   * Internal PDF 1.4 synthesizer
   */
  static synthesizePdfFromJpeg(jpegUint8Array, imgWidth, imgHeight, options = {}) {
    const { pageSize = 'fit', title = 'Mermaid Diagram' } = options;

    let pageWidth, pageHeight;
    let imgDrawX, imgDrawY, imgDrawW, imgDrawH;

    const standardSizes = {
      'a4-landscape': { w: 841.89, h: 595.28 },
      'a4-portrait': { w: 595.28, h: 841.89 },
      'letter-landscape': { w: 792.00, h: 612.00 },
      'letter-portrait': { w: 612.00, h: 792.00 },
    };

    if (standardSizes[pageSize]) {
      pageWidth = standardSizes[pageSize].w;
      pageHeight = standardSizes[pageSize].h;

      const margin = 36;
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;
      const aspect = imgWidth / imgHeight;

      if (maxW / maxH > aspect) {
        imgDrawH = maxH;
        imgDrawW = maxH * aspect;
      } else {
        imgDrawW = maxW;
        imgDrawH = maxW / aspect;
      }

      imgDrawX = (pageWidth - imgDrawW) / 2;
      imgDrawY = (pageHeight - imgDrawH) / 2;
    } else {
      // 'fit': Exact aspect ratio with 24pt padding
      const padding = 24;
      const pointsRatio = 72 / 150;
      imgDrawW = Math.max(200, imgWidth * pointsRatio);
      imgDrawH = Math.max(150, imgHeight * pointsRatio);
      pageWidth = imgDrawW + padding * 2;
      pageHeight = imgDrawH + padding * 2;
      imgDrawX = padding;
      imgDrawY = padding;
    }

    const pw = pageWidth.toFixed(2);
    const ph = pageHeight.toFixed(2);
    const ix = imgDrawX.toFixed(2);
    const iy = imgDrawY.toFixed(2);
    const iw = imgDrawW.toFixed(2);
    const ih = imgDrawH.toFixed(2);

    const parts = [];
    const offsets = [];

    const encoder = new TextEncoder();
    function addString(str) {
      parts.push(encoder.encode(str));
    }
    function addBytes(u8) {
      parts.push(u8);
    }
    function currentOffset() {
      return parts.reduce((acc, p) => acc + p.length, 0);
    }

    // 1. Header
    addString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

    // 2. Catalog
    offsets[1] = currentOffset();
    addString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // 3. Pages Tree
    offsets[2] = currentOffset();
    addString('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // 4. Page Object
    offsets[3] = currentOffset();
    addString(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im1 4 0 R >> /ProcSet [/PDF /ImageC] >> /Contents 5 0 R >>\nendobj\n`
    );

    // 5. Image XObject
    offsets[4] = currentOffset();
    addString(
      `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegUint8Array.length} >>\nstream\n`
    );
    addBytes(jpegUint8Array);
    addString('\nendstream\nendobj\n');

    // 6. Page Contents Stream
    offsets[5] = currentOffset();
    const contentOps = `q\n${iw} 0 0 ${ih} ${ix} ${iy} cm\n/Im1 Do\nQ\n`;
    const contentBytes = encoder.encode(contentOps);
    addString(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentOps}endstream\nendobj\n`);

    // 7. Info Object
    offsets[6] = currentOffset();
    const safeTitle = (title || 'Mermaid Diagram').replace(/[()\\]/g, '');
    const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    addString(
      `6 0 obj\n<< /Title (${safeTitle}) /Creator (Mermaid Studio) /Producer (Mermaid Studio PDF Engine) /CreationDate (D:${dateStr}Z) >>\nendobj\n`
    );

    // 8. Cross-Reference Table
    const xrefOffset = currentOffset();
    addString('xref\n0 7\n0000000000 65535 f \n');
    for (let i = 1; i <= 6; i++) {
      const offStr = String(offsets[i]).padStart(10, '0');
      addString(`${offStr} 00000 n \n`);
    }

    // 9. Trailer
    addString(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

    // Concatenate into unified Uint8Array
    const totalLength = currentOffset();
    const out = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of parts) {
      out.set(part, pos);
      pos += part.length;
    }
    return out;
  }

  /**
   * Standalone Offline Interactive HTML Diagram Export
   * Generates a single, zero-dependency, self-contained HTML package with:
   * - Interactive drag-to-pan & wheel-zoom
   * - Dark / Light theme switcher
   * - Reset & Fit controls
   * - Collapsible Mermaid source view
   */
  static downloadStandaloneHtml(container, code, title = 'diagram') {
    const svgEl = container.querySelector('svg');
    if (!svgEl) throw new Error('No diagram found to export.');

    const cleanSvg = this.getCleanSvgString(svgEl, { background: 'transparent' });
    const safeTitle = title || 'Mermaid Diagram';

    const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(safeTitle)} — Interactive Mermaid Studio View</title>
  <style>
    :root {
      --bg: #080c14;
      --surface: #0e1626;
      --surface-hover: #1f3252;
      --border: #22324b;
      --text: #f0f6fc;
      --text-muted: #94a3b8;
      --primary: #6366f1;
    }
    body.light {
      --bg: #f8fafc;
      --surface: #ffffff;
      --surface-hover: #f1f5f9;
      --border: #cbd5e1;
      --text: #0f172a;
      --text-muted: #64748b;
      --primary: #4f46e5;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #header { position: fixed; top: 0; left: 0; right: 0; height: 50px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 20; backdrop-filter: blur(8px); }
    .title-row { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
    .badge { font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
    .nav-actions { display: flex; align-items: center; gap: 8px; }
    button { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s ease; }
    button:hover { background: var(--surface-hover); border-color: var(--primary); }
    #viewport { width: 100vw; height: calc(100vh - 50px); margin-top: 50px; overflow: hidden; position: relative; cursor: grab; background-image: radial-gradient(var(--border) 1px, transparent 1px); background-size: 24px 24px; }
    #viewport:active { cursor: grabbing; }
    #canvas { position: absolute; transform-origin: 0 0; will-change: transform; user-select: none; }
    #canvas svg { display: block; overflow: visible; }
    #dock { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 6px 10px; display: flex; gap: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 30; }
    #sourceDrawer { position: fixed; bottom: 0; left: 0; right: 0; max-height: 40vh; background: var(--surface); border-top: 1px solid var(--border); padding: 16px; display: none; z-index: 40; box-shadow: 0 -8px 32px rgba(0,0,0,0.5); }
    #sourceDrawer.open { display: flex; flex-direction: column; }
    #sourceDrawer pre { background: var(--bg); border: 1px solid var(--border); padding: 12px; border-radius: 8px; overflow: auto; font-family: monospace; font-size: 12px; flex: 1; margin-top: 8px; }
  </style>
</head>
<body>
  <header id="header">
    <div class="title-row">
      <span>${escapeHtml(safeTitle)}</span>
      <span class="badge">Mermaid Studio Standalone</span>
    </div>
    <div class="nav-actions">
      <button id="toggleThemeBtn" type="button">🌓 Theme</button>
      <button id="toggleSourceBtn" type="button">📄 Mermaid Source</button>
      <button id="fullscreenBtn" type="button">⛶ Fullscreen</button>
    </div>
  </header>

  <div id="viewport">
    <div id="canvas">
      ${cleanSvg}
    </div>
  </div>

  <div id="dock">
    <button id="zoomOutBtn" type="button" title="Zoom Out ( - )">−</button>
    <button id="zoomResetBtn" type="button" title="Reset Zoom ( 0 )">100%</button>
    <button id="zoomInBtn" type="button" title="Zoom In ( + )">+</button>
    <button id="fitBtn" type="button" title="Fit to Viewport ( F )">Fit</button>
    <button id="centerBtn" type="button" title="Center ( C )">Center</button>
  </div>

  <div id="sourceDrawer">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <strong style="font-size: 13px;">Mermaid Diagram Definition</strong>
      <div style="display: flex; gap: 8px;">
        <button id="copySourceBtn" type="button">📋 Copy Code</button>
        <button id="closeSourceBtn" type="button">✕ Close</button>
      </div>
    </div>
    <pre><code>${escapeHtml(code)}</code></pre>
  </div>

  <script>
    (function() {
      const viewport = document.getElementById('viewport');
      const canvas = document.getElementById('canvas');
      const svg = canvas.querySelector('svg');
      let x = 40, y = 40, scale = 1;
      let isDragging = false, startX = 0, startY = 0;

      function update() {
        canvas.style.transform = \`translate(\${x}px, \${y}px) scale(\${scale})\`;
        document.getElementById('zoomResetBtn').textContent = Math.round(scale * 100) + '%';
      }

      function fit() {
        if (!svg) return;
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        const box = svg.getBBox();
        if (box.width === 0 || box.height === 0) return;
        const scaleX = (vw - 80) / box.width;
        const scaleY = (vh - 80) / box.height;
        scale = Math.min(scaleX, scaleY, 2.5);
        scale = Math.max(scale, 0.15);
        x = (vw - box.width * scale) / 2 - box.x * scale;
        y = (vh - box.height * scale) / 2 - box.y * scale;
        update();
      }

      viewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('#dock, #sourceDrawer, #header')) return;
        isDragging = true;
        startX = e.clientX - x;
        startY = e.clientY - y;
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        x = e.clientX - startX;
        y = e.clientY - startY;
        update();
      });

      window.addEventListener('mouseup', () => { isDragging = false; });

      viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        const newScale = Math.min(Math.max(scale * factor, 0.1), 5);
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        x = mouseX - (mouseX - x) * (newScale / scale);
        y = mouseY - (mouseY - y) * (newScale / scale);
        scale = newScale;
        update();
      }, { passive: false });

      document.getElementById('zoomInBtn').onclick = () => { scale = Math.min(scale * 1.2, 5); update(); };
      document.getElementById('zoomOutBtn').onclick = () => { scale = Math.max(scale / 1.2, 0.1); update(); };
      document.getElementById('zoomResetBtn').onclick = () => { scale = 1; update(); };
      document.getElementById('fitBtn').onclick = fit;
      document.getElementById('centerBtn').onclick = () => {
        if (!svg) return;
        const box = svg.getBBox();
        x = (viewport.clientWidth - box.width * scale) / 2;
        y = (viewport.clientHeight - box.height * scale) / 2;
        update();
      };

      document.getElementById('toggleThemeBtn').onclick = () => {
        document.body.classList.toggle('light');
      };

      const drawer = document.getElementById('sourceDrawer');
      document.getElementById('toggleSourceBtn').onclick = () => {
        drawer.classList.toggle('open');
      };
      document.getElementById('closeSourceBtn').onclick = () => {
        drawer.classList.remove('open');
      };
      document.getElementById('copySourceBtn').onclick = () => {
        navigator.clipboard.writeText(${JSON.stringify(code)});
        alert('Mermaid syntax copied to clipboard!');
      };

      document.getElementById('fullscreenBtn').onclick = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
      };

      setTimeout(fit, 60);
      window.addEventListener('resize', fit);
    })();
  <\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const filename = `${this.sanitizeFilename(title)}.html`;
    this.downloadBlob(blob, filename);
  }

  /**
   * Generates formatted embed snippets (Markdown, HTML, Data URI, SVG)
   */
  static generateEmbedSnippets(code, container, title = 'diagram') {
    const markdown = '```mermaid\n' + code.trim() + '\n```';
    const htmlSnippet = `<pre class="mermaid">\n${code.trim()}\n</pre>\n<script type="module">import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"; mermaid.initialize({ startOnLoad: true });<\/script>`;

    let svgDataUri = '';
    let svgRaw = '';
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgRaw = this.getCleanSvgString(svgEl);
      svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgRaw)}`;
    }

    return {
      markdown,
      html: htmlSnippet,
      dataUri: svgDataUri,
      svg: svgRaw,
    };
  }

  static async copySvg(container) {
    const svgEl = container.querySelector('svg');
    if (!svgEl) throw new Error('No diagram found to copy.');
    const svgString = this.getCleanSvgString(svgEl);
    await navigator.clipboard.writeText(svgString);
  }

  static async copyMarkdown(code) {
    const markdown = '```mermaid\n' + code.trim() + '\n```';
    await navigator.clipboard.writeText(markdown);
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
