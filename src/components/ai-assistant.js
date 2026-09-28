/**
 * Mermaid AI Assistant
 * Supports dual-engine diagram generation:
 * 1. Fast instant heuristic generator (0 MB, runs anywhere immediately)
 * 2. REAL in-browser Qwen2.5-Coder (0.5B) LLM via WebAssembly / WebGPU (@mlc-ai/web-llm)
 *
 * Also provides deterministic converters:
 * 3. DB → UML  — SQL DDL → Mermaid erDiagram (instant, no AI)
 * 4. Code → UML — TS/Python/Java/Go classes → Mermaid classDiagram (instant, no AI)
 */
import { parseSqlDdlToMermaid } from '../utils/importers/sql-ddl.js';
import { parseCodeToClassDiagram } from '../utils/importers/code-to-uml.js';
import { analyzeDiagram } from '../utils/diagram-insights.js';
import { generateOnboardingFlow, buildErDiagram } from '../utils/onboarding-generator.js';
import { describeToDiagram, SUPPORTED_DIAGRAM_TYPES } from '../utils/importers/describe-to-diagram.js';

export const QWEN_MODEL_ID = 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC';

export const OLLAMA_BASE_URL = 'http://localhost:11434';
export const OLLAMA_DEFAULT_MODEL = 'deepseek-coder';

// ─── Converter Samples ────────────────────────────────────────────────────────
export const SQL_SAMPLE = `-- E-Commerce Platform Schema
CREATE TABLE users (
  id          UUID        PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  full_name   VARCHAR(100),
  role        VARCHAR(20)  DEFAULT 'customer',
  created_at  TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE categories (
  id    UUID PRIMARY KEY,
  slug  VARCHAR(80) UNIQUE NOT NULL,
  name  VARCHAR(100) NOT NULL
);

CREATE TABLE products (
  id           UUID        PRIMARY KEY,
  category_id  UUID        REFERENCES categories(id),
  sku          VARCHAR(60) UNIQUE NOT NULL,
  name         VARCHAR(200),
  price        DECIMAL(12,2),
  stock_level  INT         DEFAULT 0
);

CREATE TABLE orders (
  id          UUID        PRIMARY KEY,
  user_id     UUID        REFERENCES users(id),
  status      VARCHAR(30) DEFAULT 'pending',
  total       DECIMAL(12,2),
  placed_at   TIMESTAMP   DEFAULT NOW()
);

CREATE TABLE order_items (
  id          UUID       PRIMARY KEY,
  order_id    UUID       REFERENCES orders(id),
  product_id  UUID       REFERENCES products(id),
  quantity    INT        NOT NULL,
  unit_price  DECIMAL(12,2)
);

CREATE TABLE payments (
  id           UUID       PRIMARY KEY,
  order_id     UUID       REFERENCES orders(id),
  provider     VARCHAR(40),
  amount       DECIMAL(12,2),
  status       VARCHAR(20),
  processed_at TIMESTAMP
);

CREATE TABLE reviews (
  id         UUID      PRIMARY KEY,
  user_id    UUID      REFERENCES users(id),
  product_id UUID      REFERENCES products(id),
  rating     SMALLINT,
  body       TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`;

export const CODE_SAMPLE = `// TypeScript — Clean Architecture Service Layer

interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

class User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;

  isAdmin(): boolean {}
  toPublicProfile(): object {}
}

class UserRepository implements Repository<User> {
  private db: DatabaseClient;

  async findById(id: string): Promise<User | null> {}
  async findAll(): Promise<User[]> {}
  async save(user: User): Promise<User> {}
  async delete(id: string): Promise<void> {}
  async findByEmail(email: string): Promise<User | null> {}
}

class AuthService {
  private userRepo: UserRepository;
  private jwtSecret: string;

  async login(email: string, password: string): Promise<string> {}
  async register(email: string, password: string): Promise<User> {}
  async verifyToken(token: string): Promise<User> {}
  private hashPassword(plain: string): string {}
}

class OrderService {
  private orderRepo: OrderRepository;
  private paymentService: PaymentService;
  private userRepo: UserRepository;

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {}
  async cancelOrder(orderId: string): Promise<void> {}
  async getOrderHistory(userId: string): Promise<Order[]> {}
}

class PaymentService {
  private gateway: PaymentGateway;

  async charge(orderId: string, amount: number): Promise<Payment> {}
  async refund(paymentId: string): Promise<void> {}
  async getStatus(paymentId: string): Promise<string> {}
}

class Order {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: Date;
}

class OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

class Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  provider: string;
}`;

export const ONBOARDING_SAMPLE = `User Visits Homepage
[decision] Already have account?
Sign In With OAuth / Password
[decision] Authentication Succeeded?
[error] Display Auth Error & Trigger Password Reset
Sign Up With Email & Password
[email] Send Verification Link to Inbox
[gate] Did user confirm email link?
[error] Show Resend Link Banner
Organization & Workspace Setup
Invite Teammates by Email
[parallel] Install VS Code / JetBrains Extension
[parallel] Connect GitHub / GitLab Repository
Interactive Product Tour
Create First Mermaid Diagram
[success] User Reached Activation Milestone`;

export const ER_SAMPLE_TABLES = [
  {
    name: 'USERS',
    fields: [
      { name: 'id', type: 'uuid', key: 'PK' },
      { name: 'email', type: 'varchar', key: 'UK' },
      { name: 'role', type: 'varchar', key: '' },
      { name: 'created_at', type: 'timestamp', key: '' },
    ],
  },
  {
    name: 'ORDERS',
    fields: [
      { name: 'id', type: 'uuid', key: 'PK' },
      { name: 'user_id', type: 'uuid', key: 'FK' },
      { name: 'status', type: 'varchar', key: '' },
      { name: 'total_amount', type: 'decimal', key: '' },
      { name: 'placed_at', type: 'timestamp', key: '' },
    ],
  },
  {
    name: 'ORDER_ITEMS',
    fields: [
      { name: 'id', type: 'uuid', key: 'PK' },
      { name: 'order_id', type: 'uuid', key: 'FK' },
      { name: 'product_id', type: 'uuid', key: 'FK' },
      { name: 'quantity', type: 'int', key: '' },
      { name: 'unit_price', type: 'decimal', key: '' },
    ],
  },
  {
    name: 'PRODUCTS',
    fields: [
      { name: 'id', type: 'uuid', key: 'PK' },
      { name: 'name', type: 'varchar', key: '' },
      { name: 'sku', type: 'varchar', key: 'UK' },
      { name: 'price', type: 'decimal', key: '' },
      { name: 'stock_count', type: 'int', key: '' },
    ],
  },
];

export const ER_SAMPLE_RELATIONS = [
  { from: 'USERS', to: 'ORDERS', rel: '||--o{', label: 'places' },
  { from: 'ORDERS', to: 'ORDER_ITEMS', rel: '||--|{', label: 'contains' },
  { from: 'PRODUCTS', to: 'ORDER_ITEMS', rel: '||--o{', label: 'ordered in' },
];

export const DESCRIBE_SAMPLES = [
  {
    type: 'flowchart',
    title: 'Payment Processing Microservice',
    text: `User initiates checkout with items in cart
Verify item stock availability in inventory
[decision] Is inventory available?
Display Out of Stock Notice & Suggest Alternatives
Authorize card payment with Stripe API
[decision] Did payment authorization succeed?
Display Payment Failed & Prompt Retry
Reserve warehouse inventory and generate packing slip
Send order confirmation receipt via email
Update order tracking status to processing
[success] Order confirmed and ready for dispatch`,
  },
  {
    type: 'sequence',
    title: 'OAuth2 Authorization & JWT Token',
    text: `User clicks Sign In with Google on Frontend App
Frontend App redirects browser to Auth Provider
User authenticates and consents to permissions
Auth Provider returns authorization code to Frontend
Frontend exchanges authorization code with API Gateway
API Gateway validates credentials with Auth Service
Auth Service queries Database for user permissions
Database returns user profile and roles
Auth Service generates signed JWT access token
API Gateway returns 200 OK with JWT and refresh token
Frontend stores JWT in memory and renders Dashboard`,
  },
  {
    type: 'mindmap',
    title: 'Cloud Native System Architecture',
    text: `Cloud Architecture
  Frontend Layer
    Next.js Single Page App
    Tailwind CSS System
    PWA Offline Support
  API & Edge
    Cloudflare CDN
    Kong API Gateway
    Rate Limiting
  Core Services
    Authentication Service
    Billing Engine
    Notification Hub
  Data Storage
    PostgreSQL Primary
    Redis Cache Cluster
    S3 Asset Storage
  Observability
    Prometheus Metrics
    Grafana Dashboards
    OpenTelemetry Tracing`,
  },
  {
    type: 'state',
    title: 'Support Ticket Lifecycle',
    text: `New ticket submitted by customer
Triage team reviews severity and assigns priority
Ticket assigned to on-call engineer
Engineer begins active investigation and reproduction
[decision] Is more information needed from customer?
Wait for customer response
Engineer develops patch and opens PR
QA team verifies fix in staging environment
Ticket marked resolved and feedback requested
Customer confirms resolution or ticket auto-closes`,
  },
  {
    type: 'er',
    title: 'SaaS Multi-Tenant Database',
    text: `Organizations have many Users and Workspaces
Users create and manage Projects
Projects contain multiple Tasks and Documents
Workspaces subscribe to Billing Plans
Invoices are generated for Subscriptions and paid by Organizations`,
  },
  {
    type: 'journey',
    title: 'Flight Booking Experience',
    text: `Search flight destinations and dates
Compare airline prices and flight times
Select seats and add checked luggage
Enter passenger details and frequent flyer number
Complete credit card payment
Receive instant e-ticket boarding pass
Arrive at airport and scan mobile boarding pass
Board plane and reach destination`,
  },
  {
    type: 'timeline',
    title: 'Product Innovation Milestones',
    text: `2024 Q1 Launch MVP with core diagram editor
2024 Q3 Introduce live WebAssembly Qwen AI assistant
2025 Q1 Release multi-file codebase import and team sync
2025 Q3 Scale to 1M monthly active diagram creators
2026 Q2 Launch enterprise AI reasoning engine`,
  },
];

