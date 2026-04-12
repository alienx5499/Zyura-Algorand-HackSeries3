# Assignment 3: Architecture Design (ZYURA)
**Algorand Protocol Architecture**

This document describes the ZYURA architecture on **Algorand**: a single stateful app (TEALScript), box storage, and ASAs; flight data is supplied by a configurable layer (e.g. GitHub-backed store). See the main [README](../README.md) for setup and structure.

**Architecture mapping:**

| Concept | Algorand (Zyura-Algorand) |
|--------|---------------------------|
| Program / state | Single stateful app (TEALScript) |
| Config, products, policies, LPs | App global state + box storage (key-value by id) |
| Token / NFT | Algorand Standard Assets (USDC ASA, policy NFT ASA); inner tx transfers |
| Policy NFT metadata | ARC-3-style policy NFT (ASA + metadata URL); optional off-chain JSON (e.g. GitHub) |
| Flight / delay data | Configurable data layer: flight delay + PNR (demo: GitHub-backed store; prod: oracle/API) |
| Cross-contract calls | Inner transactions (asset transfer, opt-in, etc.) |

---

## Part A: Program Structure Visualization

### 1. Core Program Architecture

The ZYURA protocol on Algorand consists of a single stateful app (TEALScript) that manages all insurance operations through modular logic (initialize, products, policies, liquidity, admin).

```mermaid
graph TB
    subgraph "ZYURA Program"
        ZP["<b>ZYURA App</b><br/>Stateful app (TEALScript)"]
        
        subgraph "Instruction Modules"
            INIT["<b>Initialize</b>"]
            PROD["<b>Product Management</b>"]
            POLICY["<b>Policy Operations</b>"]
            LIQ["<b>Liquidity Management</b>"]
            ADMIN["<b>Admin Controls</b>"]
        end
        
        ZP --> INIT
        ZP --> PROD
        ZP --> POLICY
        ZP --> LIQ
        ZP --> ADMIN
    end
    
    subgraph "Algorand Primitives"
        ASA["<b>Algorand Standard Assets</b>"]
        VAULT_ASA["<b>USDC / Vault ASA</b>"]
        NFT_ASA["<b>Policy NFT (ARC-3)</b>"]
        DATA["<b>Flight Data Layer</b>"]
    end
    
    ZP -.Inner Tx.-> ASA
    ZP -.Inner Tx.-> VAULT_ASA
    ZP -.Inner Tx.-> NFT_ASA
    ZP -.Reads.-> DATA
    
    style ZP fill:#667eea,stroke:#4c51bf,stroke-width:4px,color:#fff
    style INIT fill:#4299e1,stroke:#2b6cb0,stroke-width:2px,color:#fff
    style PROD fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style POLICY fill:#ed8936,stroke:#c05621,stroke-width:2px,color:#fff
    style LIQ fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style ADMIN fill:#9f7aea,stroke:#805ad5,stroke-width:2px,color:#fff
    style ASA fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style VAULT_ASA fill:#fc8181,stroke:#e53e3e,stroke-width:2px,color:#fff
    style NFT_ASA fill:#68d391,stroke:#38a169,stroke-width:2px,color:#1a202c
    style DATA fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
```

### 2. Instruction Flow Diagram

```mermaid
flowchart TD
    START([User Action]) --> CHECK{Action Type}

    CHECK -->|Initialize| INIT_FLOW[Initialize protocol]
    CHECK -->|Admin| ADMIN_FLOW[Admin operations]
    CHECK -->|Purchase| PURCHASE_FLOW[Purchase policy]
    CHECK -->|Payout| PAYOUT_FLOW[Process payout]
    CHECK -->|Liquidity| LIQ_FLOW[Liquidity operations]

    INIT_FLOW --> INIT_ACCOUNTS[Initialize app config]
    INIT_ACCOUNTS --> DONE1([Protocol ready])

    ADMIN_FLOW --> ADMIN_CHECK{Admin authorized?}
    ADMIN_CHECK -->|Yes| PROD_MGMT[Create/update product]
    ADMIN_CHECK -->|Yes| PAUSE[Pause/resume protocol]
    ADMIN_CHECK -->|No| ERROR1([Error: unauthorized])
    PROD_MGMT --> DONE2([Product updated])
    PAUSE --> DONE3([Protocol paused/resumed])

    PURCHASE_FLOW --> CHECK_PAUSE{Protocol paused?}
    CHECK_PAUSE -->|Yes| ERROR2([Error: protocol paused])
    CHECK_PAUSE -->|No| CHECK_PRODUCT{Product active?}
    CHECK_PRODUCT -->|No| ERROR3([Error: product inactive])
    CHECK_PRODUCT -->|Yes| TRANSFER_PREM[Transfer premium to vault]
    TRANSFER_PREM --> CREATEPOLICY[Create policy state]
    CREATEPOLICY --> MINTNFT[Create policy NFT ASA]
    MINTNFT --> FREEZENFT[Opt-in soulbound NFT]
    FREEZENFT --> DONE4([Policy active])

    PAYOUT_FLOW --> VERIFY_ADMIN{Admin signature?}
    VERIFY_ADMIN -->|No| ERROR4([Error: unauthorized])
    VERIFY_ADMIN -->|Yes| CHECK_STATUS{Policy active?}
    CHECK_STATUS -->|No| ERROR5([Error: policy not active])
    CHECK_STATUS -->|Yes| VERIFY_DELAY{Delay >= threshold?}
    VERIFY_DELAY -->|No| ERROR6([Error: threshold not met])
    VERIFY_DELAY -->|Yes| TRANSFER_PAYOUT[Transfer coverage amount]
    TRANSFER_PAYOUT --> UPDATE_STATUS[Update policy status]
    UPDATE_STATUS --> DONE5([Payout complete])

    LIQ_FLOW --> LIQ_TYPE{Operation type}
    LIQ_TYPE -->|Deposit| DEPOSIT[Transfer to vault]
    LIQ_TYPE -->|Withdraw| WITHDRAW_CHECK{Admin auth?}
    DEPOSIT --> UPDATE_LP[Update LP account]
    UPDATE_LP --> DONE6([Deposit complete])
    WITHDRAW_CHECK -->|No| ERROR7([Error: unauthorized])
    WITHDRAW_CHECK -->|Yes| WITHDRAW[Transfer from vault]
    WITHDRAW --> UPDATE_LP2[Update LP account]
    UPDATE_LP2 --> DONE7([Withdrawal complete])

    style START fill:#667eea,stroke:#4c51bf,stroke-width:3px,color:#fff
    style CHECK fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style INIT_FLOW fill:#4299e1,stroke:#2b6cb0,stroke-width:2px,color:#fff
    style ADMIN_FLOW fill:#9f7aea,stroke:#805ad5,stroke-width:2px,color:#fff
    style PURCHASE_FLOW fill:#ed8936,stroke:#c05621,stroke-width:2px,color:#fff
    style PAYOUT_FLOW fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style LIQ_FLOW fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style DONE1 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE2 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE3 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE4 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE5 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE6 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE7 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ERROR1 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR2 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR3 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR4 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR5 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR6 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR7 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style CHECK_PAUSE fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_PRODUCT fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style ADMIN_CHECK fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style VERIFY_ADMIN fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_STATUS fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style VERIFY_DELAY fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style LIQ_TYPE fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style WITHDRAW_CHECK fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
```

