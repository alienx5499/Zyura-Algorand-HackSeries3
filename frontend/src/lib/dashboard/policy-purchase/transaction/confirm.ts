export async function waitForPurchaseConfirmation(
  firstGroupTxId: string,
  maxAttempts = 25,
): Promise<void> {
  let confirmed = false;
  let attempts = 0;
  while (!confirmed && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const txInfoRes = await fetch(`/api/algorand/tx/${firstGroupTxId}`);
    if (txInfoRes.ok) {
      const txInfo = await txInfoRes.json();
      if (txInfo.confirmedRound) confirmed = true;
    }
    attempts++;
  }
  if (!confirmed) throw new Error("Transaction confirmation timeout");
}
