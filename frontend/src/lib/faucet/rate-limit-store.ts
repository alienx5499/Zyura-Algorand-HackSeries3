import { Redis } from "@upstash/redis";

function mustEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getRedis() {
  return new Redis({
    url: mustEnv("UPSTASH_REDIS_REST_URL"),
    token: mustEnv("UPSTASH_REDIS_REST_TOKEN"),
  });
}

function dayKeyPrefix(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function ipKey(ip: string, date?: Date) {
  return `faucet:ip:${ip}:${dayKeyPrefix(date)}`;
}

function globalKey(date?: Date) {
  return `faucet:global:${dayKeyPrefix(date)}`;
}

function lockKey(address: string) {
  return `faucet:wallet:${address}:lock`;
}

function cooldownKey(address: string) {
  return `faucet:wallet:${address}:last_request`;
}

function idempotencyKey(address: string, requestHash: string) {
  return `faucet:req:${address}:${requestHash}`;
}

function secondsUntilUtcMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(1, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

export async function getDailyIpTotal(ip: string) {
  const value = await getRedis().get<number>(ipKey(ip));
  return Number(value ?? 0);
}

export async function incrementDailyIp(ip: string, amountUsdc: number) {
  const redis = getRedis();
  const key = ipKey(ip);
  const next = await redis.incrby(key, amountUsdc);
  await redis.expire(key, secondsUntilUtcMidnight());
  return Number(next);
}

export async function getDailyGlobalTotal() {
  const value = await getRedis().get<number>(globalKey());
  return Number(value ?? 0);
}

export async function incrementDailyGlobal(amountUsdc: number) {
  const redis = getRedis();
  const key = globalKey();
  const next = await redis.incrby(key, amountUsdc);
  await redis.expire(key, secondsUntilUtcMidnight());
  return Number(next);
}

export async function acquireWalletLock(
  address: string,
  token: string,
  ttlSec: number,
) {
  const result = await getRedis().set(lockKey(address), token, {
    nx: true,
    ex: ttlSec,
  });
  return result === "OK";
}

export async function releaseWalletLock(address: string, token: string) {
  const redis = getRedis();
  // Atomic compare-and-delete to avoid removing a newer lock.
  const lua = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    end
    return 0
  `;
  const result = await (redis as any).eval(lua, [lockKey(address)], [token]);
  return Number(result ?? 0) > 0;
}

export async function getCooldownRemainingSec(address: string) {
  const ttl = await getRedis().ttl(cooldownKey(address));
  return Number(ttl ?? -1) > 0 ? Number(ttl) : 0;
}

export async function setCooldown(address: string, cooldownSec: number) {
  await getRedis().set(cooldownKey(address), Date.now(), { ex: cooldownSec });
}

export async function reserveIdempotency(
  address: string,
  requestHash: string,
  ttlSec: number,
) {
  const result = await getRedis().set(idempotencyKey(address, requestHash), 1, {
    nx: true,
    ex: ttlSec,
  });
  return result === "OK";
}

export async function clearIdempotency(address: string, requestHash: string) {
  await getRedis().del(idempotencyKey(address, requestHash));
}
