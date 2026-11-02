// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { constructEvent } = vi.hoisted(() => ({ constructEvent: vi.fn() }));

vi.mock("stripe", () => {
  return {
    default: class Stripe {
      webhooks = { constructEvent };
    },
  };
});

import webhook from "./stripe-webhook";
import checkout from "./create-checkout-session";

const ENV_KEYS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

function blankEnv(): void {
  for (const key of ENV_KEYS) delete process.env[key];
}

function fillTestEnv(secret = "sk_test_123"): void {
  process.env.STRIPE_SECRET_KEY = secret;
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  process.env.STRIPE_PRICE_ID = "price_test";
  process.env.SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
}

function response() {
  return {
    statusCode: 0,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

afterEach(() => {
  blankEnv();
  constructEvent.mockReset();
});

describe("stripe webhook handler", () => {
  it("returns 500 when billing is not configured", async () => {
    const res = response();
    await webhook({ method: "POST", headers: {} } as never, res as never);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Billing isn't configured" });
  });

  it("refuses a live secret", async () => {
    fillTestEnv("sk_live_nope");
    const res = response();
    await webhook({ method: "POST", headers: { "stripe-signature": "t" } } as never, res as never);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Billing isn't configured" });
  });

  it("returns 400 when the signature does not verify", async () => {
    fillTestEnv();
    constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    const res = response();
    await webhook({ method: "POST", headers: { "stripe-signature": "bad" }, body: Buffer.from("{}") } as never, res as never);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Invalid signature" });
  });
});

describe("create checkout handler", () => {
  it("returns 500 when billing is not configured", async () => {
    const res = response();
    await checkout({ method: "POST", headers: {} } as never, res as never);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Billing isn't configured" });
  });
});
