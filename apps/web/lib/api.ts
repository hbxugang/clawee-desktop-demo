const gatewayBaseUrl =
  process.env.NEXT_PUBLIC_GATEWAY_BASE_URL || "http://127.0.0.1:43121";

export async function getDemoSnapshot() {
  let response: Response;

  try {
    response = await fetch(`${gatewayBaseUrl}/api/demo-snapshot`, {
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("gateway request failed: network_error", { cause: error });
    }

    throw error;
  }

  if (!response.ok) {
    throw new Error(`gateway request failed: ${response.status}`);
  }

  return (await response.json()) as { time: string; random: number };
}
