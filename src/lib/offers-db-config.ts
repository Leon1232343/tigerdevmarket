import type { ClientConfig } from "pg";

/**
 * Connection options for the external Tiger Market offers database.
 *
 * Parsed by hand because extra query params (e.g. channel_binding) break the
 * driver, and the TLS handshake needs an explicit SNI servername.
 *
 * TLS is always on, and the server certificate is verified unless the
 * connection string explicitly opts out with `sslmode=no-verify` (or the libpq
 * spelling `disable`). Without verification the connection stays encrypted but
 * anyone who can redirect it can present their own certificate and read the
 * credentials, so that opt-out is only for a host whose certificate Node cannot
 * chain to a trusted CA.
 */
export function dbClientConfig(connectionString: string): ClientConfig {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const rejectUnauthorized = sslMode !== "no-verify" && sslMode !== "disable";

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized, servername: url.hostname },
    connectionTimeoutMillis: 15_000,
    query_timeout: 20_000,
  };
}
