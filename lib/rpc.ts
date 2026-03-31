const DEV_FALLBACK_RPC_URL = 'http://localhost:8899';

function requireValidHttpUrl(url: string, context: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Invalid protocol for ${context}: ${parsed.protocol}`);
    }
    return parsed.toString();
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_RPC_URL in ${context}: ${url}`);
  }
}

export function getClientRpcUrl(context: string): string {
  const envRpc = process.env.NEXT_PUBLIC_RPC_URL;
  if (envRpc) {
    return requireValidHttpUrl(envRpc, context);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`NEXT_PUBLIC_RPC_URL is required in production (${context})`);
  }

  return DEV_FALLBACK_RPC_URL;
}

export function getServerRpcUrl(context: string): string {
  const envRpc = process.env.NEXT_PUBLIC_RPC_URL;
  if (!envRpc) {
    throw new Error(`NEXT_PUBLIC_RPC_URL is required on server (${context})`);
  }

  return requireValidHttpUrl(envRpc, context);
}