---

## Part B: Account Structure Mapping

### 1. Account Hierarchy and Ownership

```mermaid
graph TB
    subgraph "App State & Box Storage"
        CONFIG["<b>Config</b><br/>Global state / box<br/>Owner: ZYURA App"]
        
        PROD1["<b>Product #1</b><br/>Box / state by product_id"]
        PROD2["<b>Product #2</b><br/>Box / state by product_id"]
        
        POLICY1["<b>Policy #1</b><br/>Box / state by policy_id"]
        POLICY2["<b>Policy #N</b><br/>Box / state by policy_id"]
        
        LP1["<b>LP #1</b><br/>Box by provider address"]
        LPN["<b>LP #N</b><br/>Box by provider address"]
    end
    
    subgraph "ASAs"
        VAULT["<b>Risk Pool Vault</b><br/>USDC ASA<br/>Holds premiums & payouts"]
        
        USER1_USDC["<b>User USDC</b><br/>ASA in User Wallet"]
        USER2_USDC["<b>User USDC</b><br/>ASA in User Wallet"]
        
        USER1_NFT["<b>Policy NFT</b><br/>ARC-3 ASA<br/>Soulbound in User Wallet"]
        USER2_NFT["<b>Policy NFT</b><br/>ARC-3 ASA<br/>Soulbound in User Wallet"]
    end
    
    subgraph "Policy NFTs"
        NFT_MINT1["<b>Policy NFT #1</b><br/>ASA, supply 1"]
        NFT_MINT2["<b>Policy NFT #N</b><br/>ASA, supply 1"]
    end
    
    CONFIG --> PROD1
    CONFIG --> PROD2
    CONFIG --> VAULT
    
    PROD1 -.references.-> POLICY1
    PROD2 -.references.-> POLICY2
    
    POLICY1 --> NFT_MINT1
    POLICY2 --> NFT_MINT2
    
    NFT_MINT1 --> USER1_NFT
    NFT_MINT2 --> USER2_NFT
    
    NFT_MINT1 --> METADATA1
    NFT_MINT2 --> METADATA2
    
    METADATA1 --> MASTER1
    METADATA2 --> MASTER2
    
    MINT_AUTH -.authority.-> NFT_MINT1
    MINT_AUTH -.authority.-> NFT_MINT2
    
    USER1_USDC -.transfers.-> VAULT
    USER2_USDC -.transfers.-> VAULT
    
    LP1 -.tracks.-> VAULT
    LPN -.tracks.-> VAULT
    
    style CONFIG fill:#667eea,stroke:#4c51bf,stroke-width:3px,color:#fff
    style PROD1 fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style PROD2 fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style POLICY1 fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style POLICY2 fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style VAULT fill:#10b981,stroke:#047857,stroke-width:4px,color:#fff
    style NFT_MINT1 fill:#a78bfa,stroke:#7c3aed,stroke-width:2px,color:#fff
    style NFT_MINT2 fill:#a78bfa,stroke:#7c3aed,stroke-width:2px,color:#fff
    style LP1 fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style LPN fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style MINT_AUTH fill:#9f7aea,stroke:#805ad5,stroke-width:2px,color:#fff
    style USER1_USDC fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style USER2_USDC fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style USER1_NFT fill:#fc8181,stroke:#e53e3e,stroke-width:2px,color:#fff
    style USER2_NFT fill:#fc8181,stroke:#e53e3e,stroke-width:2px,color:#fff
    style METADATA1 fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style METADATA2 fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style MASTER1 fill:#c084fc,stroke:#a855f7,stroke-width:2px,color:#fff
    style MASTER2 fill:#c084fc,stroke:#a855f7,stroke-width:2px,color:#fff
```

### 2. Account Data Structures

```mermaid
classDiagram
    class Config {
        +Address admin
        +AssetId usdc_asa_id
        +bool paused
    }
    
    class Product {
        +u64 id
        +u32 delay_threshold_minutes
        +u64 coverage_amount
        +u16 premium_rate_bps
        +u32 claim_window_hours
        +bool active
    }
    
    class Policy {
        +u64 id
        +Address policyholder
        +u64 product_id
        +String flight_number
        +i64 departure_time
        +u64 premium_paid
        +u64 coverage_amount
        +PolicyStatus status
        +i64 created_at
        +Option~i64~ paid_at
    }
    
    class PolicyStatus {
        <<enumeration>>
        Active
        PaidOut
        Expired
    }
    
    class LiquidityProvider {
        +Address provider
        +u64 total_deposited
        +u64 total_withdrawn
        +u64 active_deposit
    }
    
    Config --> Product : references
    Product --> Policy : defines parameters
    Policy --> PolicyStatus : has status
    Config --> LiquidityProvider : tracks providers
    
    style Config fill:#667eea,stroke:#4c51bf,color:#fff
    style Product fill:#48bb78,stroke:#2f855a,color:#fff
    style Policy fill:#f59e0b,stroke:#d97706,color:#fff
    style PolicyStatus fill:#fbbf24,stroke:#f59e0b,color:#1a202c
    style LiquidityProvider fill:#38b2ac,stroke:#2c7a7b,color:#fff
```

