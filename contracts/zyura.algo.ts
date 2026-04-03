/*
 * Zyura — flight-delay insurance application (TEALScript → TEAL).
 *
 * State: global keys for admin, pause, USDC ASA id, optional oracle app id, and rekeyed vault.
 * Product params are packed into two boxes per product (≤8 box refs per txn); policy claim timing
 * is snapshotted in pol_tim (delay threshold, scheduled departure, claim deadline).
 * Premium and LP USDC inflows must be proven via grouped axfer args; payouts use inner xfer (vault rekeyed to app).
 */

import { Contract } from '@algorandfoundation/tealscript';

export class Zyura extends Contract {
  public admin = GlobalStateKey<Address>({ key: 'admin' });
  public paused = GlobalStateKey<uint64>({ key: 'paused' });
  public usdcMint = GlobalStateKey<uint64>({ key: 'usdc_mint' });
  public oracleAppId = GlobalStateKey<uint64>({ key: 'oracle_app_id' });
  public riskPoolVault = GlobalStateKey<Address>({ key: 'risk_pool_vault' });
  public outstandingCoverage = GlobalStateKey<uint64>({ key: 'out_cov' });
  public policyNftIssuer = GlobalStateKey<Address>({ key: 'pol_nft_issuer' });

  public productPricing = BoxMap<uint64, bytes<16>>({ prefix: 'p_pri' });
  public productSchedule = BoxMap<uint64, bytes<16>>({ prefix: 'p_sch' });
  public productActive = BoxMap<uint64, uint64>({ prefix: 'p_active' });

  public policyPolicyholder = BoxMap<uint64, Address>({ prefix: 'pol_holder' });
  public policyCoverageAmount = BoxMap<uint64, uint64>({ prefix: 'pol_coverage' });
  public policyStatus = BoxMap<uint64, uint64>({ prefix: 'pol_status' });
  public policyPaidAt = BoxMap<uint64, uint64>({ prefix: 'pol_paid' });
  public policyTimes = BoxMap<uint64, bytes<24>>({ prefix: 'pol_tim' });
  public policyNft = BoxMap<uint64, uint64>({ prefix: 'pol_nft' });

  public lpTotalDeposited = BoxMap<Address, uint64>({ prefix: 'lp_deposited' });
  public lpTotalWithdrawn = BoxMap<Address, uint64>({ prefix: 'lp_withdrawn' });
  public lpActiveDeposit = BoxMap<Address, uint64>({ prefix: 'lp_active' });

  createApplication(): void {}

  initialize(admin: Address, usdcMint: uint64, oracleAppId: uint64, riskPoolVault: Address): void {
    assert(!this.admin.exists, 'Protocol already initialized');
    assert(usdcMint > 0, 'Invalid USDC ASA');

    this.admin.value = admin;
    this.usdcMint.value = usdcMint;
    this.oracleAppId.value = oracleAppId;
    this.riskPoolVault.value = riskPoolVault;
    this.paused.value = 0;
    this.outstandingCoverage.value = 0;
  }

  getAdmin(): Address {
    return this.admin.value;
  }

  isPaused(): boolean {
    return this.paused.value === 1;
  }

  getUsdcMint(): uint64 {
    return this.usdcMint.value;
  }

  getOracleAppId(): uint64 {
    return this.oracleAppId.value;
  }

  getRiskPoolVault(): Address {
    return this.riskPoolVault.value;
  }

  setPolicyNftIssuer(issuer: Address): void {
    assert(this.txn.sender === this.admin.value, 'Unauthorized: admin only');
    this.policyNftIssuer.value = issuer;
  }

  getPolicyNftIssuer(): Address {
    if (!this.policyNftIssuer.exists) {
      return globals.zeroAddress;
    }
    return this.policyNftIssuer.value;
  }

