import { STACKS_TESTNET } from "@stacks/network";
import { fetchCallReadOnlyFunction } from "@stacks/transactions";

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
  isValid: boolean;
}

/**
 * Fetches token information from a SIP-010 token contract
 */
export async function getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
  try {
    const [contractAddress, contractName] = tokenAddress.split(".");

    if (!contractAddress || !contractName) {
      return {
        name: "",
        symbol: "",
        decimals: 0,
        contractAddress: tokenAddress,
        isValid: false,
      };
    }

    // Fetch token name
    const nameResult = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-name",
      functionArgs: [],
      senderAddress: contractAddress,
      network: STACKS_TESTNET,
    });

    // Fetch token symbol
    const symbolResult = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-symbol",
      functionArgs: [],
      senderAddress: contractAddress,
      network: STACKS_TESTNET,
    });

    // Fetch token decimals
    const decimalsResult = await fetchCallReadOnlyFunction({
      contractAddress,
      contractName,
      functionName: "get-decimals",
      functionArgs: [],
      senderAddress: contractAddress,
      network: STACKS_TESTNET,
    });

    let name = "";
    let symbol = "";
    let decimals = 6; // default

    if (nameResult.type === "ok" && nameResult.value.type === "string-ascii") {
      name = nameResult.value.data;
    }

    if (symbolResult.type === "ok" && symbolResult.value.type === "string-ascii") {
      symbol = symbolResult.value.data;
    }

    if (decimalsResult.type === "ok" && decimalsResult.value.type === "uint") {
      decimals = parseInt(decimalsResult.value.value.toString());
    }

    return {
      name,
      symbol,
      decimals,
      contractAddress: tokenAddress,
      isValid: !!(name && symbol),
    };
  } catch (error) {
    console.error("Error fetching token info:", error);
    return {
      name: "",
      symbol: "",
      decimals: 0,
      contractAddress: tokenAddress,
      isValid: false,
    };
  }
}

/**
 * Validates if a token address is a valid SIP-010 token
 */
export async function isValidToken(tokenAddress: string): Promise<boolean> {
  const tokenInfo = await getTokenInfo(tokenAddress);
  return tokenInfo.isValid;
}

/**
 * Common testnet tokens (can be expanded)
 */
export const COMMON_TOKENS = [
  {
    address: "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.mock-token",
    name: "Mock Token",
    symbol: "MT",
  },
  {
    address: "ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.mock-token-2",
    name: "Mock Token 2",
    symbol: "MT2",
  },
];