export const AI_SUGGESTIONS = [
  {
    title: 'AWS Serverless Architecture',
    kind: 'flowchart',
    prompt: 'Cloud serverless stack with Route53, API Gateway, Cognito Auth, Lambda functions, DynamoDB, and S3 event triggers',
  },
  {
    title: 'OAuth2 & JWT Auth Sequence',
    kind: 'sequence',
    prompt: 'OAuth2 Authorization Code Flow with PKCE between User, SPA Client, Auth0 Provider, and Resource API',
  },
  {
    title: 'E-Commerce Database Schema',
    kind: 'er',
    prompt: 'PostgreSQL relational database schema for users, orders, order items, products, categories, and payments',
  },
  {
    title: 'Order Processing State Machine',
    kind: 'state',
    prompt: 'State machine for e-commerce order lifecycle: Created, Pending Payment, Paid, Processing, Shipped, Delivered, or Cancelled',
  },
  {
    title: 'CI/CD Pipeline with Blue/Green',
    kind: 'flowchart',
    prompt: 'Git commit trigger, automated testing, docker build, staging deployment, QA verification gate, and blue/green production release',
  },
  {
    title: 'Git Trunk-Based Release Flow',
    kind: 'gitGraph',
    prompt: 'Trunk-based development flow with feature branches, PR reviews, release tags, and hotfixes',
  },
  {
    title: 'Incident Management Escalation',
    kind: 'flowchart',
    prompt: 'Alert triggered, PagerDuty triage, On-call engineer escalation, incident mitigation, and blameless post-mortem',
  },
];

export class AIAssistant {
  constructor(options) {
    this.container = options.container;
    this.onApplyCode = options.onApplyCode || (() => {});
    this.onInsertCode = options.onInsertCode || (() => {});
    this.onGetDiagramCode = options.onGetDiagramCode || (() => '');
    this.onGetTitle = options.onGetTitle || (() => 'Current Diagram');

    this.engineMode = 'heuristic'; // 'heuristic' | 'qwen' | 'ollama'
    this.qwenEngine = null;
    this.qwenLoading = false;
    this.qwenLoaded = false;
    this.qwenError = null;

    this.ollamaUrl = OLLAMA_BASE_URL;
    this.ollamaModel = OLLAMA_DEFAULT_MODEL;
    this.ollamaConnected = false;

    this.promptInput = null;
    this.generateBtn = null;
    this.resultContainer = null;
    this.resultCode = null;
    this.generatedCode = '';

    this.codebaseFiles = [];
    this.erTables = JSON.parse(JSON.stringify(ER_SAMPLE_TABLES));
    this.erRelations = JSON.parse(JSON.stringify(ER_SAMPLE_RELATIONS));

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.renderErBuilder();
    this.checkWebGPUSupport();
  }