### 3. App State & Box Derivation

```mermaid
flowchart LR
    subgraph "Config"
        C1["App global state"] --> C2["App ID"] --> C3["<b>Config</b><br/>admin, usdc_asa_id, paused"]
    end
    
    subgraph "Product"
        P1["Box key"] --> P2["Product ID: u64"] --> P3["App ID"] --> P4["<b>Product box</b><br/>params, active"]
    end
    
    subgraph "Policy"
        POL1["Box key"] --> POL2["Policy ID: u64"] --> POL3["App ID"] --> POL4["<b>Policy box</b><br/>policyholder, flight, status"]
    end
    
    subgraph "LP"
        LP1_SEED["Box key"] --> LP2["Provider Address"] --> LP3["App ID"] --> LP4["<b>LP box</b><br/>deposits, active_deposit"]
    end
    
    style C1 fill:#4299e1,stroke:#2b6cb0,stroke-width:2px,color:#fff
    style C2 fill:#4299e1,stroke:#2b6cb0,stroke-width:2px,color:#fff
    style C3 fill:#667eea,stroke:#4c51bf,stroke-width:3px,color:#fff
    style P1 fill:#68d391,stroke:#38a169,stroke-width:2px,color:#1a202c
    style P2 fill:#68d391,stroke:#38a169,stroke-width:2px,color:#1a202c
    style P3 fill:#68d391,stroke:#38a169,stroke-width:2px,color:#1a202c
    style P4 fill:#48bb78,stroke:#2f855a,stroke-width:3px,color:#fff
    style POL1 fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style POL2 fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style POL3 fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style POL4 fill:#f59e0b,stroke:#d97706,stroke-width:3px,color:#fff
    style LP1_SEED fill:#7dd3fc,stroke:#0ea5e9,stroke-width:2px,color:#1a202c
    style LP2 fill:#7dd3fc,stroke:#0ea5e9,stroke-width:2px,color:#1a202c
    style LP3 fill:#7dd3fc,stroke:#0ea5e9,stroke-width:2px,color:#1a202c
    style LP4 fill:#38b2ac,stroke:#2c7a7b,stroke-width:3px,color:#fff
```

---

## Part C: External Dependencies and Integrations

### 1. External System Integration

```mermaid
graph TB
    subgraph "On-Chain (Algorand)"
        ZYURA["<b>ZYURA App</b>"]
        ASA["<b>Algorand Standard Assets</b>"]
        USDC["<b>USDC ASA</b>"]
        NFT_ASA["<b>Policy NFT (ARC-3)</b>"]
    end
    
    subgraph "Data Layer"
        DATA_LAYER["<b>Flight Data Layer</b><br/>Delay / PNR data"]
    end
    
    subgraph "Frontend/Off-Chain"
        OTA["<b>OTA/Airline Integration</b><br/>Flight Booking Systems"]
        USER_UI["<b>User Interface</b><br/>Wallet Connection"]
        ADMIN_UI["<b>Admin Dashboard</b>"]
    end
    
    subgraph "External Services"
        FLIGHT_API["<b>Flight Status APIs</b><br/>OpenSky, Aviation Edge, etc."]
        OFFCHAIN_AGG["<b>Off-Chain Aggregator</b><br/>Multi-source reconciliation"]
    end
    
    USER_UI -->|"<b>1. Connect Wallet</b>"| ZYURA
    USER_UI -->|"<b>2. Purchase Policy</b>"| ZYURA
    USER_UI -->|"<b>3. View Policies</b>"| ZYURA
    
    OTA -->|"<b>4. Flight Data</b>"| OFFCHAIN_AGG
    OTA -->|"<b>5. Trigger Policy Creation</b>"| USER_UI
    
    OFFCHAIN_AGG -->|"<b>6. Aggregate Data</b>"| FLIGHT_API
    OFFCHAIN_AGG -->|"<b>7. Push to Data Layer</b>"| DATA_LAYER
    
    DATA_LAYER -->|"<b>8. Delay Status</b>"| ZYURA
    ADMIN_UI -->|"<b>9. Verify Delay</b>"| ZYURA
    ADMIN_UI -->|"<b>10. Trigger Payout</b>"| ZYURA
    
    ZYURA -.Inner Tx.-> ASA
    ZYURA -.Inner Tx.-> USDC
    ZYURA -.Inner Tx.-> NFT_ASA
    ZYURA -.Reads.-> DATA_LAYER
    
    style ZYURA fill:#667eea,stroke:#4c51bf,stroke-width:4px,color:#fff
    style ASA fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style USDC fill:#fc8181,stroke:#e53e3e,stroke-width:2px,color:#fff
    style NFT_ASA fill:#68d391,stroke:#38a169,stroke-width:2px,color:#1a202c
    style DATA_LAYER fill:#fbbf24,stroke:#f59e0b,stroke-width:4px,color:#1a202c
    style OTA fill:#48bb78,stroke:#2f855a,stroke-width:3px,color:#fff
    style USER_UI fill:#4299e1,stroke:#2b6cb0,stroke-width:2px,color:#fff
    style ADMIN_UI fill:#9f7aea,stroke:#805ad5,stroke-width:2px,color:#fff
    style FLIGHT_API fill:#ed8936,stroke:#c05621,stroke-width:2px,color:#fff
    style OFFCHAIN_AGG fill:#f97316,stroke:#ea580c,stroke-width:3px,color:#fff
```

### 2. Flight Data Flow

