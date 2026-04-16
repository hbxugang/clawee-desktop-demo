const gatewayBaseUrl =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL || "http://127.0.0.1:43121";

export async function getDemoSnapshot() {
  const response = await fetch(`${gatewayBaseUrl}/api/demo-snapshot`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`gateway request failed: ${response.status}`);
  }

  return (await response.json()) as { time: string; random: number };
}
