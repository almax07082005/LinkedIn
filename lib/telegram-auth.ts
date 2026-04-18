import { createHmac } from "crypto";

export function validateInitData(initData: string): { valid: boolean; userId?: number } {
  if (!initData) return { valid: false };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false };

  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  // Secret key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = createHmac("sha256", "WebAppData")
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();

  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (expectedHash !== hash) return { valid: false };

  // Reject initData older than 24 hours
  const authDate = Number(params.get("auth_date") ?? 0);
  if (Date.now() / 1000 - authDate > 86400) return { valid: false };

  const user = JSON.parse(params.get("user") ?? "{}");
  return { valid: true, userId: user.id };
}

export function isAllowedUser(userId: number): boolean {
  const raw = process.env.ALLOWED_USERS ?? "";
  if (!raw.trim()) return false;
  const allowed = raw.split(",").map((id) => id.trim());
  return allowed.includes(String(userId));
}