```mermaid
sequenceDiagram
    participant User as Traveler
    participant OTA as OTA/Airline
    participant Agg as Off-Chain Aggregator
    participant API1 as Flight API 1
    participant API2 as Flight API 2
    participant DataLayer as Flight Data Layer
    participant App as ZYURA App
    participant Admin as Admin
    
    User->>OTA: Book Flight
    OTA->>App: Create Policy (flight details)
    App->>App: Store Policy (Active)
    
    Note over API1,API2: Scheduled Checks
    
    Agg->>API1: Query Flight Status
    Agg->>API2: Query Flight Status
    API1-->>Agg: Delay: 45 min
    API2-->>Agg: Delay: 47 min
    
    Agg->>Agg: Reconcile Data
    
    alt Delay Confirmed
        Agg->>DataLayer: Push Verified Delay Data
        DataLayer->>DataLayer: Update delay status
        
        Admin->>DataLayer: Read delay status
        Admin->>App: process_payout()
        App->>App: Verify Delay >= Threshold
        App->>App: Inner tx: Transfer USDC from Vault
        App->>App: Update Policy Status
        App-->>User: Payout Complete
    else No Delay
        Agg->>Agg: Continue Monitoring
    end
```

---

## Part D: User Interaction Flows

### 1. Complete User Journey: Purchase to Payout

```mermaid
sequenceDiagram
    participant Traveler
    participant OTA as OTA Frontend
    participant Wallet as User Wallet
    participant App as ZYURA App
    participant ASA as ASAs (USDC / NFT)
    participant Vault as Risk Pool Vault
    participant NFT as NFT Mint
    participant NFT as Policy NFT (ARC-3)
    
    Note over Traveler,Metadata: 1. POLICY PURCHASE FLOW
    
    Traveler->>OTA: Select Flight & Insurance
    OTA->>Wallet: Request Transaction
    Wallet->>App: purchase_policy()
    
    App->>App: Check Protocol Status
    App->>App: Verify Product Active
    App->>App: Calculate Premium
    
    App->>ASA: Inner tx: Transfer USDC
    Token->>Wallet: Deduct Premium
    Token->>Vault: Add Premium
    
    App->>App: Create Policy (box/state)
    App->>ASA: Inner tx: Create Policy NFT ASA
    ASA->>NFT: Create ASA (supply 1)
    App->>NFT: Soulbound to User
    
    App-->>Traveler: Policy Active + NFT Minted
    
    Note over Traveler,Metadata: 2. PAYOUT FLOW (After Delay Detected)
    
    App->>App: Admin calls process_payout()
    App->>App: Verify Admin Authority
    App->>App: Check Policy Status
    App->>App: Verify Delay >= Threshold
    
    App->>ASA: Inner tx: Transfer coverage
    Token->>Vault: Deduct Coverage
    Token->>Wallet: Add Coverage
    
    App->>App: Update Policy Status = PaidOut
    App-->>Traveler: Payout Complete
```

### 2. Liquidity Provider Flow

```mermaid
flowchart TD
    START([LP wants to deposit]) --> CONNECT[Connect wallet]
    CONNECT --> SELECT{Operation}

    SELECT -->|Deposit| DEPOSIT_FLOW[deposit_liquidity instruction]
    SELECT -->|Withdraw| WITHDRAW_FLOW[withdraw_liquidity instruction]

    DEPOSIT_FLOW --> CHECK_PAUSE1{Protocol paused?}
    CHECK_PAUSE1 -->|Yes| ERROR1([Error: protocol paused])
    CHECK_PAUSE1 -->|No| TRANSFER_IN[Transfer USDC to vault]
    TRANSFER_IN --> CHECK_LP{LP account exists?}
    CHECK_LP -->|No| INITLP[Create LP record]
    CHECK_LP -->|Yes| UPDATELP[Update LP record]
    INITLP --> UPDATE_BALANCE[Update LP deposit balance]
    UPDATELP --> UPDATE_BALANCE
    UPDATE_BALANCE --> DONE1([Deposit complete])

    WITHDRAW_FLOW --> CHECK_PAUSE2{Protocol paused?}
    CHECK_PAUSE2 -->|Yes| ERROR2([Error: protocol paused])
    CHECK_PAUSE2 -->|No| CHECK_ADMIN{Admin signature?}
    CHECK_ADMIN -->|No| ERROR3([Error: unauthorized])
    CHECK_ADMIN -->|Yes| CHECK_BALANCE{active_deposit >= amount?}
    CHECK_BALANCE -->|No| ERROR4([Error: insufficient balance])
    CHECK_BALANCE -->|Yes| TRANSFER_OUT[Transfer USDC from vault]
    TRANSFER_OUT --> UPDATE_WITHDRAW[Update LP withdrawal balance]
    UPDATE_WITHDRAW --> DONE2([Withdrawal complete])

    style START fill:#38b2ac,stroke:#2c7a7b,stroke-width:3px,color:#fff
    style CONNECT fill:#4299e1,stroke:#2b6cb0,stroke-width:2px,color:#fff
    style SELECT fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style DEPOSIT_FLOW fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style WITHDRAW_FLOW fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style TRANSFER_IN fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    style TRANSFER_OUT fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    style INITLP fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#fff
    style UPDATELP fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#fff
    style UPDATE_BALANCE fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style UPDATE_WITHDRAW fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style DONE1 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE2 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ERROR1 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR2 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR3 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR4 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style CHECK_PAUSE1 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_PAUSE2 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_ADMIN fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_BALANCE fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
```

### 3. Admin Operations Flow

