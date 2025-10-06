import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contractAddress = searchParams.get("contract");
  const limit = searchParams.get("limit") || "50";
  const offset = searchParams.get("offset") || "0";

  if (!contractAddress) {
    return NextResponse.json(
      { error: "Contract address is required" },
      { status: 400 }
    );
  }

  const cacheKey = `${contractAddress}-${limit}-${offset}`;
  const now = Date.now();

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  // Rate limiting - wait if necessary
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }

  try {
    const url = `https://api.testnet.hiro.so/extended/v1/contract/${contractAddress}/events?limit=${limit}&offset=${offset}`;

    lastRequestTime = Date.now();

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 30 }, // Next.js cache for 30 seconds
    });

    if (!response.ok) {
      // If rate limited, return cached data if available (even if stale)
      if (response.status === 429 && cached) {
        return NextResponse.json(cached.data);
      }
      throw new Error(`Hiro API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Update cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    // Clean old cache entries
    if (cache.size > 100) {
      const oldestKey = Array.from(cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      cache.delete(oldestKey);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching contract events:", error);

    // Return stale cache if available
    if (cached) {
      return NextResponse.json(cached.data);
    }

    return NextResponse.json(
      { error: "Failed to fetch contract events" },
      { status: 500 }
    );
  }
}
