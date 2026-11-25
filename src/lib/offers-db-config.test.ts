import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dbClientConfig } from "./offers-db-config";

type SslOptions = { rejectUnauthorized: boolean; servername?: string };

function ssl(connectionString: string): SslOptions {
  return dbClientConfig(connectionString).ssl as SslOptions;
}

const URL_BASE = "postgresql://market:pa%24%24@db.example.com:5432/tiger_market";

describe("offers database TLS", () => {
  it("verifies the server certificate by default", () => {
    const options = ssl(URL_BASE);
    expect(options.rejectUnauthorized).toBe(true);
    expect(options.servername).toBe("db.example.com");
  });

  it("still verifies when the URL asks for encryption only", () => {
    expect(ssl(`${URL_BASE}?sslmode=require`).rejectUnauthorized).toBe(true);
  });

  it("verifies for the strict libpq modes", () => {
    expect(ssl(`${URL_BASE}?sslmode=verify-ca`).rejectUnauthorized).toBe(true);
    expect(ssl(`${URL_BASE}?sslmode=verify-full`).rejectUnauthorized).toBe(true);
  });

  it("only skips verification when the URL explicitly opts out", () => {
    expect(ssl(`${URL_BASE}?sslmode=no-verify`).rejectUnauthorized).toBe(false);
    expect(ssl(`${URL_BASE}?sslmode=disable`).rejectUnauthorized).toBe(false);
  });

  it("does not read sslmode out of unrelated values", () => {
    expect(ssl(`${URL_BASE}?sslmode=require&channel_binding=require`).rejectUnauthorized).toBe(true);
    expect(ssl(`${URL_BASE}?sslmode=no-verify`).rejectUnauthorized).toBe(false);
  });
});

describe("offers database client config", () => {
  it("parses the connection string without leaking query params to the driver", () => {
    const config = dbClientConfig(`${URL_BASE}?channel_binding=require`);
    expect(config.host).toBe("db.example.com");
    expect(config.port).toBe(5432);
    expect(config.user).toBe("market");
    expect(config.password).toBe("pa$$");
    expect(config.database).toBe("tiger_market");
  });

  it("keeps an explicit port", () => {
    expect(dbClientConfig("postgresql://u:p@db.example.com:6543/tiger_market").port).toBe(6543);
  });

  it("leaves no unverified path in the query helper", () => {
    const source = readFileSync(new URL("./offers.server.ts", import.meta.url), "utf8");
    expect(source).toContain("new Client(dbClientConfig(connectionString))");
    expect(source).not.toContain("rejectUnauthorized: false");
  });
});