```mermaid
flowchart TD
    ADMIN([Admin]) --> AUTH_CHECK{Verify admin signature}
    AUTH_CHECK -->|Invalid| ERROR([Error: unauthorized])
    AUTH_CHECK -->|Valid| OPERATION{Select operation}

    OPERATION -->|Initialize| INIT[initialize]
    OPERATION -->|Create product| CREATE[create_product]
    OPERATION -->|Update product| UPDATE[update_product]
    OPERATION -->|Pause/resume| PAUSE[set_pause_status]
    OPERATION -->|Process payout| PAYOUT[process_payout]
    OPERATION -->|Allow withdrawal| WITHDRAW[withdraw_liquidity]

    INIT --> CREATE_CONFIG[Initialize app config]
    CREATE_CONFIG --> DONE1([Protocol initialized])

    CREATE --> CHECK_PAUSE1{Protocol paused?}
    CHECK_PAUSE1 -->|Yes| ERROR
    CHECK_PAUSE1 -->|No| CREATEPROD[Create product entry]
    CREATEPROD --> DONE2([Product created])

    UPDATE --> CHECK_PAUSE2{Protocol paused?}
    CHECK_PAUSE2 -->|Yes| ERROR
    CHECK_PAUSE2 -->|No| UPDATE_PARAMS[Update product parameters]
    UPDATE_PARAMS --> DONE3([Product updated])

    PAUSE --> TOGGLE[Toggle paused flag]
    TOGGLE --> DONE4([Protocol paused/resumed])

    PAYOUT --> VERIFY_DELAY{Delay >= threshold?}
    VERIFY_DELAY -->|No| ERROR5([Error: threshold not met])
    VERIFY_DELAY -->|Yes| TRANSFER[Transfer coverage amount]
    TRANSFER --> UPDATE_POLICY[Update policy status = PaidOut]
    UPDATE_POLICY --> DONE5([Payout processed])

    WITHDRAW --> CHECK_BALANCE{LP balance >= amount?}
    CHECK_BALANCE -->|No| ERROR6([Error: insufficient balance])
    CHECK_BALANCE -->|Yes| TRANSFER_OUT[Transfer USDC from vault]
    TRANSFER_OUT --> UPDATE_LP[Update LP record]
    UPDATE_LP --> DONE6([Withdrawal allowed])

    style ADMIN fill:#9f7aea,stroke:#805ad5,stroke-width:3px,color:#fff
    style AUTH_CHECK fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style OPERATION fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style INIT fill:#4299e1,stroke:#2b6cb0,stroke-width:2px,color:#fff
    style CREATE fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style UPDATE fill:#ed8936,stroke:#c05621,stroke-width:2px,color:#fff
    style PAUSE fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style PAYOUT fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    style WITHDRAW fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style CREATE_CONFIG fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#fff
    style CREATEPROD fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style UPDATE_PARAMS fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style TOGGLE fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style TRANSFER fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    style TRANSFER_OUT fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    style UPDATE_POLICY fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style UPDATE_LP fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style DONE1 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE2 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE3 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE4 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE5 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE6 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ERROR fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR5 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR6 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style CHECK_PAUSE1 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_PAUSE2 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style VERIFY_DELAY fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_BALANCE fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
```

---

## Part E: Program Interaction Matrix

### 1. Inner Transactions (Algorand)

```mermaid
graph LR
    subgraph "ZYURA App"
        ZP["<b>ZYURA App</b>"]
    end
    
    subgraph "ASAs"
        ASA["<b>Algorand Standard Assets</b>"]
        TRANSFER["<b>Asset Transfer</b>"]
        CREATE_NFT["<b>Create Policy NFT ASA</b>"]
        OPTIN["<b>Opt-in (soulbound)</b>"]
    end
    
    ZP -->|"<b>purchase_policy</b>"| TRANSFER
    ZP -->|"<b>purchase_policy</b>"| CREATE_NFT
    ZP -->|"<b>purchase_policy</b>"| OPTIN
    ZP -->|"<b>process_payout</b>"| TRANSFER
    ZP -->|"<b>deposit_liquidity</b>"| TRANSFER
    ZP -->|"<b>withdraw_liquidity</b>"| TRANSFER
    
    TRANSFER -.Inner Tx.-> ASA
    CREATE_NFT -.Inner Tx.-> ASA
    OPTIN -.Inner Tx.-> ASA
    
    style ZP fill:#667eea,stroke:#4c51bf,stroke-width:4px,color:#fff
    style ASA fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style TRANSFER fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style CREATE_NFT fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style OPTIN fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
```

### 2. Instruction-to-Program Mapping

| ZYURA Action | Target | Inner Transaction | Purpose |
|--------------|--------|-------------------|---------|
| `purchase_policy` | USDC ASA | Asset transfer | Transfer premium to vault |
| `purchase_policy` | Policy NFT | Create ASA + opt-in | Create soulbound policy NFT (ARC-3) |
| `process_payout` | USDC ASA | Asset transfer | Transfer coverage from vault to user |
| `deposit_liquidity` | USDC ASA | Asset transfer | Transfer USDC to vault |
| `withdraw_liquidity` | USDC ASA | Asset transfer | Transfer USDC from vault |

### 3. Data Flow Between Accounts

```mermaid
graph TD
    subgraph "Policy Purchase Flow"
        USER_WALLET[User Wallet] -->|Premium USDC| VAULT[Risk Pool Vault]
        USER_WALLET -->|Create Policy| POLICY_PDA[Policy box/state]
        POLICY_PDA -->|Reference| PRODUCT_PDA[Product box]
        POLICY_PDA -->|Create NFT| NFT_MINT[Policy NFT ASA]
        NFT_MINT -->|Opt-in to User| USER_NFT[User Policy NFT]
        NFT_MINT -->|Metadata| METADATA[ARC-3 / off-chain]
    end
    
    subgraph "Payout Flow"
        ADMIN[Admin] -->|Trigger| POLICY_PDA2[Policy Account]
        POLICY_PDA2 -->|Verify Delay| PRODUCT_PDA2[Product Account]
        VAULT2[Risk Pool Vault] -->|Inner tx: Transfer| USER_WALLET2[User Wallet]
        POLICY_PDA2 -->|Update Status| STATUS[PolicyStatus = PaidOut]
    end
    
    subgraph "Liquidity Flow"
        LP_WALLET[LP Wallet] -->|Deposit USDC| VAULT3[Risk Pool Vault]
        LP_WALLET -->|Update| LP_PDA[LP box]
        LP_PDA -->|Track| BALANCE[active_deposit]
        
        ADMIN2[Admin] -->|Approve Withdrawal| LP_PDA2[LP box]
        VAULT4[Risk Pool Vault] -->|Withdraw USDC| LP_WALLET2[LP Wallet]
        LP_PDA2 -->|Update| BALANCE2[active_deposit]
    end
    
    style USER_WALLET fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style USER_WALLET2 fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style VAULT fill:#10b981,stroke:#047857,stroke-width:4px,color:#fff
    style VAULT2 fill:#10b981,stroke:#047857,stroke-width:4px,color:#fff
    style VAULT3 fill:#10b981,stroke:#047857,stroke-width:4px,color:#fff
    style VAULT4 fill:#10b981,stroke:#047857,stroke-width:4px,color:#fff
    style POLICY_PDA fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style POLICY_PDA2 fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style PRODUCT_PDA fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style PRODUCT_PDA2 fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style NFT_MINT fill:#a78bfa,stroke:#7c3aed,stroke-width:2px,color:#fff
    style USER_NFT fill:#fc8181,stroke:#e53e3e,stroke-width:2px,color:#fff
    style METADATA fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style ADMIN fill:#9f7aea,stroke:#805ad5,stroke-width:2px,color:#fff
    style ADMIN2 fill:#9f7aea,stroke:#805ad5,stroke-width:2px,color:#fff
    style STATUS fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style LP_WALLET fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style LP_WALLET2 fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style LP_PDA fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#fff
    style LP_PDA2 fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#fff
    style BALANCE fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style BALANCE2 fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
```