  createProduct(
    productId: uint64,
    delayThresholdMinutes: uint64,
    coverageAmount: uint64,
    premiumRateBps: uint64,
    claimWindowHours: uint64
  ): void {
    assert(this.paused.value === 0, 'Protocol is paused');
    assert(this.txn.sender === this.admin.value, 'Unauthorized: admin only');
    assert(!this.productActive(productId).exists, 'Product already exists');

    assert(delayThresholdMinutes > 0, 'Invalid delay threshold');
    assert(coverageAmount > 0, 'Invalid coverage amount');
    assert(premiumRateBps > 0 && premiumRateBps <= 10000, 'Invalid premium rate bps');
    assert(claimWindowHours > 0, 'Invalid claim window');

    this.productPricing(productId).value = concat(itob(coverageAmount), itob(premiumRateBps)) as bytes<16>;
    this.productSchedule(productId).value = concat(itob(delayThresholdMinutes), itob(claimWindowHours)) as bytes<16>;
    this.productActive(productId).value = 1;
  }

  updateProduct(
    productId: uint64,
    delayThresholdMinutes: uint64,
    coverageAmount: uint64,
    premiumRateBps: uint64,
    claimWindowHours: uint64
  ): void {
    assert(this.paused.value === 0, 'Protocol is paused');
    assert(this.txn.sender === this.admin.value, 'Unauthorized: admin only');
    assert(this.productActive(productId).exists, 'Product does not exist');

    assert(delayThresholdMinutes > 0, 'Invalid delay threshold');
    assert(coverageAmount > 0, 'Invalid coverage amount');
    assert(premiumRateBps > 0 && premiumRateBps <= 10000, 'Invalid premium rate bps');
    assert(claimWindowHours > 0, 'Invalid claim window');

    this.productPricing(productId).value = concat(itob(coverageAmount), itob(premiumRateBps)) as bytes<16>;
    this.productSchedule(productId).value = concat(itob(delayThresholdMinutes), itob(claimWindowHours)) as bytes<16>;
  }

  getProductDelayThreshold(productId: uint64): uint64 {
    return extractUint64(this.productSchedule(productId).value, 0);
  }

  getProductCoverageAmount(productId: uint64): uint64 {
    return extractUint64(this.productPricing(productId).value, 0);
  }

  getProductPremiumRateBps(productId: uint64): uint64 {
    return extractUint64(this.productPricing(productId).value, 8);
  }

  getProductClaimWindowHours(productId: uint64): uint64 {
    return extractUint64(this.productSchedule(productId).value, 8);
  }

  isProductActive(productId: uint64): boolean {
    return this.productActive(productId).exists && this.productActive(productId).value === 1;
  }

  /* createMetadata / metadataUri / nftAssetId are ABI-only for clients */
  purchasePolicy(
    premiumPayment: AssetTransferTxn,
    policyId: uint64,
    productId: uint64,
    flightNumber: string,
    departureTime: uint64,
    premiumAmount: uint64,
    createMetadata: boolean,
    metadataUri: string,
    nftAssetId: uint64
  ): void {
    verifyAssetTransferTxn(premiumPayment, {
      xferAsset: AssetID.fromUint64(this.usdcMint.value),
      assetReceiver: this.riskPoolVault.value,
      assetAmount: { greaterThanEqualTo: premiumAmount },
      sender: this.txn.sender,
      assetCloseTo: globals.zeroAddress,
    });

    assert(this.paused.value === 0, 'Protocol is paused');
    assert(this.productActive(productId).exists, 'Product does not exist');
    assert(this.productActive(productId).value === 1, 'Product is not active');

    const pricing = this.productPricing(productId).value;
    const schedule = this.productSchedule(productId).value;
    const coverageAmount = extractUint64(pricing, 0);
    const premiumRateBps = extractUint64(pricing, 8);
    const delayThresholdProduct = extractUint64(schedule, 0);
    const claimWindowHours = extractUint64(schedule, 8);

    const premiumProduct = coverageAmount * premiumRateBps;
    assert(premiumProduct / premiumRateBps === coverageAmount, 'Premium calculation overflow');
    const requiredPremium = premiumProduct / 10000;
    assert(premiumAmount >= requiredPremium, 'Insufficient premium');

    assert(!this.policyStatus(policyId).exists, 'Policy already exists');

    const windowSeconds = claimWindowHours * 3600;
    assert(windowSeconds / 3600 === claimWindowHours, 'Claim window overflow');
    const claimDeadline = departureTime + windowSeconds;
    assert(claimDeadline >= departureTime, 'Claim deadline overflow');

    const prevOutstanding = this.outstandingCoverage.value;
    const nextOutstanding = prevOutstanding + coverageAmount;
    assert(nextOutstanding >= prevOutstanding, 'Outstanding coverage overflow');
    this.outstandingCoverage.value = nextOutstanding;

    this.policyPolicyholder(policyId).value = this.txn.sender;
    this.policyCoverageAmount(policyId).value = coverageAmount;
    this.policyStatus(policyId).value = 0;
    this.policyTimes(policyId).value = concat(
      concat(itob(delayThresholdProduct), itob(departureTime)),
      itob(claimDeadline)
    ) as bytes<24>;
  }

