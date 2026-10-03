/**
 * DiagramAtlas Universal Diagram & Design Specification Templates
 * Covers:
 * 1. Complete UML 2.5 Specification (All 14 Diagrams: Structure, Behavior, Interaction)
 * 2. Product Management & Design Thinking (Journeys, Kanban, Quadrants, Roadmaps, Funnels)
 * 3. Enterprise Architecture & Cloud (C4 Model, Kubernetes Mesh, Microservices, Hardware Blocks)
 * 4. Engineering, Data & DevOps (ER Schema, Git Trunk-Flow, SLA Metrics)
 */

export const DIAGRAM_TEMPLATES = [
  // ==========================================
  // CATEGORY 1: UML SPECIFICATION (ALL 14 DIAGRAMS)
  // ==========================================
  {
    id: 'class-diagram',
    title: '1. Class Diagram (UML Structure)',
    category: 'UML Specification',
    kind: 'class',
    description: 'Object-oriented class hierarchies, private/public attributes, methods, inheritance, and composition.',
    code: `classDiagram
    class CanvasController {
        -Number zoom
        -Number panX
        -Number panY
        -HTMLElement canvas
        -HTMLElement stage
        +setZoom(val, anchorX, anchorY)
        +fit(animate)
        +reset(animate)
        +measure()
        +applyTransform()
    }

    class EditorController {
        -HTMLTextAreaElement textarea
        -HTMLElement lineNumbers
        -HTMLElement statusDot
        -HTMLElement stats
        +getValue() String
        +setValue(code)
        +formatCode()
        +setStatus(type, msg)
        +updateStats()
    }

    class Exporter {
        +exportSvg(container, filename)
        +exportPng(container, scale, filename)
        +exportPdf(container, mode, filename)
        +exportMarkdown(code, filename)
        -renderToCanvas(container, scale)
    }

    class StorageManager {
        +saveDraft(code, templateId)
        +getDraft() Object
        +saveNamedDiagram(name, code, templateId)
        +listSavedDiagrams() Array
        +deleteDiagram(id)
    }

    CanvasController <|-- InteractiveStage : inherits
    CanvasController *-- MiniMapController : owns
    EditorController ..> StorageManager : autosaves
    Exporter ..> CanvasController : captures
`,
  },
  {
    id: 'sequence-auth',
    title: '2. Sequence Diagram (UML Interaction)',
    category: 'UML Specification',
    kind: 'sequence',
    description: 'Interactive message sequence with parallel activations, alt guards, and cryptographic token verification.',
    code: `sequenceDiagram
    autonumber
    actor User as User / Client
    participant App as DiagramAtlas SPA
    participant Auth as Auth Gateway (Wasm)
    participant OAuth as Identity Provider
    participant API as Backend Services

    User->>App: Click "Authorize via OAuth 2.1"
    App->>Auth: Generate PKCE code_verifier & challenge
    Auth-->>App: Hash verified (SHA-256)
    App->>OAuth: Redirect to /authorize?code_challenge
    OAuth->>User: Display consent prompt
    User->>OAuth: Grant permissions
    OAuth-->>App: Authorization Code redirect
    App->>Auth: Exchange Code + code_verifier
    Auth->>OAuth: POST /token (backchannel)
    OAuth-->>Auth: Access Token + Refresh Token (JWT)
    Auth-->>App: Secure HttpOnly Cookie session
    App->>API: GET /api/v1/projects (Bearer JWT)
    API-->>App: 200 OK (User Workspace Data)
    App-->>User: Render Canvas Dashboard
`,
  },
  {
    id: 'state-diagram',
    title: '3. State Machine Diagram (UML Behavior)',
    category: 'UML Specification',
    kind: 'state',
    description: 'UML finite state machine with composite states, fork transitions, and error recovery lifecycles.',
    code: `stateDiagram-v2
    [*] --> Idle: Application Start

    state EditingSession {
        [*] --> Clean
        Clean --> Dirty: Keystroke detected
        Dirty --> Debouncing: 200ms debounce timer
        Debouncing --> Rendering: Trigger Parser
        
        state Rendering {
            [*] --> ValidatingSyntax
            ValidatingSyntax --> CompilingSVG: Syntax Valid
            ValidatingSyntax --> SyntaxError: Syntax Invalid
            CompilingSVG --> Clean: Render Success
        }
    }

    EditingSession --> PresentationMode: Press 'P' key
    PresentationMode --> EditingSession: Press 'ESC'

    EditingSession --> Exporting: Select Export (PNG / SVG / PDF)
    state Exporting {
        [*] --> HighDPIRasterize
        HighDPIRasterize --> WasmLinearMemoryComposite
        WasmLinearMemoryComposite --> BlobDownloadReady
    }
    Exporting --> EditingSession: Download complete

    EditingSession --> [*]: Close Tab
`,
  },
  {
    id: 'uml-usecase',
    title: '4. Use Case Diagram (UML Behavior)',
    category: 'UML Specification',
    kind: 'flowchart',
    description: 'Actors, system boundaries, use case ovals, <<include>> dependencies, and <<extend>> extensions.',
    code: `flowchart LR
    Customer((fa:fa-user Customer))
    Admin((fa:fa-user-shield System Admin))
    BankSystem[(Core Banking Gateway)]

    subgraph SystemBoundary [Online Banking Portal]
        UC1([View Account Balances])
        UC2([Transfer Funds])
        UC3([2FA Biometric Check])
        UC4([Export PDF Statement])
        UC5([Manage Access Roles])
        UC6([Audit Incident Logs])
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC4
    UC2 -.->|"<<include>>"| UC3
    UC4 -.->|"<<extend>>"| UC1
    UC2 --> BankSystem

    Admin --> UC5
    Admin --> UC6
    UC6 --> BankSystem
`,
  },
  {
    id: 'uml-activity',
    title: '5. Activity Diagram (UML Behavior)',
    category: 'UML Specification',
    kind: 'flowchart',
    description: 'Initial node, decision diamonds, parallel fork & join synchronization bars, and activity final states.',
    code: `flowchart TD
    Start((*)) --> Init[Submit Order Request]
    Init --> CheckInventory{Inventory Available?}

    CheckInventory -->|No| Backorder[Queue Backorder Notification]
    Backorder --> NotifyUser[Send Email to Customer]
    NotifyUser --> CancelOrder((X))

    CheckInventory -->|Yes| Fork1[=================== Fork Parallel ===================]
    
    Fork1 --> DeductStock[Deduct Item from Warehouse]
    Fork1 --> ChargeCard[Charge Customer Credit Card]
    Fork1 --> GenerateInvoice[Generate PDF Tax Invoice]

    DeductStock --> Join1[=================== Join Synchronization ===================]
    ChargeCard --> Join1
    GenerateInvoice --> Join1

    Join1 --> Dispatch[Dispatch Logistics Shipping Label]
    Dispatch --> CompleteFinal((O))
`,
  },
  {
    id: 'uml-component',
    title: '6. Component Diagram (UML Structure)',
    category: 'UML Specification',
    kind: 'flowchart',
    description: 'Component stereotypes, provided and required interfaces, ports, and inter-service dependencies.',
    code: `flowchart TD
    subgraph OrderSubsystem [Order Management Subsystem]
        OrderGateway[<<component>>\\nOrder API Gateway]
        PaymentEngine[<<component>>\\nPayment Processor Engine]
        StockController[<<component>>\\nInventory Stock Controller]
    end

    WebClient[<<component>>\\nNext.js Web Client]
    MobileApp[<<component>>\\nFlutter Mobile App]
    StripeAPI[(External Stripe Gateway)]
    WarehouseDB[(Warehouse Postgres DB)]

    WebClient -->|"REST / JSON"| OrderGateway
    MobileApp -->|"GraphQL"| OrderGateway
    
    OrderGateway -->|"gRPC Binary"| PaymentEngine
    OrderGateway -->|"gRPC Binary"| StockController

    PaymentEngine -->|"HTTPS / TLS 1.3"| StripeAPI
    StockController -->|"TCP / Port 5432"| WarehouseDB
`,
  },
  {
    id: 'uml-deployment',
    title: '7. Deployment Diagram (UML Structure)',
    category: 'UML Specification',
    kind: 'flowchart',
    description: 'Hardware nodes, execution environments, artifact packages, communication protocols, and cloud topology.',
    code: `flowchart TB
    subgraph ClientDevice [Client Device: macOS / Linux / Windows]
        BrowserRuntime[<<execution environment>>\\nV8 / WebKit Runtime]
        SPAArtifact[<<artifact>>\\nDiagramAtlas WebAssembly SPA Bundle]
        BrowserRuntime --- SPAArtifact
    end

    subgraph AWSCloud [Cloud Infrastructure: AWS us-east-1]
        subgraph EdgeCluster [Edge Network: Cloudflare CDN]
            EdgeRouter[<<node>>\\nEdge TLS Termination & WAF]
        end

        subgraph K8sCluster [Kubernetes Production Cluster]
            IngressEnvoy[<<node>>\\nEnvoy Ingress Gateway]
            subgraph Pod1 [DiagramAtlas Pod: Replica 1]
                FastAPIServer[<<execution environment>>\\nFastAPI Python ASGI]
                WasmRustKernel[<<artifact>>\\nghostwire_core.so]
                FastAPIServer --- WasmRustKernel
            end
        end

        subgraph DataVPC [Isolated Data VPC: Private Subnet]
            PostgresNode[<<node>>\\nAmazon Aurora PostgreSQL Primary]
            RedisNode[<<node>>\\nAmazon ElastiCache Redis Cluster]
        end
    end

    SPAArtifact -->|"HTTPS / WSS (TLS 1.3)"| EdgeRouter
    EdgeRouter -->|"Internal Backplane"| IngressEnvoy
    IngressEnvoy -->|"Cluster IP"| FastAPIServer
    FastAPIServer -->|"TCP : 5432"| PostgresNode
    FastAPIServer -->|"TCP : 6379"| RedisNode
`,
  },
  {
    id: 'uml-package',
    title: '8. Package Diagram (UML Structure)',
    category: 'UML Specification',
    kind: 'flowchart',
    description: 'Namespace decomposition, layer modularization, import dependencies, and domain-driven design bounds.',
    code: `flowchart TD
    subgraph PresentationLayer [<<package>> Presentation Layer]
        Controllers[API Routing Controllers]
        Presenters[JSON & Protobuf Serializers]
        Middlewares[Auth & Rate Limit Middlewares]
    end

    subgraph ApplicationLayer [<<package>> Application Layer]
        UseCases[Application Use Cases]
        Commands["Command Handlers (CQRS)"]
        Queries[Query Handlers]
    end

    subgraph DomainLayer [<<package>> Core Domain Model]
        Entities[Domain Entities]
        ValueObjects[Immutable Value Objects]
        DomainEvents[Domain Event Subsystem]
        RepositoryInterfaces[Repository Interfaces]
    end

    subgraph InfrastructureLayer [<<package>> Infrastructure Layer]
        PostgresRepos[Postgres Repository Impls]
        RedisCacheAdapter[Redis Fast-Path Cache]
        ExternalAPIs[Third-Party Service Clients]
    end

    PresentationLayer -.->|imports| ApplicationLayer
    ApplicationLayer -.->|imports| DomainLayer
    InfrastructureLayer -.->|implements| DomainLayer
`,
  },
  {
    id: 'uml-object',
    title: '9. Object Diagram (UML Structure)',
    category: 'UML Specification',
    kind: 'class',
    description: 'Concrete runtime instance specifications, assigned state values, and instance link relationships.',
    code: `classDiagram
    class UserInstance_1042 {
        :User
        userId = 1042
        email = "lead.dev@enterprise.com"
        role = "OrganizationAdmin"
        isMfaVerified = true
    }

    class ProjectInstance_88 {
        :DiagramProject
        projectId = 88
        title = "Cloud Service Mesh Architecture"
        format = "nodeflow_native"
        activeVersion = "v2.4"
    }

    class WasmEngineInstance {
        :WasmTurboKernel
        memoryPages = 2
        simdActive = true
        hardwareHash = "0x30784cd7"
    }

    UserInstance_1042 "1" --> "1..*" ProjectInstance_88 : owns
    ProjectInstance_88 "1" --> "1" WasmEngineInstance : acceleratesWith
`,
  },
  {
    id: 'uml-composite-structure',
    title: '10. Composite Structure Diagram (UML Structure)',
    category: 'UML Specification',
    kind: 'flowchart',
    description: 'Internal decomposition of complex classifiers, ports, parts, and connector bindings.',
    code: `flowchart LR
    subgraph SmartVehicle [Smart Vehicle: Composite Classifier]
        PortGPS((p1: GPS Port))
        PortCAN((p2: CAN Bus Port))

        subgraph TelematicsControlUnit [Telematics Control Unit]
            CellularModem[4G / 5G Modem Part]
            SecurityCrypto[Hardware Security Module]
        end

        subgraph AutonomousDrivingSystem [Autonomous Driving Subsystem]
            SensorFusion[Sensor Fusion Engine]
            PathPlanner[Path Planning Neural Core]
            ActuatorInterface[Drive-by-Wire Interface]
        end

        subgraph PowerTrain [Electric Powertrain]
            BatteryMgmt[Battery Management System]
            Inverter[Dual AC Inverter]
            Motors[Front & Rear Traction Motors]
        end

        PortGPS --- CellularModem
        CellularModem --- SecurityCrypto
        SecurityCrypto -->|"Authenticated Telemetry"| SensorFusion
        PortCAN --- SensorFusion
        SensorFusion -->|"Fused Point Cloud"| PathPlanner
        PathPlanner -->|"Steering & Torque Vector"| ActuatorInterface
        ActuatorInterface --- Inverter
        Inverter --- Motors
        BatteryMgmt --- Inverter
    end
`,
  },
  {
    id: 'uml-timing',
    title: '11. Timing Diagram (UML Interaction)',
    category: 'UML Specification',
    kind: 'timeline',
    description: 'Hardware and software state transitions across discrete clock cycles and latency windows.',
    code: `timeline
    title Ultra-Low Latency Inference & Cache Timing (Sub-Millisecond Pipeline)
    0.00ms - 0.05ms : Client : Cryptographic BLAKE2b State Fingerprinting
    0.05ms - 0.10ms : Rust Wasm Kernel : Tier-0 Fast-Path Memory Cache Probe
    0.10ms - 0.85ms : Cache HIT (P50) : Return Pre-compiled Binary Protobuf Buffer
    0.85ms - 1.20ms : Network Wire : Zstandard Dictionary Decompression
    1.20ms - 2.50ms : Client Browser : Wasm Memory Injection & Instant Vector Display
`,
  },
  {
    id: 'uml-communication',
    title: '12. Communication Diagram (UML Interaction)',
    category: 'UML Specification',
    kind: 'flowchart',
    description: 'Collaboration diagram showing numbered inter-object messages and call dependencies.',
    code: `flowchart TD
    User([Actor: Checkout User])
    Controller["1.0: CheckoutController"]
    AuthGuard["1.1: AuthenticationGuard"]
    InventoryService["1.2: InventoryService"]
    PaymentGateway["1.3: PaymentGateway"]
    Notifier["1.4: NotificationService"]

    User -->|"1.0: submitOrder()"| Controller
    Controller -->|"1.1: verifySessionToken()"| AuthGuard
    Controller -->|"1.2: reserveStockItems()"| InventoryService
    Controller -->|"1.3: processTransaction()"| PaymentGateway
    Controller -->|"1.4: dispatchReceiptEmail()"| Notifier
`,
  },
  {
    id: 'uml-interaction-overview',
    title: '13. Interaction Overview Diagram (UML Interaction)',
    category: 'UML Specification',
    kind: 'flowchart',
    description: 'Combines activity control flow with sequence interaction frames and decision guards.',
    code: `flowchart TD
    InitialNode((*)) --> FrameAuth[sd: User Authentication Flow]
    FrameAuth --> DecisionAuth{Is Authenticated?}

    DecisionAuth -->|Yes| FrameWorkspace[sd: Load Collaborative Workspace Flow]
    DecisionAuth -->|No| FrameChallenge[sd: Multi-Factor Biometric Challenge Flow]

    FrameChallenge --> DecisionMFA{MFA Verified?}
    DecisionMFA -->|Success| FrameWorkspace
    DecisionMFA -->|Failure| FrameLockout[sd: Incident Log & IP Lockout]

    FrameWorkspace --> FrameLiveEdit[sd: Real-Time Vector Canvas Sync]
    FrameLiveEdit --> TerminalNode((O))
    FrameLockout --> TerminalNode
`,
  },
  {
    id: 'uml-profile',
    title: '14. Profile Diagram (UML Extension)',
    category: 'UML Specification',
    kind: 'class',
    description: 'Custom UML profile stereotypes, tagged values, and metaclass extensions for domain modeling.',
    code: `classDiagram
    class Metaclass_Class {
        <<metaclass>>
        Class
    }
    class Metaclass_Property {
        <<metaclass>>
        Property
    }

    class Microservice {
        <<stereotype>>
        +String serviceName
        +String runtimeLanguage
        +Integer replicas
        +Boolean isStateless
    }

    class FastPathCacheable {
        <<stereotype>>
        +Integer ttlSeconds
        +String hashAlgorithm
        +Boolean invalidateOnWrite
    }

    class EncryptedField {
        <<stereotype>>
        +String cipherAlgorithm
        +String keyVaultUri
    }

    Metaclass_Class <|-- Microservice : extends
    Metaclass_Class <|-- FastPathCacheable : extends
    Metaclass_Property <|-- EncryptedField : extends
`,
  },

  // ==========================================
  // CATEGORY 2: PRODUCT MANAGEMENT & DESIGN THINKING
  // ==========================================
  {
    id: 'user-journey-onboarding',
    title: 'User Journey Map — Product Experience',
    category: 'Product & Design',
    kind: 'journey',
    description: 'Customer experience stages, touchpoints, emotional scores (1-5), and cross-functional team actions.',
    code: `journey
    title User Onboarding & Visual Studio Discovery Journey
    section Discovery & Landing
      Visit DiagramAtlas GitHub Repo: 5: Developer, Product Manager
      Read Interactive Pricing Matrix: 5: Product Manager
      Launch Studio in Web Browser: 5: Developer, Product Manager
    section Canvas & Editing
      Browse 30+ Diagram Templates: 5: Product Manager
      Type Code with Real-Time Debounce: 5: Developer
      Pan & Inertia Zoom on Infinite Canvas: 5: Product Manager
    section WebAssembly & Performance
      Click WASM Hardware Badge: 5: Developer
      Run Live Benchmark (3x-5x Speedup): 5: Developer
    section Export & Handoff
      Export 4K Retina PNG: 5: Product Manager
      Download Standalone Interactive HTML: 5: Developer
      Embed SVG in Documentation: 5: Developer
`,
  },
  {
    id: 'kanban-sprint-board',
    title: 'Agile Kanban Board — Sprint Planning',
    category: 'Product & Design',
    kind: 'kanban',
    description: 'Agile sprint workflow columns with user story estimation badges and priority tags.',
    code: `kanban
  Backlog
    [User Persona Journey Generator - 5 pts]
    [Export to Lucidchart XML - 8 pts]
    [WebAssembly SIMD Vectorizer - 5 pts]
  In Progress
    [BPMN 2.0 Business Flow Importer - 5 pts]
    [Sub-millisecond Rust Cache Engine - 3 pts]
    [Interactive Node Inspector HUD - 3 pts]
  Code Review
    [Native Graphviz WebAssembly Engine - 8 pts]
    [Dual Deployment GitHub Actions - 2 pts]
  Done
    [Rebrand Studio to DiagramAtlas]
    [Complete 14 UML Diagrams Support]
    [Multi-Format Import & Export Matrix]
`,
  },
  {
    id: 'prioritization-quadrant',
    title: 'Feature Prioritization Matrix (Value vs Effort)',
    category: 'Product & Design',
    kind: 'quadrantChart',
    description: 'Eisenhower and product management quadrant chart for strategic feature roadmapping.',
    code: `quadrantChart
    title Feature Prioritization Matrix (Value vs Effort)
    x-axis Low Engineering Effort --> High Engineering Effort
    y-axis Low Customer Value --> High Customer Value
    quadrant-1 Quick Wins
    quadrant-2 Major Strategic Bets
    quadrant-3 Fill-ins
    quadrant-4 Low Priority Deprecations
    WebAssembly Fast Hashing: [0.22, 0.85]
    14 UML Specification Templates: [0.30, 0.92]
    XMind Bi-directional Importer: [0.38, 0.88]
    Export to Multi-Format ZIP Archive: [0.25, 0.72]
    Real-Time Multi-User Collaboration: [0.88, 0.85]
    Native Desktop Tauri App: [0.75, 0.78]
    Custom Canvas Shader Effects: [0.70, 0.32]
    Dark Theme Palette Refinement: [0.15, 0.62]
`,
  },
  {
    id: 'delivery-gantt',
    title: 'Gantt Delivery Sequence — Product Roadmap',
    category: 'Product & Design',
    kind: 'gantt',
    description: 'Cross-functional delivery schedule with workstreams, critical paths, and milestone QA gates.',
    code: `---
config:
  gantt:
    useWidth: 2200
    barHeight: 28
    barGap: 10
    topPadding: 60
    leftPadding: 200
    gridLineStartPadding: 45
  theme: dark
---
gantt
    title DiagramAtlas Enterprise Release Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %d %b

    section Architecture & Wasm
    Design System & Tailwind v4 Tokens    :done, a1, 2026-09-01, 7d
    WebAssembly Turbo Kernel & Fast Hash  :done, a2, after a1, 10d
    Native Graphviz Wasm C Engine         :active, a3, after a2, 8d

    section Format Interop
    XMind ZEN & Draw.io Importers         :done, f1, 2026-09-12, 6d
    PlantUML, D2, SQL DDL Transpilers     :done, f2, after f1, 5d
    BPMN 2.0 & OpenAPI 3.1 Specs          :active, f3, after f2, 6d

    section Verification & Release
    End-to-End Test Suite (55 Checks)     :crit, v1, after a3, 4d
    GitHub Pages Automated Deploy         :crit, v2, after v1, 2d
    Enterprise GA v1.0 Launch             :milestone, m1, after v2, 0d
`,
  },
  {
    id: 'mindmap-diagram',
    title: 'Mindmap — Product Strategy & Architecture',
    category: 'Product & Design',
    kind: 'mindmap',
    description: 'Hierarchical brainstorming mindmap of product capabilities, performance pillars, and formats.',
    code: `mindmap
  root((DiagramAtlas Studio))
    Wasm Acceleration
      Sub-millisecond FNV-1a Hashing
      Linear Memory Compositor
      Native Graphviz C Engine
      Zero-Cloud Offline Execution
    Universal Formats
      Full 14 UML Diagrams
      XMind ZEN & FreeMind
      Draw.io XML & Visio
      PlantUML & D2 Architecture
      SQL DDL & OpenAPI
    Visual Canvas Engine
      Kinetic Drag & Inertia
      Cursor-centered Zoom
      Interactive Minimap Radar
      Presentation & Laser Mode
    Enterprise Exporters
      Retina 4K / 8K PNG
      Crisp Scalable Vector SVG
      Vector PDF Document
      Standalone Interactive HTML
`,
  },
  {
    id: 'sankey-funnel',
    title: 'Conversion Funnel — User Acquisition (Sankey)',
    category: 'Product & Design',
    kind: 'sankey',
    description: 'Sankey flow diagram tracking user acquisition, studio engagement, and export conversions.',
    code: `sankey-beta
    GitHub Repository,Landing Page Showcase,8500
    Google Organic Search,Landing Page Showcase,4200
    Developer Community,Landing Page Showcase,2300
    Landing Page Showcase,Interactive Studio Launch,12400
    Landing Page Showcase,Read Documentation,1800
    Landing Page Showcase,Dropoff,800
    Interactive Studio Launch,Create New Diagram,7800
    Interactive Studio Launch,Explore 30+ Templates,3600
    Interactive Studio Launch,Import Existing XMind / Drawio,1000
    Create New Diagram,Export High-Res PNG,5200
    Create New Diagram,Export Vector SVG,2100
    Create New Diagram,Export PDF Pro,500
`,
  },
  {
    id: 'ishikawa-root-cause',
    title: 'Ishikawa Root-Cause Diagram (Fishbone)',
    category: 'Product & Design',
    kind: 'flowchart',
    description: 'Quality engineering root-cause analysis across Method, Machine, Material, and People.',
    code: `flowchart LR
    subgraph ProblemBox [Core Problem Statement]
        Defect["High API Latency & Payload Bloat\\n(p99 > 2,500ms / 50KB JSON)"]
    end

    subgraph CausesSpine [6M Root Cause Dimensions]
        direction TB
        subgraph Machine [Infrastructure & Hardware]
            M1[CPU Throttling on Shared Pods]
            M2[Unpooled Database Connections]
        end
        subgraph Method [Architecture & Protocol]
            M3[Missing Tier-0 In-Memory Cache]
            M4[Verbose Text JSON Protocol]
        end
        subgraph Material [Payloads & Inference]
            M5[Uncompressed 50KB Payloads]
            M6[LLM Preamble & Polite Filler]
        end
    end

    Machine --> Defect
    Method --> Defect
    Material --> Defect
`,
  },
  {
    id: 'product-roadmap-timeline',
    title: 'Multi-Quarter Product Roadmap — Timeline',
    category: 'Product & Design',
    kind: 'timeline',
    description: 'Quarterly product roadmap with strategic milestones, platform expansions, and release targets.',
    code: `timeline
    title 2026-2027 Engineering & Product Roadmap
    2026 Q1 : Foundation Release : Dual Mermaid & Wasm Engine : 15 Universal Importers : 30 Templates
    2026 Q2 : Enterprise Intelligence : Local Qwen LLM Copilot : Sub-millisecond Fast Cache : Live Radar
    2026 Q3 : Native Desktop App : Electron & Tauri Offline Builds : Zero-Cloud Enterprise Deployment
    2026 Q4 : Plugin Ecosystem : Custom Wasm Layout Algorithms : Visual Extensions Marketplace
`,
  },

  // ==========================================
  // CATEGORY 3: ENTERPRISE ARCHITECTURE & CLOUD
  // ==========================================
  {
    id: 'c4-system-context',
    title: 'C4 Model — System Context & Containers',
    category: 'Architecture & Cloud',
    kind: 'c4',
    description: 'C4 model architecture showing users, core software systems, and external banking mainframe boundaries.',
    code: `C4Context
    title System Context Diagram — Internet Banking System
    Person(customer, "Personal Banking Customer", "A customer of the bank with personal bank accounts.")
    System(bankingSystem, "Internet Banking System", "Allows customers to view account balances, make payments, and analyze transactions.")
    System_Ext(mailSystem, "E-mail Subsystem", "Internal Microsoft Exchange system for customer notifications.")
    System_Ext(mainframe, "Core Mainframe Banking Tier", "Stores all customer core accounts, ledgers, and transactions.")

    Rel(customer, bankingSystem, "Views account balances & initiates transfers using", "HTTPS / TLS 1.3")
    Rel_Back(customer, mailSystem, "Receives transaction verification emails from")
    Rel(bankingSystem, mailSystem, "Sends notifications using", "SMTP")
    Rel(bankingSystem, mainframe, "Queries balances & executes transactions using", "gRPC / Protobuf")
`,
  },
  {
    id: 'graphviz-k8s-mesh',
    title: 'Kubernetes Cluster Topology (Native Graphviz Wasm)',
    category: 'Architecture & Cloud',
    kind: 'graphviz',
    description: 'Cloud native service mesh and ingress clusters rendered directly using WebAssembly Graphviz C engine.',
    code: `digraph KubernetesMesh {
  rankdir=TB;
  bgcolor="transparent";
  fontname="Helvetica,Arial,sans-serif";
  node [fontname="Helvetica,Arial,sans-serif", shape=box, style="filled,rounded", fillcolor="#1e293b", fontcolor="#f8fafc", color="#38bdf8", penwidth=1.5];
  edge [fontname="Helvetica,Arial,sans-serif", color="#94a3b8", fontcolor="#cbd5e1"];

  subgraph cluster_ingress {
    label = "Edge Ingress Gateway";
    style = "filled,dashed";
    fillcolor = "#0f172a";
    fontcolor = "#38bdf8";
    color = "#0284c7";

    CloudFlare [label="Cloudflare CDN\\n(Edge TLS 1.3)", fillcolor="#334155", shape=ellipse];
    EnvoyProxy [label="Envoy Proxy / Traefik\\n(Layer 7 Router)", fillcolor="#0369a1"];
  }

  subgraph cluster_services {
    label = "Kubernetes Pod Mesh";
    style = "filled";
    fillcolor = "#0f172a";
    fontcolor = "#a855f7";
    color = "#7e22ce";

    AuthService [label="Auth Service\\n(OAuth 2.1 / Wasm Guard)", fillcolor="#4c1d95"];
    DiagramEngine [label="DiagramAtlas Kernel\\n(WebAssembly Runner)", fillcolor="#065f46", color="#10b981"];
    ExportWorker [label="Rasterizer Worker\\n(SIMD Compositor)", fillcolor="#1e3a8a", color="#60a5fa"];
  }

  subgraph cluster_data {
    label = "Distributed Storage Tier";
    style = "filled";
    fillcolor = "#0f172a";
    fontcolor = "#f59e0b";
    color = "#b45309";

    RedisCache [label="Redis Cluster\\n(In-Memory State)", shape=cylinder, fillcolor="#7c2d12"];
    PostgresDB [label="PostgreSQL Primary\\n(Vector & Metadata)", shape=cylinder, fillcolor="#1e3a8a"];
  }

  CloudFlare -> EnvoyProxy [label="HTTPS / HTTP3"];
  EnvoyProxy -> AuthService [label="gRPC Verify"];
  EnvoyProxy -> DiagramEngine [label="WebSocket / SSE"];
  DiagramEngine -> ExportWorker [label="Task Queue"];
  DiagramEngine -> RedisCache [label="Fast Hash Key"];
  AuthService -> PostgresDB [label="User Schema"];
  ExportWorker -> RedisCache [label="Cache Snapshot"];
}
`,
  },
  {
    id: 'service-architecture',
    title: 'Service Architecture & Dependency Graph',
    category: 'Architecture & Cloud',
    kind: 'flowchart',
    description: 'Distributed microservice graph with shared core services, parallel domain pods, and telemetry monitoring.',
    code: `flowchart TD
    subgraph IngressLayer [Edge Ingress Tier]
        Cloudflare[Cloudflare Edge CDN]
        Traefik[Traefik v3 API Gateway]
    end

    subgraph CoreServices [Shared Core Services]
        AuthService[Auth & Token Service]
        TenantService[Tenant Organization Service]
        AuditService[Audit Log Collector]
    end

    subgraph ProductServices [Parallel Product Microservices]
        CanvasService[Canvas Collaborative Service]
        ExportService[High-DPI Rasterize Worker]
        SearchService[Elastic Search Vector Node]
    end

    subgraph DataTier [Storage & Persistence Tier]
        Postgres[(Postgres Cloud Primary)]
        RedisCache[(Redis In-Memory State)]
        S3Bucket[(S3 Vector Asset Storage)]
    end

    Cloudflare --> Traefik
    Traefik --> AuthService
    Traefik --> CanvasService
    Traefik --> ExportService

    CanvasService --> AuthService
    CanvasService --> TenantService
    CanvasService --> RedisCache
    CanvasService --> Postgres

    ExportService --> S3Bucket
    ExportService --> AuditService
    TenantService --> Postgres
`,
  },
  {
    id: 'dependency-overview',
    title: 'Milestone Dependency Progression',
    category: 'Architecture & Cloud',
    kind: 'flowchart',
    description: 'High-level milestone progression from infrastructure baseline to project completion with QA gates.',
    code: `---
config:
  theme: dark
  flowchart:
    useMaxWidth: false
    curve: basis
    nodeSpacing: 45
    rankSpacing: 75
---
flowchart LR
    INFRA[Infrastructure baseline]
    SPLP[Shared PLP]
    SPDP[Shared PDP]
    PASS[Passenger shared]
    PLP[Parallel service PLPs]
    PDP[Parallel service PDPs]
    REVIEW[Parallel service Reviews]
    TRIPS[My Trips by service]
    DONE{{All services complete}}

    INFRA --> SPLP --> PLP
    INFRA --> SPDP --> PDP
    INFRA --> PASS
    PLP -->|QA Gate| PDP
    PDP -->|QA Gate| REVIEW
    PASS --> REVIEW
    REVIEW -->|QA Gate| TRIPS -->|QA Gate| DONE

    classDef infra fill:#202a35,stroke:#94a3b8,color:#fff,stroke-width:3px
    classDef shared fill:#2e2050,stroke:#8b5cf6,color:#fff,stroke-width:2px
    classDef service fill:#123448,stroke:#0ea5e9,color:#fff,stroke-width:2px
    classDef milestone fill:#111827,stroke:#f8fafc,color:#fff,stroke-width:2px
    class INFRA infra
    class SPLP,SPDP,PASS shared
    class PLP,PDP,REVIEW,TRIPS service
    class DONE milestone
`,
  },
  {
    id: 'hardware-system-block',
    title: 'Hardware System Block & Bus Architecture',
    category: 'Architecture & Cloud',
    kind: 'block',
    description: 'High-speed system architecture with CPU, memory bus, neural accelerator, and DMA controllers.',
    code: `block-beta
    columns 4
    CPU["High-Performance CPU Core"]:2 RAM["LPDDR5 Unified Memory"]:2
    block:bus:4
        SystemBus["256-bit Ultra-High Speed Interconnect Bus"]
    end
    NPU["Neural Processing Accelerator"]:2 NVMe["PCIe 5.0 NVMe Storage"]:2

    CPU --> SystemBus
    RAM --> SystemBus
    NPU --> SystemBus
    NVMe --> SystemBus
`,
  },

  // ==========================================
  // CATEGORY 4: ENGINEERING, DATA & DEVOPS
  // ==========================================
  {
    id: 'er-diagram',
    title: 'Entity Relationship Schema (Data Model)',
    category: 'Engineering & Data',
    kind: 'er',
    description: 'Relational database schema with Crow’s Foot cardinality notation, primary keys, and foreign keys.',
    code: `erDiagram
    ORGANIZATION ||--o{ USER : contains
    ORGANIZATION ||--o{ PROJECT : owns
    USER ||--o{ PROJECT_MEMBER : participates
    PROJECT ||--o{ PROJECT_MEMBER : assigns
    PROJECT ||--o{ DIAGRAM : stores
    DIAGRAM ||--o{ DIAGRAM_VERSION : tracks
    USER ||--o{ AUDIT_LOG : triggers

    ORGANIZATION {
        uuid id PK
        string name
        string plan_tier
        timestamp created_at
    }

    USER {
        uuid id PK
        string email
        string full_name
        string role
        boolean is_active
    }

    PROJECT {
        uuid id PK
        uuid organization_id FK
        string title
        string visibility
        timestamp updated_at
    }

    DIAGRAM {
        uuid id PK
        uuid project_id FK
        string name
        string format
        text current_source
        string checksum_hash
    }

    DIAGRAM_VERSION {
        uuid id PK
        uuid diagram_id FK
        integer version_number
        text source_snapshot
        string author_id
        timestamp snapshot_at
    }
`,
  },
  {
    id: 'git-graph',
    title: 'Git Trunk-Based Release & Hotfix Flow',
    category: 'Engineering & Data',
    kind: 'gitGraph',
    description: 'Trunk-based source control branching strategy with PR merges, release tags, and hotfixes.',
    code: `gitGraph
    commit id: "Initial Architecture"
    commit id: "Core Engine Setup"
    branch feature/wasm-turbo
    checkout feature/wasm-turbo
    commit id: "Fast FNV-1a Wasm Kernel"
    commit id: "Graphviz C Engine Binding"
    checkout main
    merge feature/wasm-turbo id: "PR #1: WebAssembly Turbo" tag: "v0.9.0"
    branch feature/14-uml-templates
    checkout feature/14-uml-templates
    commit id: "Add Full UML Specification"
    commit id: "Product & Architecture Templates"
    checkout main
    merge feature/14-uml-templates id: "PR #2: 30 Universal Templates" tag: "v1.0.0"
    branch hotfix/safari-canvas-retina
    checkout hotfix/safari-canvas-retina
    commit id: "Fix High-DPI Canvas Scaling"
    checkout main
    merge hotfix/safari-canvas-retina id: "PR #3: Hotfix Safari Scale" tag: "v1.0.1"
`,
  },
  {
    id: 'sla-performance-metrics',
    title: 'API Latency Percentiles & SLA Uptime (XY Chart)',
    category: 'Engineering & Data',
    kind: 'xychart',
    description: 'Performance benchmark comparison comparing DiagramAtlas WebAssembly response times against legacy tools.',
    code: `xychart-beta
    title "p99 Execution Latency vs Concurrent Query Load"
    x-axis ["100 req/s", "500 req/s", "1,000 req/s", "5,000 req/s", "10,000 req/s"]
    y-axis "Latency (milliseconds)" 0 --> 250
    bar [12, 18, 26, 45, 68]
    line [110, 145, 185, 230, 290]
`,
  },
];

export function getTemplateById(id) {
  return DIAGRAM_TEMPLATES.find((tpl) => tpl.id === id) || DIAGRAM_TEMPLATES[0];
}