---

## Part F: Account Management Details

### 1. Account Creation Flow

```mermaid
flowchart TD
    START([Instruction Called]) --> INIT{Account Type}
    
    INIT -->|Config| CONFIG_FLOW[Initialize App Config]
    INIT -->|Product| PRODUCT_FLOW[Create Product box]
    INIT -->|Policy| POLICY_FLOW[Create Policy box]
    INIT -->|LP| LP_FLOW[Create LP box]
    INIT -->|NFT Mint| NFT_FLOW[Create Policy NFT ASA]
    
    CONFIG_FLOW --> CONFIG_SEED[App global state]
    CONFIG_SEED --> CONFIG_PDA[Store: admin, usdc_asa_id, paused]
    CONFIG_PDA --> DONE1([Config Created])
    
    PRODUCT_FLOW --> PROD_SEED[Box key: product_id]
    PROD_SEED --> PROD_PDA[Store: id, thresholds, coverage, rates, active]
    PROD_PDA --> DONE2([Product Created])
    
    POLICY_FLOW --> POL_SEED[Box key: policy_id]
    POL_SEED --> POL_PDA[Store: policyholder, flight details, status]
    POL_PDA --> MINT_NFT_FLOW[Create Policy NFT]
    POL_PDA --> DONE3([Policy Created])
    
    LP_FLOW --> LP_SEED[Box key: provider address]
    LP_SEED --> LP_PDA[Store: provider, deposits, withdrawals, active_deposit]
    LP_PDA --> DONE4([LP Account Created])
    
    NFT_FLOW --> NFT_CREATE[Create ASA<br/>Supply: 1<br/>ARC-3]
    NFT_CREATE --> NFT_ATA[Opt-in to User]
    NFT_ATA --> NFT_MINT[Mint 1 to User]
    NFT_MINT --> NFT_FREEZE[Soulbound]
    NFT_FREEZE --> NFT_META[Metadata URL / off-chain]
    NFT_META --> DONE5([NFT Created])
    
    MINT_NFT_FLOW --> NFT_FLOW
    
    style START fill:#667eea,stroke:#4c51bf,stroke-width:3px,color:#fff
    style INIT fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style CONFIG_FLOW fill:#4299e1,stroke:#2b6cb0,stroke-width:2px,color:#fff
    style CONFIG_SEED fill:#7dd3fc,stroke:#0ea5e9,stroke-width:2px,color:#1a202c
    style CONFIG_PDA fill:#667eea,stroke:#4c51bf,stroke-width:3px,color:#fff
    style PRODUCT_FLOW fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style PROD_SEED fill:#68d391,stroke:#38a169,stroke-width:2px,color:#1a202c
    style PROD_PDA fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style POLICY_FLOW fill:#ed8936,stroke:#c05621,stroke-width:2px,color:#fff
    style POL_SEED fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style POL_PDA fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style LP_FLOW fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style LP_SEED fill:#7dd3fc,stroke:#0ea5e9,stroke-width:2px,color:#1a202c
    style LP_PDA fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#fff
    style NFT_FLOW fill:#a78bfa,stroke:#7c3aed,stroke-width:2px,color:#fff
    style NFT_CREATE fill:#c084fc,stroke:#a855f7,stroke-width:2px,color:#fff
    style NFT_ATA fill:#fc8181,stroke:#e53e3e,stroke-width:2px,color:#fff
    style NFT_MINT fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style NFT_FREEZE fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style NFT_META fill:#ddb3ff,stroke:#c084fc,stroke-width:2px,color:#fff
    style MINT_NFT_FLOW fill:#ed8936,stroke:#c05621,stroke-width:2px,color:#fff
    style DONE1 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE2 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE3 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE4 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style DONE5 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
```

### 2. Account State Transitions

```mermaid
stateDiagram-v2
    [*] --> Uninitialized
    
    Uninitialized --> ConfigInitialized: initialize()
    
    ConfigInitialized --> ProductActive: create_product()
    ConfigInitialized --> ProtocolPaused: set_pause_status(true)
    
    ProductActive --> ProductUpdated: update_product()
    ProductActive --> PolicyActive: purchase_policy()
    
    ProtocolPaused --> ProductActive: set_pause_status(false)
    
    PolicyActive --> PolicyPaidOut: process_payout()
    PolicyActive --> PolicyExpired: Time > claim_window
    
    PolicyPaidOut --> [*]
    PolicyExpired --> [*]
    
    note right of ConfigInitialized
        Stores:
        - admin
        - usdc_mint
        - paused flag
    end note
    
    note right of ProductActive
        Stores:
        - delay_threshold_minutes
        - coverage_amount
        - premium_rate_bps
        - claim_window_hours
    end note
    
    note right of PolicyActive
        Stores:
        - policyholder
        - flight_number
        - departure_time
        - premium_paid
        - coverage_amount
        - status: Active
    end note
    
    note right of PolicyPaidOut
        Updated:
        - status: PaidOut
        - paid_at: timestamp
    end note
```