  /**
   * Record which ASA is the policy NFT for this policy. Call after the policy NFT exists in the policyholder wallet.
   * If pol_nft_issuer is zero: ASA creator must be the policyholder (self-mint).
   * If pol_nft_issuer is set: ASA creator must be that address (house mint); policyholder must hold ≥ 1 unit.
   */
  linkPolicyNft(policyId: uint64, nftAssetId: uint64): void {
    assert(this.paused.value === 0, 'Protocol is paused');
    assert(this.policyPolicyholder(policyId).exists, 'Policy does not exist');
    assert(this.policyPolicyholder(policyId).value === this.txn.sender, 'Unauthorized: policyholder only');
    assert(nftAssetId > 0, 'Invalid NFT asset');
    assert(!this.policyNft(policyId).exists, 'Policy NFT already linked');

    const nft = AssetID.fromUint64(nftAssetId);
    const issuerSetting = this.policyNftIssuer.exists ? this.policyNftIssuer.value : globals.zeroAddress;
    if (issuerSetting === globals.zeroAddress) {
      assert(nft.creator === this.txn.sender, 'NFT must be created by policyholder');
    } else {
      assert(nft.creator === issuerSetting, 'NFT must be issued by protocol');
    }
    assert(this.txn.sender.assetBalance(nft) >= 1, 'Must hold policy NFT');

    this.policyNft(policyId).value = nftAssetId;
  }

  getPolicyNftAssetId(policyId: uint64): uint64 {
    if (!this.policyNft(policyId).exists) {
      return 0;
    }
    return this.policyNft(policyId).value;
  }

  processPayout(policyId: uint64, delayMinutes: uint64): void {
    assert(this.paused.value === 0, 'Protocol is paused');
    assert(this.txn.sender === this.admin.value, 'Unauthorized: admin only');

    assert(this.policyStatus(policyId).exists, 'Policy does not exist');
    assert(this.policyStatus(policyId).value === 0, 'Policy is not active');

    const times = this.policyTimes(policyId).value;
    const delayThreshold = extractUint64(times, 0);
    const departureTime = extractUint64(times, 8);
    const claimDeadline = extractUint64(times, 16);
    assert(delayMinutes >= delayThreshold, 'Delay threshold not met');

    const policyholder = this.policyPolicyholder(policyId).value;
    const coverageAmount = this.policyCoverageAmount(policyId).value;

    const latestTs = globals.latestTimestamp;
    assert(latestTs >= departureTime, 'Before scheduled departure');
    assert(latestTs <= claimDeadline, 'Claim window expired');

    assert(this.outstandingCoverage.value >= coverageAmount, 'Outstanding coverage mismatch');
    const vaultAddr = this.riskPoolVault.value;
    const usdcAsset = AssetID.fromUint64(this.usdcMint.value);
    assert(vaultAddr.assetBalance(usdcAsset) >= coverageAmount, 'Insufficient vault for payout');

    sendAssetTransfer({
      xferAsset: AssetID.fromUint64(this.usdcMint.value),
      assetAmount: coverageAmount,
      assetSender: this.riskPoolVault.value,
      assetReceiver: policyholder,
      fee: 1000,
    });

    this.policyStatus(policyId).value = 1;
    this.policyPaidAt(policyId).value = globals.latestTimestamp;

    const oc = this.outstandingCoverage.value;
    assert(oc >= coverageAmount, 'Outstanding underflow');
    this.outstandingCoverage.value = oc - coverageAmount;
  }

