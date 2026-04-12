## User Requirements & On-Chain Design (Zyura)

This document captures the core user roles, primary user stories, and the corresponding on-chain requirements for Zyura’s flight-delay protection protocol on Algorand.

---

### 1. User roles

- **Traveler**: Buys protection for a specific flight and receives payouts on delay.  
- **OTA / Airline operator**: Integrates Zyura into booking flows and passes flight context.  
- **Liquidity provider (LP)**: Supplies USDC liquidity to the risk pool and may withdraw later.  
- **Protocol admin**: Configures products, manages the data layer, and controls emergency actions.

---

### 2. Core user stories

1. **Traveler – Purchase & payout**
   - Traveler connects a wallet, selects a delay-protection product, links a specific flight (booking reference + flight number + departure time), pays a premium in USDC, and receives:
     - an on-chain policy record, and
     - a policy NFT (ARC-3 ASA) as proof.
   - If the flight delay exceeds the product’s threshold, the system automatically marks the policy as paid out and sends USDC from the vault ASA to the traveler’s wallet.

2. **Liquidity provider – Deposit & withdraw**
   - LP deposits USDC into the risk pool and obtains a tracked position (e.g., balances/metrics).  
   - LP can later request a withdrawal; the system checks available liquidity and only allows withdrawals that do not compromise active policy obligations.

3. **OTA / Airline operator – Integration**
   - Operator embeds Zyura into its booking flow, passing booking reference, flight number, and departure details into the frontend/API when a user opts in to protection.  
   - Operator can query policy status and payout outcomes for customer-support and analytics.

4. **Admin – Governance & safety**
   - Admin defines and updates products (delay thresholds, coverage amounts, premiums, claim windows).  
   - Admin can pause/unpause the protocol or specific products, and trigger/approve payouts when the delay oracle/data layer confirms a covered event.

---

### 3. On-chain requirements by story

#### 3.1 Traveler – Purchase & payout

**Data structures**
- Product storage (box key = product_id):
  - `delay_threshold_minutes`
  - `coverage_amount`
  - `premium_rate_bps`
  - `claim_window_hours`
  - `active` flag
- Policy storage (box key = policy_id):
  - `policyholder` (Algorand address)
  - `product_id`
  - `flight_number`
  - `booking_ref`
  - `departure_time`
  - `premium_paid`
  - `coverage_amount`
  - `status` (Active / PaidOut / Expired)
  - `created_at`, optional `paid_at`

**Contract behaviour**
- `purchase_policy` ABI method:
  - Validates product is active and protocol not paused.
  - Transfers premium USDC from traveler to the vault ASA (inner transaction).
  - Creates/updates the policy box with the correct fields and `status = Active`.
  - Mints or links a policy NFT ASA to the traveler (ARC-3).
- `process_payout` ABI method:
  - Validates:
    - policy exists and is `Active`,
    - delay oracle/data layer indicates delay ≥ threshold,
    - within claim window,
    - vault has sufficient USDC.
  - Transfers USDC from vault ASA to traveler (inner transaction).
  - Sets policy `status = PaidOut` and `paid_at = now`, preventing double payouts.

#### 3.2 Liquidity provider – Deposit & withdraw

**Data structures**
- LP storage (box key = LP address or derived key):
  - `total_deposited`
  - `total_withdrawn`
  - `active_deposit`

**Contract behaviour**
- `deposit_liquidity`:
  - Transfers USDC from LP to vault ASA.
  - Initializes or updates the LP box:
    - increments `total_deposited`,
    - increments `active_deposit`.
- `withdraw_liquidity`:
  - Optional admin approval or constraints (e.g., paused state, min liquidity).
  - Ensures requested amount ≤ `active_deposit` and doesn’t underfund active policies.
  - Transfers USDC from vault ASA back to LP.
  - Updates LP box:
    - increments `total_withdrawn`,
    - decrements `active_deposit`.

#### 3.3 OTA / Airline operator – Integration

**Requirements**
- Frontend/API must accept:
  - booking reference, flight number, departure details.
- These values are written into the policy box on `purchase_policy`.
- Indexer queries should support:
  - find policies by traveler address,
  - optionally filter by booking reference and flight number.

#### 3.4 Admin – Governance & safety

**Contract behaviour**
- `initialize`:
  - Sets admin address, USDC ASA id, and initial config flags.
- `create_product` / `update_product`:
  - Writes or updates product boxes with thresholds, coverage, premiums, and claim window.
- `set_pause_status`:
  - Toggles global pause flag (and/or per-product flags).
  - All state-changing instructions (e.g., `purchase_policy`, `deposit_liquidity`) must respect pause status.
- Payout-related admin actions:
  - Admin can trigger `process_payout` only when delay is confirmed by the oracle/data layer.
  - On error conditions (oracle unavailable, disputes), admin can either defer payout or handle via a separate governance path.

---

### 4. Non-functional considerations

- **Read access**: Product and policy data should be readable via indexer without requiring users to pay transaction fees.  
- **Fees and minimum balance**: The app must be designed so that box writes and ASA inner transactions are efficient in fees and respect Algorand minimum-balance rules.  
- **Safety**: Payout and withdrawal logic must always guard against vault underfunding and double payouts, and respect the protocol pause mechanism.  
- **Extensibility**: The design should allow additional products (other delay thresholds or cover types) without structural changes to the contract.  