### 3. Ownership Model

```mermaid
graph TB
    subgraph "Program Ownership"
        ZYURA_PROG["<b>ZYURA App</b><br/>Stateful app (TEALScript)"]
    end
    
    subgraph "App State & Boxes (Owned by App)"
        CONFIG["<b>Config</b>"]
        PROD1["<b>Product 1</b>"]
        PROD2["<b>Product 2</b>"]
        POLICY1["<b>Policy 1</b>"]
        POLICY2["<b>Policy 2</b>"]
        LP1["<b>LP 1</b>"]
        LP2["<b>LP 2</b>"]
    end
    
    subgraph "ASAs (Owned by Users/Vault)"
        USER1_USDC["<b>User USDC</b><br/>Owner: User Wallet"]
        USER2_USDC["<b>User USDC</b><br/>Owner: User Wallet"]
        VAULT["<b>Risk Pool Vault</b><br/>USDC ASA"]
        USER1_NFT["<b>Policy NFT</b><br/>Owner: User Wallet<br/>Soulbound"]
    end
    
    subgraph "Assets"
        NFT_MINT["<b>Policy NFT ASA</b><br/>Supply: 1"]
        USDC_MINT["<b>USDC ASA</b>"]
    end
    
    ZYURA_PROG -.owns.-> CONFIG
    ZYURA_PROG -.owns.-> PROD1
    ZYURA_PROG -.owns.-> PROD2
    ZYURA_PROG -.owns.-> POLICY1
    ZYURA_PROG -.owns.-> POLICY2
    ZYURA_PROG -.owns.-> LP1
    ZYURA_PROG -.owns.-> LP2
    
    CONFIG -.owns.-> VAULT
    ZYURA_PROG -.creates.-> NFT_MINT
    
    style ZYURA_PROG fill:#667eea,stroke:#4c51bf,stroke-width:4px,color:#fff
    style CONFIG fill:#667eea,stroke:#4c51bf,stroke-width:3px,color:#fff
    style PROD1 fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style PROD2 fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style POLICY1 fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style POLICY2 fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style LP1 fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style LP2 fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style MINT_AUTH fill:#9f7aea,stroke:#805ad5,stroke-width:2px,color:#fff
    style VAULT fill:#10b981,stroke:#047857,stroke-width:4px,color:#fff
    style USER1_USDC fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style USER2_USDC fill:#f6ad55,stroke:#dd6b20,stroke-width:2px,color:#1a202c
    style USER1_NFT fill:#fc8181,stroke:#e53e3e,stroke-width:2px,color:#fff
    style NFT_MINT fill:#a78bfa,stroke:#7c3aed,stroke-width:2px,color:#fff
    style USDC_MINT fill:#68d391,stroke:#38a169,stroke-width:2px,color:#1a202c
```

---

## Part G: Security and Access Control

### 1. Authority Checks

```mermaid
flowchart TD
    START([Instruction Call]) --> CHECK_TYPE{Instruction Type}
    
    CHECK_TYPE -->|initialize| FIRST_TIME{Config Exists?}
    FIRST_TIME -->|Yes| ERROR1([Error: Already Initialized])
    FIRST_TIME -->|No| ALLOW1([Allow: First Initialization])
    
    CHECK_TYPE -->|Admin Operations| ADMIN_CHECK{Admin Signature Valid?}
    ADMIN_CHECK -->|No| ERROR2([Error: Unauthorized])
    ADMIN_CHECK -->|Yes| CHECK_PAUSE{Protocol Paused?}
    CHECK_PAUSE -->|Yes| ALLOW_PAUSE_ONLY{Operation is Pause?}
    CHECK_PAUSE -->|No| ALLOW2([Allow: Admin Operation])
    ALLOW_PAUSE_ONLY -->|Yes| ALLOW2
    ALLOW_PAUSE_ONLY -->|No| ERROR3([Error: Protocol Paused])
    
    CHECK_TYPE -->|purchase_policy| CHECK_PAUSE2{Protocol Paused?}
    CHECK_PAUSE2 -->|Yes| ERROR4([Error: Protocol Paused])
    CHECK_PAUSE2 -->|No| CHECK_PRODUCT{Product Active?}
    CHECK_PRODUCT -->|No| ERROR5([Error: Product Inactive])
    CHECK_PRODUCT -->|Yes| CHECK_PREMIUM{Premium >= Required?}
    CHECK_PREMIUM -->|No| ERROR6([Error: Insufficient Premium])
    CHECK_PREMIUM -->|Yes| ALLOW3([Allow: Policy Purchase])
    
    CHECK_TYPE -->|process_payout| ADMIN_CHECK2{Admin Signature Valid?}
    ADMIN_CHECK2 -->|No| ERROR7([Error: Unauthorized])
    ADMIN_CHECK2 -->|Yes| CHECK_STATUS{Policy Active?}
    CHECK_STATUS -->|No| ERROR8([Error: Policy Not Active])
    CHECK_STATUS -->|Yes| CHECK_DELAY{Delay >= Threshold?}
    CHECK_DELAY -->|No| ERROR9([Error: Threshold Not Met])
    CHECK_DELAY -->|Yes| ALLOW4([Allow: Payout])
    
    CHECK_TYPE -->|deposit_liquidity| CHECK_PAUSE3{Protocol Paused?}
    CHECK_PAUSE3 -->|Yes| ERROR10([Error: Protocol Paused])
    CHECK_PAUSE3 -->|No| ALLOW5([Allow: Deposit])
    
    CHECK_TYPE -->|withdraw_liquidity| ADMIN_CHECK3{Admin Signature Valid?}
    ADMIN_CHECK3 -->|No| ERROR11([Error: Unauthorized])
    ADMIN_CHECK3 -->|Yes| CHECK_BALANCE{LP Balance >= Amount?}
    CHECK_BALANCE -->|No| ERROR12([Error: Insufficient Balance])
    CHECK_BALANCE -->|Yes| ALLOW6([Allow: Withdrawal])
    
    style START fill:#667eea,stroke:#4c51bf,stroke-width:3px,color:#fff
    style CHECK_TYPE fill:#b794f4,stroke:#9f7aea,stroke-width:2px,color:#fff
    style FIRST_TIME fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style ADMIN_CHECK fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style ADMIN_CHECK2 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style ADMIN_CHECK3 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_PAUSE fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_PAUSE2 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_PAUSE3 fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_PRODUCT fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_PREMIUM fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_STATUS fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_DELAY fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style CHECK_BALANCE fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style ALLOW_PAUSE_ONLY fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style ALLOW1 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ALLOW2 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ALLOW3 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ALLOW4 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ALLOW5 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ALLOW6 fill:#10b981,stroke:#047857,stroke-width:3px,color:#fff
    style ERROR1 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR2 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR3 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR4 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR5 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR6 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR7 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR8 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR9 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR10 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR11 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
    style ERROR12 fill:#ef4444,stroke:#dc2626,stroke-width:3px,color:#fff
```