  getPolicyStatus(policyId: uint64): uint64 {
    return this.policyStatus(policyId).value;
  }

  getPolicyPolicyholder(policyId: uint64): Address {
    return this.policyPolicyholder(policyId).value;
  }

  getPolicyCoverageAmount(policyId: uint64): uint64 {
    return this.policyCoverageAmount(policyId).value;
  }

  isPolicyActive(policyId: uint64): boolean {
    return this.policyStatus(policyId).value === 0;
  }

  depositLiquidity(depositPayment: AssetTransferTxn, amount: uint64): void {
    verifyAssetTransferTxn(depositPayment, {
      xferAsset: AssetID.fromUint64(this.usdcMint.value),
      assetReceiver: this.riskPoolVault.value,
      assetAmount: { greaterThanEqualTo: amount },
      sender: this.txn.sender,
      assetCloseTo: globals.zeroAddress,
    });

    assert(this.paused.value === 0, 'Protocol is paused');
    assert(amount > 0, 'Amount must be greater than zero');

    const provider = this.txn.sender;

    if (!this.lpActiveDeposit(provider).exists) {
      this.lpTotalDeposited(provider).value = 0;
      this.lpTotalWithdrawn(provider).value = 0;
      this.lpActiveDeposit(provider).value = 0;
    }

    const prevDeposited = this.lpTotalDeposited(provider).value;
    const prevActive = this.lpActiveDeposit(provider).value;
    const nextDeposited = prevDeposited + amount;
    const nextActive = prevActive + amount;
    assert(nextDeposited >= prevDeposited, 'Deposit total overflow');
    assert(nextActive >= prevActive, 'Active deposit overflow');
    this.lpTotalDeposited(provider).value = nextDeposited;
    this.lpActiveDeposit(provider).value = nextActive;
  }

  withdrawLiquidity(provider: Address, amount: uint64): void {
    assert(this.paused.value === 0, 'Protocol is paused');
    assert(this.txn.sender === this.admin.value, 'Unauthorized: admin only');
    assert(amount > 0, 'Amount must be greater than zero');

    assert(this.lpActiveDeposit(provider).exists, 'Liquidity provider account does not exist');
    assert(this.lpActiveDeposit(provider).value >= amount, 'Insufficient active deposit');

    const vaultAddr = this.riskPoolVault.value;
    const usdcAsset = AssetID.fromUint64(this.usdcMint.value);
    const vaultBal = vaultAddr.assetBalance(usdcAsset);
    const reserve = this.outstandingCoverage.value;
    assert(vaultBal >= amount + reserve, 'Withdraw would breach coverage reserve');

    sendAssetTransfer({
      xferAsset: AssetID.fromUint64(this.usdcMint.value),
      assetAmount: amount,
      assetSender: vaultAddr,
      assetReceiver: provider,
      fee: 1000,
    });

    const prevWithdrawn = this.lpTotalWithdrawn(provider).value;
    const nextWithdrawn = prevWithdrawn + amount;
    assert(nextWithdrawn >= prevWithdrawn, 'Withdrawn total overflow');
    this.lpTotalWithdrawn(provider).value = nextWithdrawn;
    this.lpActiveDeposit(provider).value = this.lpActiveDeposit(provider).value - amount;
  }

  setPauseStatus(paused: uint64): void {
    assert(this.txn.sender === this.admin.value, 'Unauthorized: admin only');
    assert(paused === 0 || paused === 1, 'Invalid pause value');
    this.paused.value = paused;
  }

  getLpTotalDeposited(provider: Address): uint64 {
    return this.lpTotalDeposited(provider).value;
  }

  getLpTotalWithdrawn(provider: Address): uint64 {
    return this.lpTotalWithdrawn(provider).value;
  }

  getLpActiveDeposit(provider: Address): uint64 {
    return this.lpActiveDeposit(provider).value;
  }
}
