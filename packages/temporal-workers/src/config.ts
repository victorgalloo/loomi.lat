import { NativeConnection } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import * as fs from 'fs';

export const TASK_QUEUE = 'loomi-main';

export interface TemporalConfig {
  address: string;
  namespace: string;
  apiKey?: string;
  clientCert?: Buffer;
  clientKey?: Buffer;
}

function getConfig(): TemporalConfig {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
  const apiKey = process.env.TEMPORAL_API_KEY;

  // For Temporal Cloud with mTLS certificates
  const certPath = process.env.TEMPORAL_CLIENT_CERT_PATH;
  const keyPath = process.env.TEMPORAL_CLIENT_KEY_PATH;
  const certBase64 = process.env.TEMPORAL_CLIENT_CERT;
  const keyBase64 = process.env.TEMPORAL_CLIENT_KEY;

  let clientCert: Buffer | undefined;
  let clientKey: Buffer | undefined;

  // Try file paths first, then base64 encoded values
  if (certPath && keyPath) {
    clientCert = fs.readFileSync(certPath);
    clientKey = fs.readFileSync(keyPath);
  } else if (certBase64 && keyBase64) {
    clientCert = Buffer.from(certBase64, 'base64');
    clientKey = Buffer.from(keyBase64, 'base64');
  }

  return { address, namespace, apiKey, clientCert, clientKey };
}

export async function createWorkerConnection(): Promise<NativeConnection> {
  const config = getConfig();

  // Temporal Cloud with API Key
  if (config.apiKey) {
    return await NativeConnection.connect({
      address: config.address,
      tls: {},
      apiKey: config.apiKey,
    });
  }

  // Temporal Cloud with mTLS certificates
  if (config.clientCert && config.clientKey) {
    return await NativeConnection.connect({
      address: config.address,
      tls: {
        clientCertPair: {
          crt: config.clientCert,
          key: config.clientKey,
        },
      },
    });
  }

  // Local development connection
  return await NativeConnection.connect({
    address: config.address,
  });
}

export async function createClientConnection(): Promise<Connection> {
  const config = getConfig();

  // Temporal Cloud with API Key
  if (config.apiKey) {
    return await Connection.connect({
      address: config.address,
      tls: {},
      apiKey: config.apiKey,
    });
  }

  // Temporal Cloud with mTLS certificates
  if (config.clientCert && config.clientKey) {
    return await Connection.connect({
      address: config.address,
      tls: {
        clientCertPair: {
          crt: config.clientCert,
          key: config.clientKey,
        },
      },
    });
  }

  // Local development connection
  return await Connection.connect({
    address: config.address,
  });
}

export function getNamespace(): string {
  return process.env.TEMPORAL_NAMESPACE || 'default';
}

// Environment validation
export function validateEnv(): void {
  const required = [
    'SUPABASE_URL',
    'WHATSAPP_ACCESS_TOKEN',
  ];

  // Support both naming conventions
  const hasSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const hasWhatsAppPhone = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;

  const missing = required.filter((key) => !process.env[key]);
  if (!hasSupabaseKey) missing.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  if (!hasWhatsAppPhone) missing.push('WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_PHONE_ID');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Normalize env vars for activities
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;
  }
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_PHONE_ID) {
    process.env.WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
  }
}