### 2. Error Handling Matrix

| Error Condition | Instruction | Error Code | Recovery Path |
|----------------|-------------|------------|---------------|
| Protocol Paused | purchase_policy, deposit_liquidity | ProtocolPaused | Admin must unpause |
| Product Inactive | purchase_policy | ProductInactive | Admin must activate product |
| Insufficient Premium | purchase_policy | InsufficientPremium | User must increase premium |
| Unauthorized | Admin operations | Unauthorized | Verify admin keypair |
| Policy Not Active | process_payout | PolicyNotActive | Policy already paid/expired |
| Delay Threshold Not Met | process_payout | DelayThresholdNotMet | Delay insufficient for payout |
| Insufficient Balance | withdraw_liquidity | InvalidAmount | LP must reduce amount |

---

## Part H: Summary and Key Design Decisions

### 1. Architecture Highlights

**Program Structure:**
- Single stateful app (TEALScript) for simplicity in POC
- Modular logic (initialize, products, policies, liquidity, admin) for clear separation
- App state and box storage for deterministic, scalable state

**Account Design:**
- Config in app global state; products, policies, LPs in boxes keyed by id/address
- Config as central authority store
- Product boxes enable multiple insurance products
- Policy boxes store individual policy state
- LP boxes track per-provider liquidity positions

**Security Model:**
- Admin-controlled critical operations (payouts, withdrawals)
- Protocol-level pause mechanism for emergencies
- Product-level activation controls
- Soulbound policy NFTs (ARC-3) for non-transferable proof

**External Integration:**
- Flight data layer for delay/PNR verification
- ARC-3 and off-chain metadata for policy NFTs
- Algorand Standard Assets for USDC and policy NFTs

### 2. Scalability Considerations

```mermaid
graph LR
    subgraph "Current POC Design"
        POC["<b>Single ZYURA Program</b>"]
        POC --> PRODS["<b>Multiple Products</b>"]
        POC --> POLICIES["<b>Multiple Policies</b>"]
        POC --> LPS["<b>Multiple LPs</b>"]
    end
    
    subgraph "Future Enhancements"
        FUTURE["<b>Multi-Program Architecture</b>"]
        FUTURE --> PRODUCT_PROG["<b>Product Program</b>"]
        FUTURE --> POLICY_PROG["<b>Policy Program</b>"]
        FUTURE --> LIQ_PROG["<b>Liquidity Program</b>"]
        FUTURE --> GOV_PROG["<b>Governance Program</b>"]
    end
    
    POC -.evolves to.-> FUTURE
    
    style POC fill:#667eea,stroke:#4c51bf,stroke-width:4px,color:#fff
    style PRODS fill:#48bb78,stroke:#2f855a,stroke-width:2px,color:#fff
    style POLICIES fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style LPS fill:#38b2ac,stroke:#2c7a7b,stroke-width:2px,color:#fff
    style FUTURE fill:#10b981,stroke:#047857,stroke-width:4px,color:#fff
    style PRODUCT_PROG fill:#34d399,stroke:#059669,stroke-width:2px,color:#fff
    style POLICY_PROG fill:#fbbf24,stroke:#f59e0b,stroke-width:2px,color:#1a202c
    style LIQ_PROG fill:#60a5fa,stroke:#3b82f6,stroke-width:2px,color:#fff
    style GOV_PROG fill:#9f7aea,stroke:#805ad5,stroke-width:2px,color:#fff
```

### 3. Design Rationale

1. **App State & Box Storage:** Protocol state uses app global state and boxes for:
   - Deterministic keys (e.g. product_id, policy_id, provider address)
   - App ownership guarantees
   - Scalable policy and product storage

2. **NFT as Policy Proof:** Policy NFTs serve as:
   - Immutable proof of insurance purchase
   - Non-transferable (frozen) to prevent policy trading
   - Metadata storage for policy details

3. **Admin-Controlled Payouts:** Payouts require admin signature to:
   - Enable oracle verification before on-chain execution
   - Allow manual review of edge cases
   - Prevent automated abuse in POC phase

4. **Single Vault Design:** One risk pool vault for:
   - Simplified liquidity management
   - Easier accounting and auditing
   - Clear separation of protocol funds

---

## Appendix: Diagram Legend

### Shapes and Colors

- **Blue Boxes (#4a90e2):** ZYURA Program and core accounts
- **Light Blue (#90cdf4):** Instruction modules
- **Green (#10b981):** Token/vault accounts and successful operations
- **Yellow (#fbbf24):** Policy accounts and oracle systems
- **Purple (#a78bfa):** NFT-related accounts
- **Orange (#ed8936):** External services
- **Red (#f56565):** Errors and rejected operations

### Arrow Types

- **Solid Arrows:** Direct calls/transfers
- **Dashed Arrows:** Inner transactions (Algorand)
- **Dotted Arrows:** Data reads/references

### Account Types

- **App state / boxes:** Config, products, policies, LPs (owned by ZYURA App)
- **ASAs:** Algorand Standard Assets (USDC, policy NFT)
- **Policy NFT:** ARC-3 ASA, soulbound; metadata via URL or off-chain

---

**End of Assignment 3: Architecture Design**

