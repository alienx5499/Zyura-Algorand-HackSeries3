<div align="center">

# **ZYURA**

### Instant, fair, community‑owned flight‑delay insurance on Algorand

[![Build Passing](https://img.shields.io/badge/build-passing-success?style=flat-square)](https://github.com/alienx5499/Zyura-Algorand/actions)
[![Algorand](https://img.shields.io/badge/Algorand-Testnet-purple?style=flat-square)](https://algorand.com/)
[![TEALScript](https://img.shields.io/badge/TEALScript-Contract-blue?style=flat-square)](https://developer.algorand.org/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat-square)](https://github.com/alienx5499/Zyura-Algorand/blob/main/CONTRIBUTING.md)
[![License: MIT](https://custom-icon-badges.herokuapp.com/github/license/alienx5499/Zyura-Algorand?logo=law&logoColor=white)](https://github.com/alienx5499/Zyura-Algorand/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/platform-Algorand-brightgreen?style=flat-square)](https://algorand.com/)
[![Views](https://visitor-badge.laobi.icu/badge?page_id=alienx5499.Zyura-Algorand)](https://visitor-badge.laobi.icu/badge?page_id=alienx5499.Zyura-Algorand)
[![⭐ GitHub stars](https://img.shields.io/github/stars/alienx5499/Zyura-Algorand?style=social)](https://github.com/alienx5499/Zyura-Algorand/stargazers)
[![🍴 GitHub forks](https://img.shields.io/github/forks/alienx5499/Zyura-Algorand?style=social)](https://github.com/alienx5499/Zyura-Algorand/network)
[![Commits](https://badgen.net/github/commits/alienx5499/Zyura-Algorand)](https://github.com/alienx5499/Zyura-Algorand/commits/main)
[![🐛 GitHub issues](https://img.shields.io/github/issues/alienx5499/Zyura-Algorand)](https://github.com/alienx5499/Zyura-Algorand/issues)
[![📂 GitHub pull requests](https://img.shields.io/github/issues-pr/alienx5499/Zyura-Algorand)](https://github.com/alienx5499/Zyura-Algorand/pulls)
[![💾 GitHub code size](https://img.shields.io/github/languages/code-size/alienx5499/Zyura-Algorand)](https://github.com/alienx5499/Zyura-Algorand)

<img alt="ZYURA" src="https://zyura-algorand.vercel.app/logo.svg" width="120" height="120" style="filter: invert(1);" />

</div>

---

## 🎯 **What is ZYURA?**

ZYURA transforms traditional travel insurance from a slow, opaque process into **instant, AI-powered, community-governed flight delay protection** on Algorand. When your flight is delayed beyond a defined threshold, smart contracts automatically trigger **instant USDC payouts**—no claims forms, no adjusters, no waiting.

Flight delay data (via configurable data layer; demo uses GitHub-backed store) drives payouts, and all terms, payouts, and accounting are **100% transparent on-chain**.

> **📌 POC Focus:** This Proof-of-Concept focuses exclusively on **parametric flight delay insurance** to prove the off-chain data pipeline and on-chain payout integrity. The goal is to demonstrate instant, automated payouts based on verified oracle data, evolving into a community-governed, surplus-sharing model.

### 🌟 **Key Features**

- ⚡ **Instant Claims Processing**: Sub-second payouts through automated smart contract execution
- 🏛️ **Community Ownership**: Democratic governance and surplus redistribution to policyholders
- 💰 **Micro-Insurance Accessibility**: Affordable, event-based coverage embedded at checkout
- 🔒 **Transparent & Auditable**: All policy terms, oracle checks, and payouts on-chain
- 🎫 **NFT Policy Proof**: Immutable, soulbound NFTs as proof of insurance
- 🌐 **Data-Driven**: Configurable data layer (e.g. GitHub-backed store) for flight delay and PNR data

> Protect your flights, get paid instantly. No paperwork, no waiting.

<div align="center">

### Build with us

Need instant flight‑delay protection? You’re exactly who we built this for.

<a href="https://github.com/alienx5499/Zyura-Algorand">
  <img src="https://img.shields.io/badge/⭐%20Star%20this%20repo-Be%20part%20of%20our%20community!-yellow?style=for-the-badge&logo=github" alt="Star this repo" />
</a>

<a href="https://twitter.com/intent/tweet?text=🔥%20ZYURA%20on%20Algorand—instant%20flight%20delay%20insurance!%20Instant%20payouts,%20transparent%20on-chain.%20https://github.com/alienx5499/Zyura-Algorand%20@alienx5499">
<img src="https://img.shields.io/badge/Share-Help%20a%20fellow%20traveler!-1DA1F2?style=for-the-badge&logo=twitter" alt="Tweet about ZYURA" />
</a>

Every star helps us build a more transparent and accessible insurance future.

</div>

---

## 🌐 **Algorand Testnet**

| Item | Value |
|------|--------|
| **App ID (Testnet)** | `758740660` |
| **USDC ASA (Testnet)** | `758740670` |
| **Live demo** | [zyura-algorand.vercel.app](https://zyura-algorand.vercel.app/) |
| **Testnet explorer** | [Algorand Testnet Explorer](https://testnet.explorer.perawallet.app/) — use the App ID above to inspect the app. |
| **Sample Policy NFT (Testnet)** | [`758742324`](https://testnet.explorer.perawallet.app/asset/758742324/) |

Use these IDs in `frontend/.env.local` (see [Quick Start](#-quick-start)) when running the frontend against the deployed Testnet app.

---

## 📚 **Table of Contents**

1. [🌐 Algorand Testnet](#-algorand-testnet)
2. [✨ Features](#-features)
3. [🎯 Value Proposition & Market Fit](#-value-proposition--market-fit)
4. [👥 Target Users & User Stories](#-target-users--user-stories)
5. [🦾 Tech Stack](#-tech-stack)
6. [📂 Project Structure](#-project-structure)
7. [🚀 Quick Start](#-quick-start)
8. [👨‍🔧 Detailed Setup](#-detailed-setup)
9. [🏗️ Architecture](#️-architecture)
10. [📊 Architecture Diagrams](#-architecture-diagrams)
11. [🔐 Security & Access Control](#-security--access-control)
12. [🤝 Contributing](#-contributing)
13. [🌟 Awesome Contributors](#-awesome-contributors)
14. [📜 License](#-license)
15. [📬 Feedback & Suggestions](#-feedback--suggestions)

---

## ✨ **Features**

### ⚡ **Instant Payouts**

- Automated smart contract execution upon verified delays
- Sub-second USDC transfers from risk pool vault
- No manual claims processing required
- Oracle-triggered parametric insurance model

### 🎫 **NFT Policy Management**

- **Soulbound NFTs**: Non-transferable policy proof tokens
- **On-Chain Metadata**: All policy details stored immutably
- **ARC-3 / ASA**: Standard Algorand asset (NFT) format for compatibility
- **Policy Tracking**: Easy portfolio management
 - **Metadata Hosting**: SVG images and JSON metadata for minted policy NFTs live under `NFT/metadata/{wallet}/…` in the [`Zyura-Algorand-HackSeries3-MetaData`](https://github.com/alienx5499/Zyura-Algorand-HackSeries3-MetaData) repo; flight JSON lives under `Flight/Metadata/flights/{flight}/flight.json`. The frontend uploads via internal APIs.

### 🔍 **Oracle Integration**

- **Flight Data Layer**: Flight delay and PNR data (demo: GitHub-backed; production: oracle or API)
- **Multi-Source Aggregation**: Reliable data verification
- **Threshold-Based Triggers**: Configurable delay thresholds
- **Transparent Verification**: All checks auditable on-chain

### 💰 **Liquidity Management**

- **Liquidity Provider Support**: Earn yield on risk pool
- **Transparent Accounting**: All deposits/withdrawals on-chain
- **Admin-Controlled Withdrawals**: Security-focused design
- **Active Deposit Tracking**: Real-time LP positions

### 🏛️ **Protocol Controls**

- **Pause Mechanism**: Emergency protocol pause capability
- **Product Management**: Multiple insurance products supported
- **Admin Controls**: Secure administrative operations
- **Configurable Parameters**: Flexible product definitions

---

## 🎯 **Value Proposition & Market Fit**

### **Core Value Proposition**

ZYURA transforms traditional travel insurance from a slow, opaque process into instant, AI-powered, community-governed flight delay protection on Algorand. For this POC, we focus exclusively on **parametric flight delay insurance**: when a covered flight is delayed beyond a defined threshold, smart contracts automatically trigger instant USDC payouts—no claims forms or adjusters.

**Key Value Areas:**
1. **Instant Claims Processing**: Sub-second payouts through automated smart contract execution
2. **Community Ownership**: Democratic governance and surplus redistribution to policyholders
3. **Micro-Insurance Accessibility**: Affordable, event-based coverage embedded at checkout

**Product-Market Fit:**
Flight delays are frequent, verifiable events that cause real traveler pain. Traditional travel insurance is paperwork-heavy and slow; parametric payouts reduce friction to near-zero. Algorand's speed and low fees make instant micro-payouts viable, while community governance enables transparent surplus sharing and aligned incentives with travelers.

### **Target Markets**

1. **Frequent Travelers (Primary)**: Business and leisure travelers who want instant compensation for flight delays without paperwork
2. **Travel Platforms & OTAs (Distribution)**: Online travel agencies, airline partners, and booking apps that can bundle parametric cover at checkout
3. **Corporate Travel (Secondary)**: Companies with frequent traveler populations that value automated reimbursements and reduced admin overhead
4. **DeFi-Native Users (Early Adopters)**: Crypto-savvy travelers and liquidity providers willing to bootstrap the risk pool and showcase on-chain transparency

### **Competitive Advantages**

- **Instant Payouts**: Deterministic, on-chain execution upon oracle-verified delays
- **Lower Costs**: Minimal overhead via automation; micro-premiums viable on Algorand
- **Transparency**: Policy terms, oracle checks, and payouts are auditable on-chain
- **Community Ownership**: Surplus sharing and governance align incentives with travelers

### **Competitor Landscape**

**Direct Competitors:**
- **Allianz Travel, World Nomads, AXA**: Conventional travel insurance—manual claims, slower payouts, higher overhead
- **Parametric Flight Products**: Automated payouts but limited availability and opaque processing

**Adjacent Competitors:**
- **Airlines/OTAs with vouchers/credits**: Often restrictive, not instant cash, lack transparency
- **DeFi Insurance Protocols (Nexus Mutual, InsurAce)**: Strong on crypto-native risks; limited real-world parametrics with dependable off-chain pipelines

### **Key Challenges & Considerations**

Based on adversarial analysis, ZYURA addresses several critical considerations:

**1. Regulatory Challenges**
- Insurance is heavily regulated across jurisdictions
- **Mitigation**: Parametric insurance model reduces regulatory complexity compared to traditional insurance
- Focus on transparent, on-chain compliance

**2. Oracle Reliability**
- Dependence on external data sources creates potential single points of failure
- **Mitigation**: Data-layer aggregation with multi-source reconciliation and on-chain status checks
- Robust off-chain pipelines as a key technical moat

**3. Market Education**
- Users may need education on decentralized insurance
- **Approach**: Start with DeFi-native early adopters, then expand to broader markets
- Transparent on-chain operations build trust over time

**4. Competition from Incumbents**
- Large insurers could replicate the model
- **Advantage**: Technical barriers and Algorand's cost/speed advantages create differentiation
- Community ownership model creates sustainable competitive advantages

**5. Market Size**
- Micro-insurance revenue sustainability concerns
- **Positioning**: Low overhead via automation makes micro-premiums viable
- Embedded checkout distribution expands addressable market

### **Founder-Market Fit**

**Strengths:**
- Technical proficiency in blockchain development and Algorand architecture
- Experience integrating data oracles and designing parametric triggers
- Understanding of DeFi protocols and community-driven projects
- Network access to DeFi developers, travel-tech founders, and oracle providers

**Areas for Development:**
- Deeper regulatory knowledge of insurance compliance across jurisdictions
- Enhanced understanding of actuarial science and risk modeling
- Stronger connections to traditional insurance industry stakeholders
- Need for insurance industry advisors and legal counsel

**Strategy:**
- Emphasize technical expertise and community understanding as core strengths
- Build partnerships with existing insurance providers
- Engage regulatory advisors early in development

---

## 👥 **Target Users & User Stories**

### **Prioritized User Types (POC Focus)**

1. **Travelers**: Purchase cover at checkout and receive instant payouts
2. **OTA/Airline Operators**: Integrate and manage distribution channels
3. **Liquidity Providers**: Deposit USDC into risk pool for yield
4. **Protocol Admin**: Configure parameters and manage emergency controls

### **Key User Functions**

#### **Traveler Functions**
- View flight-delay products and coverage thresholds
- Purchase/activate cover at checkout (select flight, pay premium)
- View active policy (flight, window, cap)
- Receive auto payout when delay threshold is verified
- View payout history and receipts

#### **OTA/Airline Operator Functions**
- Configure product placement and checkout flow
- Pass flight identifiers and booking refs to on-chain policy creation
- Monitor payout status and customer notifications

#### **Liquidity Provider Functions**
- Deposit USDC into risk pool
- View pool metrics (utilization, losses, surplus)
- Withdraw liquidity (subject to admin approval)
- Track active deposits and yields

#### **Protocol Admin Functions**
- Configure product parameters (threshold, premium rate, coverage cap)
- Manage data layer and freshness thresholds
- Pause/resume product in emergencies
- Process payouts after oracle verification

### **Critical User Stories**

1. **Traveler purchases a flight-delay parametric cover at checkout and later receives instant payout upon an oracle-verified delay**
2. **Liquidity provider deposits USDC into the pool and accrues surplus, with the system honoring payouts from the pool**

### **On-Chain Requirements**

#### **Core Requirements**

- **Product Registry**: Flight-delay parameters (threshold minutes, coverage cap, premium rate, claim window)
  - Product registry account stores available insurance types
  - Each product has unique identifier and display parameters
  - Readable by any user without transaction fees
  
- **Policy Creation**: Store traveler, flight identifier, coverage window, and premium paid
  - Policy minting function creates new policy account
  - Stores: policyholder address, product type, premium paid, coverage start/end times, coverage amount
  - Transfers USDC from user to risk pool vault
  - Fails if insufficient USDC balance or product is paused
  
- **Data Pipeline**: Flight delay and PNR data (e.g. GitHub store or oracle) with reconciliation and status checks
  - Oracle verification function checks external data against policy terms
  - Multi-source data aggregation and reconciliation
  - On-chain freshness validation to prevent replay attacks
  
- **Payout System**: Transfer USDC to traveler and mark policy paid
  - Payout function transfers USDC from risk pool to policyholder
  - Updates policy state to prevent double-payouts
  - Fails if policy expired, already paid, or risk pool underfunded
  
- **Risk Pool**: Vault, LP shares accounting, surplus ledger
  - Risk pool vault account holds USDC
  - Share tracking system records each LP's contribution
  - Surplus ledger tracks excess funds
  
- **LP Management**: Deposit/withdraw flows with share tracking
  - Deposit function calculates and mints LP shares based on current pool value
  - Handles empty pool case (first deposit gets 1:1 shares)
  - Withdrawal respects lockup periods and prevents underfunding
  
- **Admin Controls**: Parameters and pause switch
  - Pause flag stored in global program state
  - All policy creation functions check pause status
  - Admin-restricted pause/unpause operations

#### **Technical Considerations**

- **Account Rent**: All accounts must maintain minimum SOL balance for rent exemption
- **Transaction Fees**: Users pay SOL for transaction fees; program handles rent requirements
- **Algorand Standard Assets (ASA)**: USDC and policy NFTs as ASAs; transfers via inner transactions
- **Emergency Procedures**: Pause mechanism for protocol emergencies
- **Query Capabilities**: Policy data readable without transaction fees for frontend queries

#### **Edge Cases & Error Handling**

- **Pool Underfunding**: Withdrawals blocked if would leave insufficient funds for active policies
- **Policy Expiration**: Policies expire after claim window; no payouts after expiration
- **Oracle Failures**: Admin can manually verify and process payouts if oracle data unavailable
- **Double Payout Prevention**: Policy status tracked to prevent multiple payouts
- **Product Pause**: Policy purchases blocked when product paused; existing policies unaffected

---

## 🦾 **Tech Stack**

### ⛓️ **Blockchain**

- **Algorand**: High-performance blockchain for instant transactions
- **TEALScript**: Smart contract development (Zyura app + boxes)
- **Flight Data Layer**: Configurable (e.g. GitHub-backed store or oracle) for delay/PNR data
- **ARC-3 / ASA**: NFT metadata and standards for policy NFTs
- **Algorand Standard Assets**: USDC and policy NFTs

### 🌐 **Frontend**

- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern styling
- **Pera / Algorand wallet**: Wallet integration
- **algosdk**: Algorand SDK for app and ASA interaction

### 🛠️ **Development Tools**

- **TEALScript / Algorand dev tools**: Build and deploy contracts
- **Algorand CLI (goal) or SDK**: Blockchain interaction
- **pnpm**: Fast package manager
- **TypeScript**: Type checking
- **ESLint**: Code quality

---

## 📂 **Project Structure**

```
ZYURA/
├── contracts/                    # Algorand contracts (TEALScript / artifacts)
│   ├── programs/
│   │   └── zyura/               # Main program source
│   │       ├── src/
│   │       │   ├── lib.rs       # Program entry point
│   │       │   ├── instructions/ # Instruction handlers
│   │       │   │   ├── initialize.rs
│   │       │   │   ├── admin.rs
│   │       │   │   ├── product.rs
│   │       │   │   ├── policy.rs
│   │       │   │   └── liquidity.rs
│   │       │   ├── state/       # Account state definitions
│   │       │   └── errors/      # Custom error types
│   │       └── Cargo.toml
│   ├── tests/                   # Integration tests
│   ├── migrations/              # Deployment scripts
│   ├── (TEALScript / build config)  # Contract configuration
│   └── package.json
│
├── frontend/                     # Next.js web application
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── page.tsx         # Landing page
│   │   │   ├── dashboard/       # Dashboard pages
│   │   │   └── layout.tsx
│   │   ├── components/          # React components
│   │   │   ├── ui/             # UI component library
│   │   │   └── ...
│   │   ├── contexts/           # React contexts
│   │   │   ├── WalletConnectionProvider.tsx
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities
│   │   └── idl/                # Program IDL
│   ├── scripts/                # Admin scripts
│   │   ├── admin.ts
│   │   ├── purchase.ts
│   │   ├── payout.ts
│   │   └── deposit.ts
│   ├── public/                 # Static assets
│   └── package.json
│
├── .gitignore
└── README.md                    # This file
```

### 📁 **Key Directories**:

- **`contracts/`**: Algorand app and box storage logic (TEALScript or equivalent)
- **`contracts/tests/`**: Integration tests for the program
- **`frontend/src/app/`**: Next.js App Router with pages and layouts
- **`frontend/src/components/`**: React components and UI library
- **`frontend/scripts/`**: Admin and interaction scripts
- **`frontend/`**: Next.js app; uses Algorand SDK and app/ASA ABIs

---

## 🚀 **Quick Start**

### **Prerequisites**

- **Node.js** 18+ and **pnpm**
- **Node.js** and **Algorand dev tools** (e.g. sandbox, goal, or SDK)
- **TEALScript** (or Algorand contract tooling) if building contracts
- **Pera (Algorand) wallet** or compatible wallet

### **1. Clone & Install**

```bash
# Clone the repository
git clone https://github.com/alienx5499/ZYURA.git
cd ZYURA

# Install contract dependencies
cd contracts
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### **2. Build & Deploy Contracts**

```bash
cd contracts

# Build (TEALScript or repo build script)
# pnpm build  or  npm run build

# Run tests (Algorand sandbox or test runner)
# pnpm test  or  npm run test

# Deploy to Testnet (see repo scripts or docs)
# pnpm deploy  or  npm run deploy
```

### **3. Run Frontend**

```bash
cd frontend

# Start development server
pnpm dev

# Open http://localhost:3000
```

### **4. Run Contract Tests (Local)**

1. Start Algorand Sandbox (one-time setup: see [Algorand Developer Portal](https://developer.algorand.org/)):
   ```bash
   # From repo root or contracts folder, e.g.:
   # ./scripts/sandbox up   or  make sandbox-up
   ```
2. In `contracts/`, run tests:
   ```bash
   pnpm test
   # or: npm run test
   ```
   Uses local algod (sandbox) for testing.

---

## 👨‍🔧 **Detailed Setup**

### **Prerequisites Installation**

1. **Install Node.js** (LTS): [nodejs.org](https://nodejs.org/)

2. **Install Algorand tooling** (sandbox, goal, or SDK):
   See [Algorand Developer Portal](https://developer.algorand.org/) for install steps.

3. **Setup Algorand wallet** (e.g. Pera):
   Create or import a wallet on Testnet; fund with TestNet ALGO from a faucet.

### **Contract Setup**

```bash
cd contracts

# Install dependencies
pnpm install  # or npm/yarn

# Build contracts (TEALScript or your tooling)
# Run tests (e.g. Algorand sandbox)
# Deploy app and assets to Testnet (see repo scripts/docs)
```

### **Frontend Setup**

```bash
cd frontend

# Install dependencies
pnpm install

# Copy environment variables (if needed)
cp .env.example .env.local

# Start dev server
pnpm dev
```

### **Admin Scripts**

```bash
cd frontend

# Initialize protocol (admin only)
pnpm admin initialize

# Create product
pnpm admin create-product

# Update product
pnpm update

# Process payout
pnpm payout

# Deposit liquidity
pnpm deposit
```

---

## 🏗️ **Architecture**

### **Program Structure**

On Algorand, ZYURA uses a single app (TEALScript) and box storage that mirror the same logic:

- **App state / global state**: Protocol configuration and admin controls
- **Product data**: Insurance product definitions (e.g. in app state or boxes)
- **Policy data**: Individual policies with ASA (NFT) proof; policy state in boxes or on-chain
- **LP tracking**: Liquidity provider tracking
- **Vault**: Central USDC ASA vault for premiums and payouts

### **Key Instructions**

- `initialize` - Initialize the protocol (admin only)
- `create_product` - Create a new insurance product
- `update_product` - Update product parameters
- `purchase_policy` - Purchase flight delay insurance
- `process_payout` - Admin-triggered payout for eligible policies
- `deposit_liquidity` - LP deposits to risk pool
- `withdraw_liquidity` - LP withdrawals (admin approved)
- `set_pause_status` - Pause/resume protocol

### **Account Types (Algorand)**

- **App account**: ZYURA app (logic and global state)
- **Box storage**: Key-value data for products, policies, LPs (as needed)
- **ASAs**: USDC (Algorand USDC) and policy NFTs (ARC-3 style)
- **Metadata**: ASA params and optional off-chain metadata (e.g. GitHub)

**Deployment (Testnet):** App ID `758740660`, USDC ASA `758740670` — see [Algorand Testnet](#-algorand-testnet) above. For full architecture diagrams, see [architecture-design.md](./architecture-design.md).

---

## 📊 **Architecture Diagrams**

_The diagrams below illustrate the logical architecture: a single app (TEALScript), box storage, and ASAs; flight data comes from a configurable layer (e.g. GitHub-backed store)._

### **1. Core Program Architecture**

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

### **2. Account Hierarchy and Ownership**

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
```

### **3. Instruction Flow Diagram**

```mermaid
flowchart TD
    START([User Action]) --> CHECK{Action Type}
    
    CHECK -->|Initialize| INIT_FLOW[Initialize Protocol]
    CHECK -->|Admin| ADMIN_FLOW[Admin Operations]
    CHECK -->|Purchase| PURCHASE_FLOW[Purchase Policy]
    CHECK -->|Payout| PAYOUT_FLOW[Process Payout]
    CHECK -->|Liquidity| LIQ_FLOW[Liquidity Operations]
    
    INIT_FLOW --> INIT_ACCOUNTS[Initialize App / Config]
    INIT_ACCOUNTS --> DONE1([Protocol Ready])
    
    ADMIN_FLOW --> ADMIN_CHECK{Admin Authorized?}
    ADMIN_CHECK -->|Yes| PROD_MGMT[Create/Update Product]
    ADMIN_CHECK -->|Yes| PAUSE[Pause/Resume Protocol]
    ADMIN_CHECK -->|No| ERROR1([Error: Unauthorized])
    PROD_MGMT --> DONE2([Product Updated])
    PAUSE --> DONE3([Protocol Paused/Resumed])
    
    PURCHASE_FLOW --> CHECK_PAUSE{Protocol Paused?}
    CHECK_PAUSE -->|Yes| ERROR2([Error: Protocol Paused])
    CHECK_PAUSE -->|No| CHECK_PRODUCT{Product Active?}
    CHECK_PRODUCT -->|No| ERROR3([Error: Product Inactive])
    CHECK_PRODUCT -->|Yes| TRANSFER_PREM[Transfer Premium to Vault]
    TRANSFER_PREM --> CREATE_POLICY[Create Policy (box/state)]
    CREATE_POLICY --> MINT_NFT[Create Policy NFT ASA]
    MINT_NFT --> FREEZE_NFT[Opt-in soulbound NFT]
    FREEZE_NFT --> DONE4([Policy Active])
    
    PAYOUT_FLOW --> VERIFY_ADMIN{Admin Signature?}
    VERIFY_ADMIN -->|No| ERROR4([Error: Unauthorized])
    VERIFY_ADMIN -->|Yes| CHECK_STATUS{Policy Active?}
    CHECK_STATUS -->|No| ERROR5([Error: Policy Not Active])
    CHECK_STATUS -->|Yes| VERIFY_DELAY{Delay >= Threshold?}
    VERIFY_DELAY -->|No| ERROR6([Error: Threshold Not Met])
    VERIFY_DELAY -->|Yes| TRANSFER_PAYOUT[Transfer Coverage Amount]
    TRANSFER_PAYOUT --> UPDATE_STATUS[Update Policy Status]
    UPDATE_STATUS --> DONE5([Payout Complete])
    
    LIQ_FLOW --> LIQ_TYPE{Operation Type}
    LIQ_TYPE -->|Deposit| DEPOSIT[Transfer to Vault]
    LIQ_TYPE -->|Withdraw| WITHDRAW_CHECK{Admin Auth?}
    DEPOSIT --> UPDATE_LP[Update LP Account]
    UPDATE_LP --> DONE6([Deposit Complete])
    WITHDRAW_CHECK -->|No| ERROR7([Error: Unauthorized])
    WITHDRAW_CHECK -->|Yes| WITHDRAW[Transfer from Vault]
    WITHDRAW --> UPDATE_LP2[Update LP Account]
    UPDATE_LP2 --> DONE7([Withdrawal Complete])
    
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

### **4. Account Data Structures**

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

### **5. User Journey: Purchase to Payout**

```mermaid
sequenceDiagram
    participant Traveler
    participant OTA as OTA Frontend
    participant Wallet as User Wallet
    participant App as ZYURA App
    participant ASA as ASAs (USDC / NFT)
    participant Vault as Risk Pool Vault
    participant NFT as Policy NFT (ARC-3)
    
    Note over Traveler,NFT: 1. POLICY PURCHASE FLOW
    
    Traveler->>OTA: Select Flight & Insurance
    OTA->>Wallet: Request Transaction
    Wallet->>App: purchase_policy()
    
    App->>App: Check Protocol Status
    App->>App: Verify Product Active
    App->>App: Calculate Premium
    
    App->>ASA: Inner tx: Transfer USDC to Vault
    ASA->>Wallet: Deduct Premium
    ASA->>Vault: Add Premium
    
    App->>App: Create Policy (box/state)
    App->>ASA: Inner tx: Create & opt-in Policy NFT
    ASA->>NFT: Create ASA (supply 1)
    App->>NFT: Soulbound to User
    
    App-->>Traveler: Policy Active + NFT Minted
    
    Note over Traveler,NFT: 2. PAYOUT FLOW (After Delay Detected)
    
    App->>App: Admin calls process_payout()
    App->>App: Verify Admin Authority
    App->>App: Check Policy Status
    App->>App: Verify Delay >= Threshold (data layer)
    
    App->>ASA: Inner tx: Transfer coverage from Vault
    ASA->>Vault: Deduct Coverage
    ASA->>Wallet: Add Coverage
    
    App->>App: Update Policy Status = PaidOut
    App-->>Traveler: Payout Complete
```

### **6. Inner Transactions (Algorand)**

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

### **7. Oracle Data Flow**

How flight delay data flows from external sources to on-chain payouts:

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

### **8. Inner Transaction Mapping**

| ZYURA Action | Target | Inner Transaction | Purpose |
|--------------|--------|-------------------|---------|
| `purchase_policy` | USDC ASA | Asset transfer | Transfer premium to vault |
| `purchase_policy` | Policy NFT | Create ASA + opt-in | Create soulbound policy NFT (ARC-3) |
| `process_payout` | USDC ASA | Asset transfer | Transfer coverage from vault to user |
| `deposit_liquidity` | USDC ASA | Asset transfer | Transfer USDC to vault |
| `withdraw_liquidity` | USDC ASA | Asset transfer | Transfer USDC from vault |

For more detailed architecture diagrams, external integrations, user flows, and security models, see [architecture-design.md](./architecture-design.md).

---

## 🔐 **Security & Access Control**

### **Security Features**

- **Admin-Controlled Operations**: Critical operations require admin signature
- **Protocol Pause Mechanism**: Emergency pause capability for protocol-wide halts
- **Product-Level Activation**: Individual product activation controls
- **NFT Account Freezing**: Soulbound token behavior (non-transferable policies)
- **Data Verification**: Flight data layer verification with freshness/status checks
- **Threshold-Based Payouts**: Configurable delay thresholds per product
- **Double-Payout Prevention**: Policy status tracking prevents multiple payouts
- **Box/State**: App state and box storage for config, products, policies, LPs

### **Authority Checks**

All instructions implement comprehensive authority validation:

- **Initialize**: One-time initialization, fails if config already exists
- **Admin Operations**: All admin functions verify admin signature from app config
- **Policy Purchase**: Checks protocol pause status, product activation, and sufficient premium
- **Payout Processing**: Verifies admin authority, policy status, delay threshold, and pool funds
- **Liquidity Operations**: Deposit checks pause status; withdrawal requires admin approval

### **Error Handling**

| Error Condition | Instruction | Error Code | Recovery Path |
|----------------|-------------|------------|---------------|
| Protocol Paused | purchase_policy, deposit_liquidity | ProtocolPaused | Admin must unpause |
| Product Inactive | purchase_policy | ProductInactive | Admin must activate product |
| Insufficient Premium | purchase_policy | InsufficientPremium | User must increase premium |
| Unauthorized | Admin operations | Unauthorized | Verify admin keypair |
| Policy Not Active | process_payout | PolicyNotActive | Policy already paid/expired |
| Delay Threshold Not Met | process_payout | DelayThresholdNotMet | Delay insufficient for payout |
| Insufficient Balance | withdraw_liquidity | InvalidAmount | LP must reduce amount |

### **Design Rationale**

Key architectural decisions and their rationale:

**1. App State & Box Storage**
- Config, products, policies, and LP data in app global state and boxes
- App ownership guarantees security and deterministic addressing
- Key-value boxes by id for scalable policy and product storage

**2. NFT as Policy Proof**
- Immutable proof of insurance purchase as ARC-3 ASA
- Soulbound (non-transferable) to prevent policy trading and maintain authenticity
- Metadata via ASA params and optional off-chain JSON (e.g. GitHub) for rich display
- ARC-3 ensures compatibility with Pera and Algorand NFT tooling

**3. Admin-Controlled Payouts**
- Payouts require admin signature to enable data-layer verification before on-chain execution
- Allows manual review of edge cases and disputed claims
- Prevents automated abuse in POC phase while maintaining flexibility for future automation

**4. Single Vault Design**
- One risk pool vault simplifies liquidity management
- Easier accounting and auditing with centralized fund tracking
- Clear separation of protocol funds from user wallets

**5. Parametric Insurance Model**
- Event-based triggers (flight delays) reduce regulatory complexity
- Eliminates need for subjective claims assessment
- Enables instant, automated payouts upon oracle verification

**6. Data Layer Integration**
- Configurable flight data layer (e.g. GitHub-backed store or oracle) provides delay/PNR data
- Multi-source aggregation improves data reliability
- Status and freshness checks prevent replay and stale data

### **Scalability Considerations**

```mermaid
graph LR
    subgraph "Current POC Design"
        POC["<b>Single ZYURA App</b>"]
        POC --> PRODS["<b>Multiple Products</b>"]
        POC --> POLICIES["<b>Multiple Policies</b>"]
        POC --> LPS["<b>Multiple LPs</b>"]
    end
    
    subgraph "Future Enhancements"
        FUTURE["<b>Multi-App / Modular Architecture</b>"]
        FUTURE --> PRODUCT_PROG["<b>Product App</b>"]
        FUTURE --> POLICY_PROG["<b>Policy App</b>"]
        FUTURE --> LIQ_PROG["<b>Liquidity App</b>"]
        FUTURE --> GOV_PROG["<b>Governance App</b>"]
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

**Current POC Design:**
- Single app (TEALScript) for simplicity
- Multiple products, policies, and LPs supported via app state and boxes
- Box storage enables horizontal scaling of policies and products

**Future Enhancements:**
- Multi-app architecture with separate apps for products, policies, liquidity, and governance
- App decomposition for better upgradeability and modularity
- Enhanced governance mechanisms for community-driven decisions

---

## 🤝 **Contributing**

We ❤️ open source! Your contributions make this project better.

### **How to Contribute**

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/Zyura-Algorand.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit Changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

4. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open Pull Request**

### **Contribution Guidelines**

- Follow the existing code style
- Add tests for new features
- Update documentation
- Keep commits clean and meaningful
- Test on Algorand Testnet before submitting

---

## <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f31f/512.webp" width="35" height="30"> **Awesome Contributors**

<div align="center">
	<h3>Thank you for contributing to our repository</h3><br>
	<p align="center">
		<a href="https://github.com/alienx5499/Zyura-Algorand/contributors">
			<img src="https://contrib.rocks/image?repo=alienx5499/Zyura-Algorand" width="720" height="380" />
		</a>
	</p>
</div>

---

## 📜 **License**

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for full terms.

Unless otherwise noted in a file header, all source code in this repository is provided under the MIT License. Individual files or components that include their own license headers remain under those specified terms.

---

<div align="center">

### 📬 **Feedback & Suggestions**

_We value your input! Share your thoughts through [GitHub Issues](https://github.com/alienx5499/Zyura-Algorand/issues)._

💡 _Let's work together to build a more transparent and accessible insurance future on Algorand!_

**🚀 LFG!**

</div>

---

