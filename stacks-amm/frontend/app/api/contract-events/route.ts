import { NextRequest, NextResponse } from "next/server";

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

  try {
    const url = `https://api.testnet.hiro.so/extended/v1/contract/${contractAddress}/events?limit=${limit}&offset=${offset}`;
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Hiro API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching contract events:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract events" },
      { status: 500 }
    );
  }
}