  checkWebGPUSupport() {
    this.hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  render() {
    this.container.innerHTML = `
      <div class="ai-drawer-header">
        <div class="ai-drawer-title-row">
          <div class="ai-sparkle-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="url(#aiGradient)" stroke="none" />
              <defs>
                <linearGradient id="aiGradient" x1="2" y1="2" x2="22" y2="22">
                  <stop stop-color="#818cf8"/>
                  <stop offset="1" stop-color="#c084fc"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h2 class="ai-title">Mermaid AI Studio</h2>
            <p class="ai-subtitle">Generate diagrams with natural language or local Qwen</p>
          </div>
        </div>
        <button id="closeAiDrawerBtn" class="drawer-close-btn" type="button" aria-label="Close AI Assistant">✕</button>
      </div>

      <div class="ai-drawer-body">
        <!-- Dual Engine Selector -->
        <div class="ai-engine-switcher" role="radiogroup" aria-label="AI Engine Mode">
          <button id="engineTabHeuristic" class="ai-engine-tab active" type="button" role="radio" aria-checked="true">
            <span>⚡ Instant (0 MB)</span>
          </button>
          <button id="engineTabQwen" class="ai-engine-tab" type="button" role="radio" aria-checked="false">
            <span>🧠 Qwen2.5 (Browser)</span>
          </button>
          <button id="engineTabOllama" class="ai-engine-tab" type="button" role="radio" aria-checked="false">
            <span>🦙 Local (Ollama)</span>
          </button>
        </div>

        <!-- Qwen Local LLM Status Card (Shown when Qwen tab active) -->
        <div id="qwenStatusCard" class="qwen-status-card" style="display: none;">
          <div class="qwen-status-header">
            <span class="qwen-model-pill">Qwen2.5-Coder 0.5B</span>
            <span id="qwenStatusBadge" class="qwen-status-text">WebGPU / Wasm</span>
          </div>

          <div id="qwenDownloadSection">
            <p style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;">
              Runs 100% locally in your browser with WebAssembly & WebGPU. Downloads ~380 MB once and caches permanently in browser storage.
            </p>
            <div id="qwenProgressWrap" class="qwen-progress-wrap" style="display: none;">
              <div class="qwen-progress-track">
                <div id="qwenProgressBar" class="qwen-progress-bar"></div>
              </div>
              <div class="qwen-progress-label">
                <span id="qwenProgressText">Initializing engine…</span>
                <span id="qwenProgressPct">0%</span>
              </div>
            </div>
            <button id="loadQwenBtn" class="btn btn-sm btn-primary" style="width: 100%; margin-top: 6px;" type="button">
              ⬇ Load Qwen Model (~380 MB)
            </button>
          </div>

          <div id="qwenReadySection" style="display: none;">
            <div class="qwen-badge-ready">
              <span>●</span>
              <span>Model Loaded & Ready in Memory</span>
            </div>
          </div>
        </div>

        <!-- Ollama Local Model Status Card -->
        <div id="ollamaStatusCard" class="qwen-status-card" style="display: none;">
          <div class="qwen-status-header">
            <span class="qwen-model-pill">Local Ollama</span>
            <span id="ollamaStatusBadge" class="qwen-status-text">localhost:11434</span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 8px;">
            Runs natively on your machine — much faster than browser WebAssembly.
            Make sure Ollama is running with your model loaded.
          </p>
          <div style="display: flex; gap: 6px; margin-bottom: 8px; align-items: center;">
            <input id="ollamaModelInput" type="text" value="deepseek-coder"
              placeholder="model name (e.g. deepseek-coder)"
              style="flex: 1; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 6px;
                     padding: 5px 8px; font-size: 11px; color: var(--text-primary); outline: none;" />
            <button id="testOllamaBtn" class="btn btn-sm btn-primary" type="button">Test</button>
          </div>
          <div id="ollamaReadySection" style="display: none;">
            <div class="qwen-badge-ready">
              <span>●</span>
              <span id="ollamaReadyText">Ollama connected &amp; ready</span>
            </div>
          </div>
        </div>

        <!-- Prompt Input Card -->
        <div class="ai-input-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <label class="ai-label" for="aiPromptText" style="margin-bottom:0;">Describe your diagram</label>
            <select id="aiDiagramTypeSelect" class="ai-conv-lang-select" title="Target Diagram Type">
              ${SUPPORTED_DIAGRAM_TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}
            </select>
          </div>
          <textarea id="aiPromptText" class="ai-prompt-input" rows="3" placeholder="e.g. Design a microservices payment architecture with Stripe, Kafka, and PostgreSQL..."></textarea>
          <div class="ai-actions-row">
            <button id="aiGenerateBtn" class="btn btn-ai-primary" type="button">
              <span class="ai-btn-icon">✨</span>
              <span id="aiGenerateBtnLabel">Generate Diagram</span>
            </button>
          </div>
        </div>

        <!-- Suggestions Section -->
        <div class="ai-suggestions-section">
          <div class="ai-suggestions-header">Quick Prompt Ideas</div>
          <div class="ai-pills-list" id="aiPillsList">
            ${AI_SUGGESTIONS.map((item, idx) => `
              <button class="ai-pill-btn" data-index="${idx}" type="button">
                <span class="pill-kind">${item.kind}</span>
                <span class="pill-text">${item.title}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Result Card -->
        <div id="aiResultCard" class="ai-result-card" style="display: none;">
          <div class="ai-result-header">
            <span class="ai-result-tag" id="aiResultEngineTag">Generated with Instant Engine</span>
            <div class="ai-result-actions">
              <button id="aiCopyBtn" class="editor-tool-btn" type="button" title="Copy code">📋 Copy</button>
              <button id="aiApplyBtn" class="btn btn-primary btn-sm" type="button">Apply to Canvas</button>
            </div>
          </div>
          <pre id="aiResultCode" class="ai-result-code"></pre>
        </div>

        <!-- ──────── Deterministic Converters Section ──────── -->
        <div class="ai-converters-section">
          <div class="ai-converters-header">
            <span class="ai-converters-label">⚡ Instant Converters</span>
            <span class="ai-converters-sub">No AI needed — deterministic &amp; 100% local</span>
          </div>

          <!-- Converter Tab Switcher (6 tabs: 2 rows of 3) -->
          <div class="ai-converter-tabs">
            <button id="convTabDescribe" class="ai-converter-tab active" type="button" title="Describe to Any Diagram">
              ✨ Describe
            </button>
            <button id="convTabSql" class="ai-converter-tab" type="button" title="SQL DDL → ER Diagram">
              🗄️ DB
            </button>
            <button id="convTabEr" class="ai-converter-tab" type="button" title="Visual ER Builder">
              📊 ER Build
            </button>
            <button id="convTabCode" class="ai-converter-tab" type="button" title="Code → Class Diagram">
              &lt;/&gt; Code
            </button>
            <button id="convTabOnboard" class="ai-converter-tab" type="button" title="Onboarding Flow Generator">
              🚀 Flow
            </button>
            <button id="convTabInsights" class="ai-converter-tab" type="button" title="Diagram Insights & Analytics">
              🔍 Insights
            </button>
          </div>

          <!-- Describe → Any Diagram Panel -->
          <div id="convDescribePanel" class="ai-converter-panel">
            <div class="describe-select-row">
              <select id="describeTypeSelect" class="ai-conv-lang-select" title="Target diagram type">
                ${SUPPORTED_DIAGRAM_TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}
              </select>
              <select id="describeSampleSelect" class="ai-conv-lang-select" title="Pick a sample description">
                <option value="">📋 Presets / Samples…</option>
                ${DESCRIBE_SAMPLES.map((s, idx) => `<option value="${idx}">${s.title}</option>`).join('')}
              </select>
            </div>
            <textarea
              id="describeInput"
              class="ai-conv-input"
              rows="7"
              spellcheck="false"
              placeholder="Describe any workflow, system architecture, data model, state transition, mindmap, roadmap, or customer journey in plain English or bullet points..."
            ></textarea>
            <div class="ai-conv-actions">
              <button id="describeClearBtn" class="editor-tool-btn" type="button">Clear</button>
              <button id="describeSampleBtn" class="editor-tool-btn ai-sample-btn" type="button">📋 Load Sample</button>
              <button id="describeGenBtn" class="btn btn-ai-primary" type="button">
                <span>✨</span><span>Convert to Diagram</span>
              </button>
            </div>
            <div id="describeError" class="ai-conv-error" style="display:none;"></div>
          </div>

          <!-- SQL → ER Panel -->
          <div id="convSqlPanel" class="ai-converter-panel" style="display:none;">
            <label class="ai-label" for="convSqlInput">Paste SQL DDL (CREATE TABLE statements)</label>
            <textarea
              id="convSqlInput"
              class="ai-conv-input"
              rows="8"
              spellcheck="false"
              placeholder="CREATE TABLE users (\n  id INT PRIMARY KEY,\n  email VARCHAR(255) UNIQUE,\n  created_at TIMESTAMP\n);\n\nCREATE TABLE orders (\n  id INT PRIMARY KEY,\n  user_id INT REFERENCES users(id),\n  total DECIMAL\n);"
            ></textarea>
            <div class="ai-conv-actions">
              <button id="convSqlClearBtn" class="editor-tool-btn" type="button">Clear</button>
              <button id="convSqlSampleBtn" class="editor-tool-btn ai-sample-btn" type="button">📋 Load Sample</button>
              <button id="convSqlBtn" class="btn btn-ai-primary" type="button">
                <span>🗄️</span><span>Convert to ER Diagram</span>
              </button>
            </div>
            <div id="convSqlError" class="ai-conv-error" style="display:none;"></div>
          </div>

          <!-- Code → Class Diagram Panel -->
          <div id="convCodePanel" class="ai-converter-panel" style="display:none;">
            <div class="ai-conv-lang-row">
              <label class="ai-label" for="convCodeInput">Paste source code</label>
              <select id="convLangSelect" class="ai-conv-lang-select">
                <option value="auto">Auto-detect</option>
                <option value="typescript">TypeScript / JS</option>
                <option value="python">Python</option>
                <option value="java">Java / Kotlin</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>

            <!-- Codebase multi-file drop zone -->
            <div id="codeDropZone" class="code-drop-zone" title="Drop .ts, .js, .py, .java, .cs, .go, .rs files">
              <span class="drop-zone-icon">📂</span>
              <span class="drop-zone-text">Drop codebase files here (multi-file)</span>
              <input id="codeFileInput" type="file" multiple
                accept=".ts,.tsx,.js,.jsx,.py,.java,.kt,.cs,.go,.rs,.cpp,.c,.h"
                style="display:none;" />
            </div>
            <div id="codeFileList" class="code-file-list" style="display:none;"></div>

            <textarea
              id="convCodeInput"
              class="ai-conv-input"
              rows="6"
              spellcheck="false"
              placeholder="class UserService {&#10;  private db: Database;&#10;  async findById(id: string): Promise&lt;User&gt; {}&#10;}"
            ></textarea>
            <div class="ai-conv-actions">
              <button id="convCodeClearBtn" class="editor-tool-btn" type="button">Clear</button>
              <button id="convCodeSampleBtn" class="editor-tool-btn ai-sample-btn" type="button">📋 Load Sample</button>
              <button id="convCodeBtn" class="btn btn-ai-primary" type="button">
                <span>&lt;/&gt;</span><span>Convert to Class Diagram</span>
              </button>
            </div>
            <div id="convCodeError" class="ai-conv-error" style="display:none;"></div>
          </div>

          <!-- ER Builder Panel -->
          <div id="convErPanel" class="ai-converter-panel" style="display:none;">
            <div class="ai-label" style="margin-bottom:8px;">Visual ER Schema Builder</div>
            <div id="erBuilderTables" class="er-builder-tables"></div>
            <button id="erAddTableBtn" class="editor-tool-btn ai-sample-btn" type="button" style="width:100%;margin-top:6px;">
              + Add Table
            </button>
            <div class="ai-conv-actions" style="margin-top:8px;">
              <button id="erSampleBtn" class="editor-tool-btn ai-sample-btn" type="button">📋 Load Sample</button>
              <button id="erBuildBtn" class="btn btn-ai-primary" type="button">
                <span>📊</span><span>Build ER Diagram</span>
              </button>
            </div>
            <div id="erBuildError" class="ai-conv-error" style="display:none;"></div>
          </div>

          <!-- Onboarding Flow Panel -->
          <div id="convOnboardPanel" class="ai-converter-panel" style="display:none;">
            <label class="ai-label" for="onboardActorInput">User Persona (actor name)</label>
            <input id="onboardActorInput" type="text" class="ai-conv-lang-select"
              placeholder="e.g. New User" value="New User"
              style="width:100%;margin-bottom:8px;padding:6px 10px;font-size:12px;" />
            <label class="ai-label" for="onboardStepsInput">Onboarding Steps (one per line)</label>
            <div class="ai-conv-type-hint">
              Prefix with [decision], [error], [success], [wait], [email], [gate] for special nodes
            </div>
            <textarea
              id="onboardStepsInput"
              class="ai-conv-input"
              rows="9"
              spellcheck="false"
              placeholder="Land on Homepage&#10;[decision] Has account?&#10;Sign Up Form&#10;[email] Verify Email&#10;[gate] Email Confirmed?&#10;Complete Profile&#10;Take Product Tour&#10;[success] Activation Complete"
            ></textarea>
            <div class="ai-conv-actions">
              <button id="onboardClearBtn" class="editor-tool-btn" type="button">Clear</button>
              <button id="onboardSampleBtn" class="editor-tool-btn ai-sample-btn" type="button">📋 Load Sample</button>
              <button id="onboardGenBtn" class="btn btn-ai-primary" type="button">
                <span>🚀</span><span>Generate Flow</span>
              </button>
            </div>
            <div id="onboardError" class="ai-conv-error" style="display:none;"></div>
          </div>

          <!-- Insights Panel -->
          <div id="convInsightsPanel" class="ai-converter-panel" style="display:none;">
            <div class="insights-desc ai-conv-type-hint">
              Analyzes the diagram currently open in the editor.
            </div>
            <button id="insightsRunBtn" class="btn btn-ai-primary" type="button" style="width:100%;margin-bottom:10px;">
              <span>🔍</span><span>Analyze Current Diagram</span>
            </button>
            <div id="insightsResult" style="display:none;">
              <div class="insights-type-row">
                <span id="insightsIcon" class="insights-type-icon"></span>
                <span id="insightsTypeName" class="insights-type-name"></span>
                <span id="insightsComplexity" class="insights-complexity-badge"></span>
              </div>
              <div class="insights-stats" id="insightsStats"></div>
              <div class="insights-tips" id="insightsTips">
                <div class="insights-tips-label">💡 Suggestions</div>
                <ul id="insightsTipsList"></ul>
              </div>
            </div>
            <div id="insightsError" class="ai-conv-error" style="display:none;"></div>
          </div>
          <div id="convResultCard" class="ai-result-card" style="display:none; margin-top: 10px;">
            <div class="ai-result-header">
              <span class="ai-result-tag" id="convResultTag">Converted</span>
              <div class="ai-result-actions">
                <button id="convCopyBtn" class="editor-tool-btn" type="button">📋 Copy</button>
                <button id="convApplyBtn" class="btn btn-primary btn-sm" type="button">Apply to Canvas</button>
              </div>
            </div>
            <pre id="convResultCode" class="ai-result-code"></pre>
          </div>
        </div>
      </div>
    `;

    this.promptInput = this.container.querySelector('#aiPromptText');
    this.generateBtn = this.container.querySelector('#aiGenerateBtn');
    this.generateBtnLabel = this.container.querySelector('#aiGenerateBtnLabel');
    this.resultContainer = this.container.querySelector('#aiResultCard');
    this.resultCode = this.container.querySelector('#aiResultCode');
    this.resultEngineTag = this.container.querySelector('#aiResultEngineTag');

    this.engineTabHeuristic = this.container.querySelector('#engineTabHeuristic');
    this.engineTabQwen = this.container.querySelector('#engineTabQwen');
    this.qwenStatusCard = this.container.querySelector('#qwenStatusCard');
    this.loadQwenBtn = this.container.querySelector('#loadQwenBtn');
    this.qwenProgressWrap = this.container.querySelector('#qwenProgressWrap');
    this.qwenProgressBar = this.container.querySelector('#qwenProgressBar');
    this.qwenProgressText = this.container.querySelector('#qwenProgressText');
    this.qwenProgressPct = this.container.querySelector('#qwenProgressPct');
    this.qwenDownloadSection = this.container.querySelector('#qwenDownloadSection');
    this.qwenReadySection = this.container.querySelector('#qwenReadySection');
    this.qwenStatusBadge = this.container.querySelector('#qwenStatusBadge');

    this.engineTabOllama = this.container.querySelector('#engineTabOllama');
    this.ollamaStatusCard = this.container.querySelector('#ollamaStatusCard');
    this.ollamaStatusBadge = this.container.querySelector('#ollamaStatusBadge');
    this.ollamaReadySection = this.container.querySelector('#ollamaReadySection');
    this.ollamaReadyText = this.container.querySelector('#ollamaReadyText');
    this.ollamaModelInput = this.container.querySelector('#ollamaModelInput');
    this.testOllamaBtn = this.container.querySelector('#testOllamaBtn');
  }

  bindEvents() {
    // Engine Tab Switching
    this.engineTabHeuristic.addEventListener('click', () => {
      this.setEngineMode('heuristic');
    });

    this.engineTabQwen.addEventListener('click', () => {
      this.setEngineMode('qwen');
    });

    this.engineTabOllama.addEventListener('click', () => {
      this.setEngineMode('ollama');
    });

    // Load Qwen Button
    this.loadQwenBtn.addEventListener('click', () => {
      this.initQwenEngine();
    });

    // Test Ollama connection
    this.testOllamaBtn.addEventListener('click', () => this.testOllamaConnection());

    // Keep ollamaModel in sync with input
    this.ollamaModelInput.addEventListener('input', () => {
      this.ollamaModel = this.ollamaModelInput.value.trim() || OLLAMA_DEFAULT_MODEL;
    });

    // Generate click
    this.generateBtn.addEventListener('click', () => this.handleGenerate());

    // Enter + Cmd/Ctrl generates
    this.promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.handleGenerate();
      }
    });

    // Preset pills click
    this.container.querySelectorAll('.ai-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = AI_SUGGESTIONS[parseInt(btn.dataset.index, 10)];
        if (item) {
          this.promptInput.value = item.prompt;
          this.handleGenerate();
        }
      });
    });

    // Apply button
    this.container.querySelector('#aiApplyBtn').addEventListener('click', () => {
      if (this.generatedCode) {
        const rawPrompt = this.promptInput.value.trim();
        const title = rawPrompt ? (rawPrompt.length > 36 ? rawPrompt.slice(0, 34) + '…' : rawPrompt) : 'AI Generated Diagram';
        this.onApplyCode(this.generatedCode, title);
      }
    });

    // Copy button
    this.container.querySelector('#aiCopyBtn').addEventListener('click', async () => {
      if (this.generatedCode) {
        await navigator.clipboard.writeText(this.generatedCode);
        const btn = this.container.querySelector('#aiCopyBtn');
        const orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => (btn.textContent = orig), 1800);
      }
    });

    // ── Converter tab switching (6 tabs) ───────────────────────────────────
    this.convTabsList = [
      { tabId: 'convTabDescribe', panelId: 'convDescribePanel' },
      { tabId: 'convTabSql', panelId: 'convSqlPanel' },
      { tabId: 'convTabEr', panelId: 'convErPanel' },
      { tabId: 'convTabCode', panelId: 'convCodePanel' },
      { tabId: 'convTabOnboard', panelId: 'convOnboardPanel' },
      { tabId: 'convTabInsights', panelId: 'convInsightsPanel' },
    ];

    this.convResultCard = this.container.querySelector('#convResultCard');
    this.convResultTag  = this.container.querySelector('#convResultTag');
    this.convResultCode = this.container.querySelector('#convResultCode');
    this.convGeneratedCode = '';

    this.convTabsList.forEach(({ tabId, panelId }) => {
      const tabEl = this.container.querySelector('#' + tabId);
      if (!tabEl) return;
      tabEl.addEventListener('click', () => {
        this.convTabsList.forEach((t) => {
          const b = this.container.querySelector('#' + t.tabId);
          const p = this.container.querySelector('#' + t.panelId);
          const isActive = t.tabId === tabId;
          if (b) b.classList.toggle('active', isActive);
          if (p) p.style.display = isActive ? '' : 'none';
        });
        this.convResultCard.style.display = 'none';

        if (tabId === 'convTabInsights') {
          this.runInsightsAnalysis();
        } else if (tabId === 'convTabEr') {
          this.renderErBuilder();
        }
      });
    });

    // ── Describe → Any Diagram ──────────────────────────────────────────────
    const describeSampleSelect = this.container.querySelector('#describeSampleSelect');
    const describeTypeSelect = this.container.querySelector('#describeTypeSelect');
    const describeInput = this.container.querySelector('#describeInput');

    describeSampleSelect.addEventListener('change', () => {
      const idx = parseInt(describeSampleSelect.value, 10);
      if (!isNaN(idx) && DESCRIBE_SAMPLES[idx]) {
        const sample = DESCRIBE_SAMPLES[idx];
        describeInput.value = sample.text;
        describeTypeSelect.value = sample.type;
        this.container.querySelector('#describeGenBtn').click();
      }
    });

    this.container.querySelector('#describeClearBtn').addEventListener('click', () => {
      describeInput.value = '';
      describeSampleSelect.value = '';
      this.convResultCard.style.display = 'none';
      this.container.querySelector('#describeError').style.display = 'none';
    });

    let describeSampleIndex = 0;
    this.container.querySelector('#describeSampleBtn').addEventListener('click', () => {
      const sample = DESCRIBE_SAMPLES[describeSampleIndex % DESCRIBE_SAMPLES.length];
      describeSampleIndex++;
      describeInput.value = sample.text;
      describeTypeSelect.value = sample.type;
      describeSampleSelect.value = ((describeSampleIndex - 1) % DESCRIBE_SAMPLES.length).toString();
      this.container.querySelector('#describeError').style.display = 'none';
      this.container.querySelector('#describeGenBtn').click();
    });

    this.container.querySelector('#describeGenBtn').addEventListener('click', () => {
      const text = describeInput.value.trim();
      const targetType = describeTypeSelect.value;
      const errEl = this.container.querySelector('#describeError');
      errEl.style.display = 'none';

      if (!text) {
        describeInput.focus();
        return;
      }

      try {
        const res = describeToDiagram(text, targetType);
        this.convGeneratedCode = res.code;
        this.convResultCode.textContent = res.code;
        this.convResultTag.textContent = `${res.typeLabel} (from Description)`;
        this.convResultCard.style.display = 'block';
        this.convResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (err) {
        errEl.textContent = '⚠ ' + err.message;
        errEl.style.display = 'block';
      }
    });

    // ── SQL → ER ────────────────────────────────────────────────────────────
    this.container.querySelector('#convSqlBtn').addEventListener('click', () => {
      const sql = this.container.querySelector('#convSqlInput').value.trim();
      const errEl = this.container.querySelector('#convSqlError');
      errEl.style.display = 'none';
      if (!sql) { this.container.querySelector('#convSqlInput').focus(); return; }
      try {
        const mmd = parseSqlDdlToMermaid(sql);
        this.convGeneratedCode = mmd;
        this.convResultCode.textContent = mmd;
        this.convResultTag.textContent = '🗄️ SQL DDL → Mermaid erDiagram';
        this.convResultCard.style.display = 'block';
        this.convResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {
        errEl.textContent = '⚠ ' + e.message;
        errEl.style.display = 'block';
      }
    });

    this.container.querySelector('#convSqlClearBtn').addEventListener('click', () => {
      this.container.querySelector('#convSqlInput').value = '';
      this.convResultCard.style.display = 'none';
      this.container.querySelector('#convSqlError').style.display = 'none';
    });

    this.container.querySelector('#convSqlSampleBtn').addEventListener('click', () => {
      this.container.querySelector('#convSqlInput').value = SQL_SAMPLE;
      this.container.querySelector('#convSqlError').style.display = 'none';
      this.convResultCard.style.display = 'none';
      this.container.querySelector('#convSqlBtn').click();
    });

    // ── Code → Class Diagram & Multi-File Codebase ──────────────────────────
    const codeDropZone = this.container.querySelector('#codeDropZone');
    const codeFileInput = this.container.querySelector('#codeFileInput');

    codeDropZone.addEventListener('click', () => {
      codeFileInput.click();
    });

    codeDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      codeDropZone.classList.add('drag-over');
    });

    codeDropZone.addEventListener('dragleave', () => {
      codeDropZone.classList.remove('drag-over');
    });

    codeDropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      codeDropZone.classList.remove('drag-over');
      if (e.dataTransfer?.files?.length) {
        await this.loadCodebaseFiles(e.dataTransfer.files);
      }
    });

    codeFileInput.addEventListener('change', async () => {
      if (codeFileInput.files?.length) {
        await this.loadCodebaseFiles(codeFileInput.files);
      }
    });

    this.container.querySelector('#convCodeBtn').addEventListener('click', () => {
      const code = this.container.querySelector('#convCodeInput').value.trim();
      const errEl = this.container.querySelector('#convCodeError');
      errEl.style.display = 'none';
      if (!code) { this.container.querySelector('#convCodeInput').focus(); return; }
      try {
        const mmd = parseCodeToClassDiagram(code);
        this.convGeneratedCode = mmd;
        this.convResultCode.textContent = mmd;
        const lang = this.container.querySelector('#convLangSelect').value;
        const fileCount = this.codebaseFiles.length;
        const langLabel = fileCount > 1
          ? `Codebase (${fileCount} files)`
          : lang === 'auto'
          ? 'Source Code'
          : lang.charAt(0).toUpperCase() + lang.slice(1);
        this.convResultTag.textContent = `</> ${langLabel} → Mermaid classDiagram`;
        this.convResultCard.style.display = 'block';
        this.convResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {
        errEl.textContent = '⚠ ' + e.message;
        errEl.style.display = 'block';
      }
    });

    this.container.querySelector('#convCodeClearBtn').addEventListener('click', () => {
      this.container.querySelector('#convCodeInput').value = '';
      this.codebaseFiles = [];
      this.updateCodebaseUI();
      this.convResultCard.style.display = 'none';
      this.container.querySelector('#convCodeError').style.display = 'none';
    });

    this.container.querySelector('#convCodeSampleBtn').addEventListener('click', () => {
      this.codebaseFiles = [];
      this.updateCodebaseUI();
      this.container.querySelector('#convCodeInput').value = CODE_SAMPLE;
      this.container.querySelector('#convCodeError').style.display = 'none';
      this.convResultCard.style.display = 'none';
      this.container.querySelector('#convCodeBtn').click();
    });

    // ── Visual ER Builder ───────────────────────────────────────────────────
    this.container.querySelector('#erAddTableBtn').addEventListener('click', () => {
      const newName = `TABLE_${this.erTables.length + 1}`;
      this.erTables.push({
        name: newName,
        fields: [
          { name: 'id', type: 'uuid', key: 'PK' },
          { name: 'name', type: 'varchar', key: '' },
        ],
      });
      this.renderErBuilder();
    });

    this.container.querySelector('#erSampleBtn').addEventListener('click', () => {
      this.erTables = JSON.parse(JSON.stringify(ER_SAMPLE_TABLES));
      this.erRelations = JSON.parse(JSON.stringify(ER_SAMPLE_RELATIONS));
      this.renderErBuilder();
      this.container.querySelector('#erBuildBtn').click();
    });

    this.container.querySelector('#erBuildBtn').addEventListener('click', () => {
      const errEl = this.container.querySelector('#erBuildError');
      errEl.style.display = 'none';
      try {
        const mmd = buildErDiagram(this.erTables, this.erRelations);
        this.convGeneratedCode = mmd;
        this.convResultCode.textContent = mmd;
        this.convResultTag.textContent = '📊 Visual ER Builder → Mermaid erDiagram';
        this.convResultCard.style.display = 'block';
        this.convResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (err) {
        errEl.textContent = '⚠ ' + err.message;
        errEl.style.display = 'block';
      }
    });

    // ── Onboarding Flow Generator ───────────────────────────────────────────
    this.container.querySelector('#onboardGenBtn').addEventListener('click', () => {
      const actor = this.container.querySelector('#onboardActorInput').value.trim() || 'New User';
      const steps = this.container.querySelector('#onboardStepsInput').value.trim();
      const errEl = this.container.querySelector('#onboardError');
      errEl.style.display = 'none';
      if (!steps) {
        this.container.querySelector('#onboardStepsInput').focus();
        return;
      }
      try {
        const mmd = generateOnboardingFlow(steps, { actor });
        this.convGeneratedCode = mmd;
        this.convResultCode.textContent = mmd;
        this.convResultTag.textContent = `🚀 Onboarding Journey (${actor}) → Mermaid Flowchart`;
        this.convResultCard.style.display = 'block';
        this.convResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (err) {
        errEl.textContent = '⚠ ' + err.message;
        errEl.style.display = 'block';
      }
    });

    this.container.querySelector('#onboardClearBtn').addEventListener('click', () => {
      this.container.querySelector('#onboardStepsInput').value = '';
      this.convResultCard.style.display = 'none';
      this.container.querySelector('#onboardError').style.display = 'none';
    });

    this.container.querySelector('#onboardSampleBtn').addEventListener('click', () => {
      this.container.querySelector('#onboardActorInput').value = 'Enterprise User';
      this.container.querySelector('#onboardStepsInput').value = ONBOARDING_SAMPLE;
      this.container.querySelector('#onboardError').style.display = 'none';
      this.convResultCard.style.display = 'none';
      this.container.querySelector('#onboardGenBtn').click();
    });

    // ── Live Diagram Insights ───────────────────────────────────────────────
    this.container.querySelector('#insightsRunBtn').addEventListener('click', () => {
      this.runInsightsAnalysis();
    });

    // ── Converter result copy + apply ───────────────────────────────────────
    this.container.querySelector('#convCopyBtn').addEventListener('click', async () => {
      if (this.convGeneratedCode) {
        await navigator.clipboard.writeText(this.convGeneratedCode);
        const btn = this.container.querySelector('#convCopyBtn');
        const orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => (btn.textContent = orig), 1800);
      }
    });

    this.container.querySelector('#convApplyBtn').addEventListener('click', () => {
      if (this.convGeneratedCode) {
        const tag = this.convResultTag?.textContent || 'Converted Diagram';
        this.onApplyCode(this.convGeneratedCode, tag);
      }
    });
  }

  async loadCodebaseFiles(fileList) {
    for (const file of Array.from(fileList)) {
      try {
        const content = await file.text();
        if (!this.codebaseFiles.some((f) => f.name === file.name)) {
          this.codebaseFiles.push({
            name: file.name,
            size: file.size,
            content,
          });
        }
      } catch (err) {
        console.warn('Failed reading file:', file.name, err);
      }
    }
    this.updateCodebaseUI();
  }

  updateCodebaseUI() {
    const codeFileList = this.container.querySelector('#codeFileList');
    const convCodeInput = this.container.querySelector('#convCodeInput');
    if (!codeFileList) return;

    if (this.codebaseFiles.length === 0) {
      codeFileList.style.display = 'none';
      codeFileList.innerHTML = '';
      return;
    }

    codeFileList.style.display = 'flex';
    codeFileList.innerHTML = this.codebaseFiles
      .map(
        (f, idx) => `
      <span class="code-file-chip">
        <span class="code-file-name">📄 ${f.name}</span>
        <span class="code-file-size">${(f.size / 1024).toFixed(1)}k</span>
        <button type="button" class="code-file-del" data-idx="${idx}" title="Remove file">✕</button>
      </span>
    `
      )
      .join('');

    codeFileList.querySelectorAll('.code-file-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        this.codebaseFiles.splice(idx, 1);
        this.updateCodebaseUI();
      });
    });

    const combined = this.codebaseFiles
      .map((f) => `// ─── ${f.name} ──────────────────────────────────────\n${f.content}`)
      .join('\n\n');
    convCodeInput.value = combined;
    this.container.querySelector('#convCodeBtn').click();
  }

  renderErBuilder() {
    const container = this.container.querySelector('#erBuilderTables');
    if (!container) return;

    if (this.erTables.length === 0) {
      container.innerHTML = `
        <div class="ai-conv-type-hint" style="text-align:center;padding:12px 0;">
          No tables defined. Click "+ Add Table" or "Load Sample".
        </div>`;
      return;
    }

    container.innerHTML = this.erTables
      .map(
        (tbl, tIdx) => `
      <div class="er-table-card" data-tidx="${tIdx}">
        <div class="er-table-header">
          <input type="text" class="er-table-name-input" value="${tbl.name}" placeholder="TABLE_NAME" data-tidx="${tIdx}" />
          <button type="button" class="er-del-btn er-del-table-btn" data-tidx="${tIdx}" title="Delete Table">✕</button>
        </div>
        <div class="er-fields-list">
          ${tbl.fields
            .map(
              (f, fIdx) => `
            <div class="er-field-row" data-fidx="${fIdx}">
              <input type="text" class="er-field-input er-f-name" value="${f.name}" placeholder="field_name" data-tidx="${tIdx}" data-fidx="${fIdx}" />
              <input type="text" class="er-field-input er-f-type" value="${f.type}" placeholder="type" style="max-width:65px;" data-tidx="${tIdx}" data-fidx="${fIdx}" />
              <select class="er-field-select er-f-key" data-tidx="${tIdx}" data-fidx="${fIdx}">
                <option value="" ${f.key === '' ? 'selected' : ''}>-</option>
                <option value="PK" ${f.key === 'PK' ? 'selected' : ''}>PK</option>
                <option value="FK" ${f.key === 'FK' ? 'selected' : ''}>FK</option>
                <option value="UK" ${f.key === 'UK' ? 'selected' : ''}>UK</option>
              </select>
              <button type="button" class="er-del-btn er-del-field-btn" data-tidx="${tIdx}" data-fidx="${fIdx}" title="Delete Field">✕</button>
            </div>
          `
            )
            .join('')}
        </div>
        <button type="button" class="er-add-field-btn" data-tidx="${tIdx}">+ Add Field</button>
      </div>
    `
      )
      .join('');

    container.querySelectorAll('.er-table-name-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.tidx, 10);
        if (this.erTables[idx]) {
          this.erTables[idx].name = e.target.value.trim().toUpperCase() || 'TABLE';
        }
      });
    });

    container.querySelectorAll('.er-del-table-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.tidx, 10);
        this.erTables.splice(idx, 1);
        this.renderErBuilder();
      });
    });

    container.querySelectorAll('.er-f-name').forEach((input) => {
      input.addEventListener('input', (e) => {
        const tIdx = parseInt(e.target.dataset.tidx, 10);
        const fIdx = parseInt(e.target.dataset.fidx, 10);
        if (this.erTables[tIdx]?.fields[fIdx]) {
          this.erTables[tIdx].fields[fIdx].name = e.target.value.trim();
        }
      });
    });

    container.querySelectorAll('.er-f-type').forEach((input) => {
      input.addEventListener('input', (e) => {
        const tIdx = parseInt(e.target.dataset.tidx, 10);
        const fIdx = parseInt(e.target.dataset.fidx, 10);
        if (this.erTables[tIdx]?.fields[fIdx]) {
          this.erTables[tIdx].fields[fIdx].type = e.target.value.trim();
        }
      });
    });

    container.querySelectorAll('.er-f-key').forEach((select) => {
      select.addEventListener('change', (e) => {
        const tIdx = parseInt(e.target.dataset.tidx, 10);
        const fIdx = parseInt(e.target.dataset.fidx, 10);
        if (this.erTables[tIdx]?.fields[fIdx]) {
          this.erTables[tIdx].fields[fIdx].key = e.target.value;
        }
      });
    });

    container.querySelectorAll('.er-del-field-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tIdx = parseInt(e.currentTarget.dataset.tidx, 10);
        const fIdx = parseInt(e.currentTarget.dataset.fidx, 10);
        if (this.erTables[tIdx]) {
          this.erTables[tIdx].fields.splice(fIdx, 1);
          this.renderErBuilder();
        }
      });
    });

    container.querySelectorAll('.er-add-field-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tIdx = parseInt(e.currentTarget.dataset.tidx, 10);
        if (this.erTables[tIdx]) {
          this.erTables[tIdx].fields.push({ name: 'new_field', type: 'varchar', key: '' });
          this.renderErBuilder();
        }
      });
    });
  }

  runInsightsAnalysis() {
    const errEl = this.container.querySelector('#insightsError');
    const resultEl = this.container.querySelector('#insightsResult');
    errEl.style.display = 'none';

    const code = this.onGetDiagramCode();
    if (!code || !code.trim()) {
      errEl.textContent = '⚠ No diagram code found in the editor canvas. Create or open a diagram first.';
      errEl.style.display = 'block';
      resultEl.style.display = 'none';
      return;
    }

    const analysis = analyzeDiagram(code);
    if (!analysis) {
      errEl.textContent = '⚠ Unable to parse or analyze current diagram syntax.';
      errEl.style.display = 'block';
      resultEl.style.display = 'none';
      return;
    }

    this.container.querySelector('#insightsIcon').textContent = analysis.typeInfo.icon || '📊';
    this.container.querySelector('#insightsTypeName').textContent = `${analysis.typeInfo.label} (${analysis.lineCount} lines)`;
    const compBadge = this.container.querySelector('#insightsComplexity');
    compBadge.textContent = analysis.complexity;
    compBadge.style.color = analysis.complexityColor;
    compBadge.style.background = analysis.complexityColor + '18';
    compBadge.style.border = `1px solid ${analysis.complexityColor}55`;

    const statsContainer = this.container.querySelector('#insightsStats');
    const statEntries = [
      { label: 'Lines', val: analysis.lineCount },
      { label: 'Chars', val: analysis.charCount },
    ];
    if (analysis.metrics.nodes > 0) statEntries.push({ label: 'Nodes', val: analysis.metrics.nodes });
    if (analysis.metrics.edges > 0) statEntries.push({ label: 'Edges', val: analysis.metrics.edges });
    if (analysis.metrics.subgraphs > 0) statEntries.push({ label: 'Subgraphs', val: analysis.metrics.subgraphs });
    if (analysis.metrics.classes > 0) statEntries.push({ label: 'Classes', val: analysis.metrics.classes });
    if (analysis.metrics.relations > 0) statEntries.push({ label: 'Relations', val: analysis.metrics.relations });
    if (analysis.metrics.entities > 0) statEntries.push({ label: 'Entities', val: analysis.metrics.entities });
    if (analysis.metrics.actors > 0) statEntries.push({ label: 'Actors', val: analysis.metrics.actors });
    if (analysis.metrics.commits > 0) statEntries.push({ label: 'Commits', val: analysis.metrics.commits });
    if (analysis.metrics.states > 0) statEntries.push({ label: 'States', val: analysis.metrics.states });

    statsContainer.innerHTML = statEntries
      .map(
        (s) => `
      <div class="insights-stat-box">
        <div class="insights-stat-val">${s.val}</div>
        <div class="insights-stat-lbl">${s.label}</div>
      </div>
    `
      )
      .join('');

    const tipsList = this.container.querySelector('#insightsTipsList');
    tipsList.innerHTML = analysis.tips.map((t) => `<li>${t}</li>`).join('');

    resultEl.style.display = 'block';
  }

  setEngineMode(mode) {
    this.engineMode = mode;

    // Reset all tabs
    [this.engineTabHeuristic, this.engineTabQwen, this.engineTabOllama].forEach((tab) => {
      tab.classList.remove('active', 'qwen-active');
      tab.setAttribute('aria-checked', 'false');
    });
    this.qwenStatusCard.style.display = 'none';
    this.ollamaStatusCard.style.display = 'none';

    if (mode === 'heuristic') {
      this.engineTabHeuristic.classList.add('active');
      this.engineTabHeuristic.setAttribute('aria-checked', 'true');
      this.generateBtnLabel.textContent = 'Generate (Instant)';
    } else if (mode === 'qwen') {
      this.engineTabQwen.classList.add('active', 'qwen-active');
      this.engineTabQwen.setAttribute('aria-checked', 'true');
      this.qwenStatusCard.style.display = 'flex';
      this.generateBtnLabel.textContent = this.qwenLoaded ? 'Generate with Qwen' : 'Load Qwen & Generate';
      if (!this.hasWebGPU) {
        this.qwenStatusBadge.textContent = '⚠️ WebGPU not detected';
        this.qwenStatusBadge.style.color = 'var(--warning)';
      }
    } else if (mode === 'ollama') {
      this.engineTabOllama.classList.add('active', 'qwen-active');
      this.engineTabOllama.setAttribute('aria-checked', 'true');
      this.ollamaStatusCard.style.display = 'flex';
      this.generateBtnLabel.textContent = 'Generate with Local Model';
    }
  }

  async initQwenEngine() {
    if (this.qwenLoaded || this.qwenLoading) return;

    this.qwenLoading = true;
    this.loadQwenBtn.disabled = true;
    this.qwenProgressWrap.style.display = 'flex';
    this.qwenProgressBar.style.width = '0%';
    this.qwenProgressPct.textContent = '0%';
    this.qwenProgressText.textContent = 'Connecting to Hugging Face CDN…';

    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

      this.qwenEngine = await CreateMLCEngine(QWEN_MODEL_ID, {
        initProgressCallback: (report) => {
          const pct = Math.round((report.progress || 0) * 100);
          this.qwenProgressBar.style.width = `${pct}%`;
          this.qwenProgressPct.textContent = `${pct}%`;
          this.qwenProgressText.textContent = report.text || 'Loading weights into WebAssembly memory…';
        },
      });

      this.qwenLoaded = true;
      this.qwenLoading = false;
      this.qwenDownloadSection.style.display = 'none';
      this.qwenReadySection.style.display = 'block';
      this.generateBtnLabel.textContent = 'Generate with Qwen';
    } catch (err) {
      console.error('Qwen initialization failed:', err);
      this.qwenLoading = false;
      this.loadQwenBtn.disabled = false;
      this.qwenProgressText.textContent = `Error: ${err.message || 'Failed to initialize WebLLM'}`;
      this.qwenProgressText.style.color = 'var(--danger)';
    }
  }

  async handleGenerate() {
    const prompt = this.promptInput.value.trim();
    if (!prompt) {
      this.promptInput.focus();
      return;
    }
    const targetType = this.container.querySelector('#aiDiagramTypeSelect')?.value || 'auto';

    if (this.engineMode === 'qwen') {
      await this.handleGenerateQwen(prompt, targetType);
    } else if (this.engineMode === 'ollama') {
      await this.handleGenerateOllama(prompt, targetType);
    } else {
      await this.handleGenerateHeuristic(prompt, targetType);
    }
  }

  async handleGenerateQwen(prompt, targetType = 'auto') {
    if (!this.qwenLoaded) {
      await this.initQwenEngine();
      if (!this.qwenLoaded) {
        // Fallback to heuristic if user cancel/error
        console.warn('Falling back to instant generator due to Qwen load issue.');
        await this.handleGenerateHeuristic(prompt, targetType);
        return;
      }
    }

    // Set loading state
    this.generateBtn.disabled = true;
    this.generateBtn.innerHTML = `
      <span class="ai-spinner"></span>
      <span>Qwen Thinking…</span>
    `;

    this.resultContainer.style.display = 'block';
    this.resultEngineTag.textContent = 'Generated with Qwen2.5-Coder (Local Wasm/WebGPU)';
    this.resultCode.textContent = 'Generating tokens…';
    this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    let rawText = '';
    try {
      const typeInstruction = targetType && targetType !== 'auto'
        ? `Generate a Mermaid ${targetType} diagram for: ${prompt}`
        : `Generate a Mermaid diagram for: ${prompt}`;

      const completion = await this.qwenEngine.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert Mermaid diagram generator. Output ONLY valid Mermaid syntax inside a single ```mermaid ... ``` block. No explanations, no commentary.',
          },
          {
            role: 'user',
            content: typeInstruction,
          },
        ],
        stream: true,
        temperature: 0.1,
        max_tokens: 600,
      });

      for await (const chunk of completion) {
        const choice = chunk.choices[0];
        const delta = choice?.delta?.content || '';
        rawText += delta;
        this.resultCode.textContent = this.extractMermaidCode(rawText) || rawText;
        if (choice?.finish_reason && choice.finish_reason !== 'null') break;
      }

      const extracted = this.extractMermaidCode(rawText);
      this.generatedCode = extracted || rawText.trim();
      this.resultCode.textContent = this.generatedCode;
    } catch (err) {
      const isEOF = err?.message?.toLowerCase().includes('eof') ||
                    err?.message?.toLowerCase().includes('stream');

      if (isEOF && rawText.length > 10) {
        console.warn('WebLLM stream EOF — salvaging partial output:', rawText.length, 'chars');
        const extracted = this.extractMermaidCode(rawText);
        if (extracted) {
          this.generatedCode = extracted;
          this.resultCode.textContent = extracted;
          this.resultEngineTag.textContent = 'Qwen (stream recovered ✓)';
          this.qwenEngine = null;
          this.qwenLoaded = false;
          this.qwenReadySection.style.display = 'none';
          this.qwenDownloadSection.style.display = 'block';
          return;
        }
      }

      console.error('Qwen generation error:', err);
      if (isEOF) {
        this.qwenEngine = null;
        this.qwenLoaded = false;
        this.qwenReadySection.style.display = 'none';
        this.qwenDownloadSection.style.display = 'block';
      }
      const fallback = this.synthesizeDiagramFromPrompt(prompt, targetType);
      this.generatedCode = fallback;
      this.resultCode.textContent = fallback;
      this.resultEngineTag.textContent = '⚠️ Instant Generator Fallback (Qwen reset)';
    } finally {
      this.generateBtn.disabled = false;
      this.generateBtn.innerHTML = `
        <span class="ai-btn-icon">✨</span>
        <span>${this.generateBtnLabel.textContent || 'Generate Diagram'}</span>
      `;
    }
  }

  async testOllamaConnection() {
    this.testOllamaBtn.disabled = true;
    this.testOllamaBtn.textContent = 'Testing…';
    try {
      const res = await fetch(`${this.ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models = (data.models || []).map((m) => m.name);
      this.ollamaConnected = true;
      this.ollamaReadySection.style.display = 'block';
      this.ollamaReadyText.textContent = `Connected — ${models.length} model(s) available`;
      this.ollamaStatusBadge.textContent = '✓ Online';
      this.ollamaStatusBadge.style.color = 'var(--success, #34d399)';
      this.generateBtnLabel.textContent = 'Generate with Local Model';
    } catch (err) {
      this.ollamaStatusBadge.textContent = '✗ Offline';
      this.ollamaStatusBadge.style.color = 'var(--danger, #f87171)';
      this.ollamaReadySection.style.display = 'block';
      this.ollamaReadyText.textContent = `Cannot reach Ollama: ${err.message}`;
    } finally {
      this.testOllamaBtn.disabled = false;
      this.testOllamaBtn.textContent = 'Test';
    }
  }

  async handleGenerateOllama(prompt, targetType = 'auto') {
    this.generateBtn.disabled = true;
    this.generateBtn.innerHTML = `
      <span class="ai-spinner"></span>
      <span>Local Model Thinking…</span>
    `;

    this.resultContainer.style.display = 'block';
    this.resultEngineTag.textContent = `Generating with ${this.ollamaModel} (Ollama)…`;
    this.resultCode.textContent = 'Connecting to local model…';
    this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    let rawText = '';
    let reader = null;

    try {
      const typeInstruction = targetType && targetType !== 'auto'
        ? `Generate a Mermaid ${targetType} diagram for: ${prompt}`
        : `Generate a Mermaid diagram for: ${prompt}`;

      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert Mermaid diagram generator. Output ONLY valid Mermaid syntax inside a single ```mermaid ... ``` block. No explanations.',
            },
            {
              role: 'user',
              content: typeInstruction,
            },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      this.resultCode.textContent = '';

      outer: while (true) {
        let done = false;
        let value;
        try {
          ({ done, value } = await reader.read());
        } catch (streamErr) {
          console.warn('Ollama stream read error (salvaging):', streamErr.message);
          break;
        }
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed);
            const delta = data.message?.content ?? data.response ?? '';
            rawText += delta;
            this.resultCode.textContent = this.extractMermaidCode(rawText) || rawText;
            if (data.done) break outer;
          } catch {
            // ignore JSON fragment
          }
        }
      }

      const extracted = this.extractMermaidCode(rawText);
      this.generatedCode = extracted || rawText.trim();
      this.resultCode.textContent = this.generatedCode;
      this.resultEngineTag.textContent = `✓ ${this.ollamaModel} via Ollama`;
    } catch (err) {
      console.error('Ollama generation error:', err);

      if (rawText.length > 10) {
        const extracted = this.extractMermaidCode(rawText);
        if (extracted) {
          this.generatedCode = extracted;
          this.resultCode.textContent = extracted;
          this.resultEngineTag.textContent = `⚠️ ${this.ollamaModel} (stream recovered)`;
          return;
        }
      }

      const fallback = this.synthesizeDiagramFromPrompt(prompt, targetType);
      this.generatedCode = fallback;
      this.resultCode.textContent = fallback;
      this.resultEngineTag.textContent = '⚠️ Instant Fallback (Ollama unreachable)';
    } finally {
      try { reader?.cancel(); } catch { /* ignore */ }
      this.generateBtn.disabled = false;
      this.generateBtn.innerHTML = `
        <span class="ai-btn-icon">✨</span>
        <span>Generate with Local Model</span>
      `;
    }
  }

  extractMermaidCode(text) {
    if (!text) return '';
    const closed = text.match(/```(?:mermaid)?\s*([\s\S]*?)```/i);
    if (closed?.[1]) return closed[1].trim();

    const open = text.match(/```(?:mermaid)?\s*([\s\S]+)/i);
    if (open?.[1]) return open[1].trim();

    return text.replace(/```(?:mermaid)?/gi, '').trim();
  }

  async handleGenerateHeuristic(prompt, targetType = 'auto') {
    this.generateBtn.disabled = true;
    this.generateBtn.innerHTML = `
      <span class="ai-spinner"></span>
      <span>Generating…</span>
    `;

    await new Promise((r) => setTimeout(r, 120));

    try {
      const res = describeToDiagram(prompt, targetType);
      this.generatedCode = res.code;
      this.resultEngineTag.textContent = `Generated with Instant Engine (${res.typeLabel})`;
      this.resultCode.textContent = res.code;
      this.resultContainer.style.display = 'block';
      this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      const code = this.synthesizeDiagramFromPrompt(prompt, targetType);
      this.generatedCode = code;
      this.resultEngineTag.textContent = 'Generated with Instant Heuristic Engine';
      this.resultCode.textContent = code;
      this.resultContainer.style.display = 'block';
      this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
      this.generateBtn.disabled = false;
      this.generateBtn.innerHTML = `
        <span class="ai-btn-icon">✨</span>
        <span>Generate (Instant)</span>
      `;
    }
  }

  synthesizeDiagramFromPrompt(prompt, targetType = 'auto') {
    if (targetType && targetType !== 'auto') {
      try {
        return describeToDiagram(prompt, targetType).code;
      } catch (err) {
        console.warn('describeToDiagram error:', err);
      }
    }

    const p = prompt.toLowerCase();

    // 1. Sequence Diagram check
    if (p.includes('sequence') || p.includes('oauth') || p.includes('jwt') || p.includes('login') || p.includes('webhook') || p.includes('auth flow')) {
      return `sequenceDiagram
    autonumber
    actor User as Client / User
    participant App as Web / Mobile App
    participant Auth as Auth Server (OAuth2/OIDC)
    participant API as Backend API
    participant DB as Database

    User->>App: Click "Sign in with SSO"
    App->>Auth: Request Authorization Code (PKCE challenge)
    Auth-->>User: Present Login & Consent screen
    User->>Auth: Submit credentials
    Auth-->>App: Return Auth Code & Redirect
    App->>Auth: Exchange Code + PKCE Verifier for Tokens
    Auth-->>App: Issue ID Token & Access Token (JWT)
    App->>API: GET /api/v1/profile (Bearer token)
    API->>API: Validate JWT Signature & Scopes
    API->>DB: Query user records
    DB-->>API: Return account profile
    API-->>App: 200 OK (User Profile JSON)
    App-->>User: Display authenticated dashboard`;
    }

    // 2. ER Diagram check
    if (p.includes('er') || p.includes('database') || p.includes('schema') || p.includes('relational') || p.includes('postgres') || p.includes('sql') || p.includes('tables')) {
      return `erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ REVIEWS : writes
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : ordered_in
    PRODUCTS }|--|| CATEGORIES : belongs_to
    ORDERS ||--|| PAYMENTS : settled_by

    USERS {
        uuid id PK
        string email UK
        string full_name
        string role
        timestamp created_at
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        decimal total_amount
        string status
        timestamp placed_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal unit_price
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        string sku UK
        string name
        decimal price
        int stock_level
    }

    CATEGORIES {
        uuid id PK
        string slug UK
        string name
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        string provider
        decimal amount
        string status
        timestamp processed_at
    }`;
    }

    // 3. State Machine check
    if (p.includes('state') || p.includes('lifecycle') || p.includes('status')) {
      return `stateDiagram-v2
    [*] --> Draft : Create New

    Draft --> InReview : Submit for Review
    InReview --> ChangesRequested : Request Revisions
    ChangesRequested --> InReview : Re-submit

    InReview --> Approved : Approve
    Approved --> Scheduled : Schedule Delivery
    Scheduled --> InProgress : Start Execution

    InProgress --> QA_Verification : Complete Tasks
    QA_Verification --> InProgress : QA Failed
    QA_Verification --> ReadyToDeploy : QA Passed

    ReadyToDeploy --> Deployed : Canary / Production Release
    Deployed --> Closed : Verified in Prod

    Draft --> Cancelled : Discard
    InReview --> Cancelled : Reject
    Cancelled --> [*]
    Closed --> [*]`;
    }

    // 4. Git Graph check
    if (p.includes('git') || p.includes('branch') || p.includes('trunk') || p.includes('merge')) {
      return `gitGraph
    commit id: "Initial project setup"
    branch develop
    checkout develop
    commit id: "Setup CI test suite"
    branch feat/auth
    checkout feat/auth
    commit id: "Add JWT auth controller"
    commit id: "Add login page UI"
    checkout develop
    merge feat/auth id: "Merge PR #14: Auth feature"
    branch release/v1.0
    checkout release/v1.0
    commit id: "Bump version to 1.0.0"
    checkout main
    merge release/v1.0 tag: "v1.0.0" id: "Production release v1.0.0"
    checkout develop
    merge release/v1.0 id: "Sync release back to develop"`;
    }

    // 5. Cloud / Microservices / Architecture Flowchart
    if (p.includes('aws') || p.includes('cloud') || p.includes('microservice') || p.includes('kubernetes') || p.includes('docker') || p.includes('kafka') || p.includes('serverless')) {
      return `flowchart TD
    subgraph Clients["Edge & Clients"]
        WEB["🌐 Web Application (React/Next.js)"]
        MOBILE["📱 iOS & Android Mobile Apps"]
        CDN["⚡ Cloudflare / CloudFront CDN"]
    end

    subgraph Edge["Security & Gateway"]
        WAF["🛡️ AWS WAF & Rate Limiter"]
        APIGW["🚪 Kong / API Gateway"]
        AUTH["🔐 Auth0 / Cognito Service"]
    end

    subgraph CoreServices["Microservices Mesh"]
        AUTH_SVC["User & Auth Service"]
        ORDER_SVC["Order Processing Service"]
        PAY_SVC["Payment & Billing Service"]
        NOTIF_SVC["Notification Engine"]
    end

    subgraph Messaging["Event Stream & Queue"]
        KAFKA{{"📨 Apache Kafka / RabbitMQ"}}
    end

    subgraph DataTier["Persistence & Cache"]
        REDIS[("⚡ Redis Cluster (Cache & Sessions)")]
        POSTGRES[("🐘 PostgreSQL Primary (ACID Data)")]
        S3[("🪣 Amazon S3 Object Storage")]
    end

    WEB & MOBILE --> CDN --> WAF --> APIGW
    APIGW -.->|Validate JWT| AUTH
    APIGW --> AUTH_SVC
    APIGW --> ORDER_SVC
    APIGW --> PAY_SVC

    AUTH_SVC & ORDER_SVC & PAY_SVC <--> REDIS
    AUTH_SVC & ORDER_SVC & PAY_SVC --> POSTGRES
    PAY_SVC --> S3

    ORDER_SVC -->|Publish Event| KAFKA
    KAFKA -->|Consume Message| NOTIF_SVC
    KAFKA -->|Consume Message| PAY_SVC

    classDef edge fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
    classDef service fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    classDef broker fill:#3b0764,stroke:#c084fc,stroke-width:2px,color:#fff
    classDef storage fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff

    class WEB,MOBILE,CDN,WAF,APIGW edge
    class AUTH_SVC,ORDER_SVC,PAY_SVC,NOTIF_SVC service
    class KAFKA broker
    class REDIS,POSTGRES,S3 storage`;
    }

    // 6. Generic intelligent flowchart synthesis based on user keywords
    const words = prompt.split(/[\s,\-\–\—>]+/).filter((w) => w.length > 2);
    const nodes = words.slice(0, 7).map((word, i) => {
      const clean = word.replace(/[^a-zA-Z0-9]/g, '');
      const label = clean.charAt(0).toUpperCase() + clean.slice(1);
      return { id: `N${i + 1}`, label: `${label} Service` };
    });

    if (nodes.length < 3) {
      nodes.push({ id: 'N1', label: 'User Request' });
      nodes.push({ id: 'N2', label: 'Processing Engine' });
      nodes.push({ id: 'N3', label: 'Verified Output' });
    }

    let links = '';
    for (let i = 0; i < nodes.length - 1; i++) {
      links += `    ${nodes[i].id} -->|Step ${i + 1}| ${nodes[i + 1].id}\n`;
    }

    return `flowchart LR
    ${nodes.map((n) => `${n.id}["${n.label}"]`).join('\n    ')}

${links}
    classDef default fill:#111827,stroke:#6366f1,stroke-width:2px,color:#fff`;
  }
}
