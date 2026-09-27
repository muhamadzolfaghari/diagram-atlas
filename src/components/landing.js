import { renderMermaid } from '../utils/mermaid-renderer.js';

export const LANDING_DEMOS = [
  {
    id: 'arch',
    label: 'Cloud Architecture',
    code: `---
config:
  theme: dark
---
flowchart LR
    Client["🌐 Edge Clients"]
    WAF["🛡️ Cloud WAF"]
    GW["🚪 API Gateway"]
    Auth["🔐 Auth Service"]
    Pay["💳 Payment Service"]
    DB[("🐘 PostgreSQL")]
    Kafka{{"📨 Event Bus"}}

    Client --> WAF --> GW
    GW --> Auth
    GW --> Pay
    Pay --> DB
    Pay --> Kafka

    classDef default fill:#111827,stroke:#6366f1,stroke-width:2px,color:#fff
    classDef highlight fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    class Pay,DB,Kafka highlight`
  },
  {
    id: 'auth',
    label: 'OAuth2 PKCE Flow',
    code: `sequenceDiagram
    autonumber
    actor User as Client Browser
    participant App as Mermaid Studio
    participant Auth as Auth Server
    participant API as Secure API

    User->>App: Click "Sign in"
    App->>Auth: Authorize with Code Challenge
    Auth-->>User: Present Consent Screen
    User->>Auth: Approve Login
    Auth-->>App: Return Auth Code
    App->>Auth: Exchange Code + Verifier
    Auth-->>App: Issue Access Token (JWT)
    App->>API: Fetch User Profile
    API-->>App: 200 OK Profile JSON`
  },
  {
    id: 'db',
    label: 'Database Schema',
    code: `erDiagram
    USERS ||--o{ ORDERS : places
    ORDERS ||--|{ ITEMS : contains
    PRODUCTS ||--o{ ITEMS : included_in
    ORDERS ||--|| PAYMENTS : settled_by

    USERS {
        uuid id PK
        string email UK
        string full_name
    }
    ORDERS {
        uuid id PK
        uuid user_id FK
        decimal total
        string status
    }
    ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
    }
    PAYMENTS {
        uuid id PK
        uuid order_id FK
        string status
    }`
  },
  {
    id: 'gantt',
    label: 'Delivery Roadmap',
    code: `gantt
    title Delivery Sequence Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Foundations
    Core Design Tokens      :done, 2026-09-01, 7d
    CAD Canvas Controller   :done, 2026-09-08, 10d

    section AI & Exports
    Dual Engine AI Studio   :active, 2026-09-18, 6d
    Vector PDF & Standalone :crit, 2026-09-24, 5d

    section Launch
    Public Release          :milestone, 2026-09-30, 0d`
  }
];

export class LandingPageController {
  constructor(options) {
    this.landingViewEl = options.landingViewEl;
    this.studioAppEl = options.studioAppEl;
    this.onLaunchStudio = options.onLaunchStudio || (() => {});

    this.activeDemoIndex = 0;
    this.demoCodeEl = null;
    this.demoStageEl = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.initHeroDemo();
  }

  bindEvents() {
    // Launch Studio buttons
    document.querySelectorAll('[data-action="launch-studio"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const templateId = btn.dataset.template;
        this.showStudio(templateId);
      });
    });

    // Return to Landing Page from Studio header
    document.querySelectorAll('[data-action="open-landing"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLanding();
      });
    });

    // FAQ Accordion toggles
    document.querySelectorAll('.faq-question-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    });

    // Browser navigation back/forward support
    window.addEventListener('hashchange', () => {
      this.syncViewWithHash();
    });

    // Check initial hash
    this.syncViewWithHash();
  }

  syncViewWithHash() {
    const hash = window.location.hash;
    if (hash === '#studio' || hash === '#editor') {
      this.showStudio(null, false);
    } else if (hash === '#landing' || hash === '' || hash === '#home') {
      this.showLanding(false);
    }
  }

  showStudio(templateId = null, updateHash = true) {
    if (this.landingViewEl) this.landingViewEl.classList.add('landing-hidden');
    if (this.studioAppEl) this.studioAppEl.classList.remove('studio-hidden');
    if (updateHash) {
      window.location.hash = '#studio';
    }
    this.onLaunchStudio(templateId);
  }

  showLanding(updateHash = true) {
    if (this.studioAppEl) this.studioAppEl.classList.add('studio-hidden');
    if (this.landingViewEl) this.landingViewEl.classList.remove('landing-hidden');
    if (updateHash) {
      window.location.hash = '#home';
    }
  }

  async initHeroDemo() {
    this.demoCodeEl = document.getElementById('heroDemoCode');
    this.demoStageEl = document.getElementById('heroDemoStage');

    if (!this.demoCodeEl || !this.demoStageEl) return;

    // Bind tab clicks
    document.querySelectorAll('.hero-tab-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hero-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadDemo(idx);
      });
    });

    // Load initial demo
    await this.loadDemo(0);
  }

  async loadDemo(index) {
    this.activeDemoIndex = index;
    const demo = LANDING_DEMOS[index] || LANDING_DEMOS[0];
    if (this.demoCodeEl) {
      this.demoCodeEl.textContent = demo.code;
    }
    if (this.demoStageEl) {
      try {
        await renderMermaid(this.demoStageEl, demo.code);
      } catch (err) {
        console.warn('Hero demo render error:', err);
      }
    }
  }
}
