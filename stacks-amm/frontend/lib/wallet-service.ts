import {
  connect,
  isConnected,
  disconnect,
  request,
  getLocalStorage,
} from "@stacks/connect";
import { STACKS_TESTNET, STACKS_MAINNET, StacksNetwork } from "@stacks/network";

// Extend window interface for wallet providers
declare global {
  interface Window {
    StacksProvider?: any;
    LeatherProvider?: any;
    XverseProviders?: any;
  }
}

export interface WalletConnectionResult {
  address: string;
  publicKey: string;
  profile?: any;
  isConnected: boolean;
  walletType: string;
  network: "mainnet" | "testnet";
}

export interface WalletSignatureResult {
  signature: string;
  publicKey: string;
  address: string;
  message: string;
}

/**
 * WalletService - Frontend wallet connection and management
 *
 * This service handles:
 * 1. Wallet connection (Stacks wallets like Leather, Xverse)
 * 2. Message signing for authentication
 * 3. Network management
 * 4. Wallet state tracking
 */
class WalletService {
  private network: StacksNetwork;
  private appConfig = {
    name: "Stacks DeFi AMM",
    icon:
      typeof window !== "undefined"
        ? window.location.origin + "/favicon.ico"
        : "",
  };

  // Track explicit wallet connection state
  private explicitlyConnected: boolean = false;

  constructor() {
    const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
    this.network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;

    // Check if there's a stored explicit connection
    if (typeof window !== "undefined") {
      this.explicitlyConnected =
        localStorage.getItem("stacks_amm_wallet_connected") === "true";
    }
  }

  /**
   * Mark wallet as explicitly connected
   */
  private markAsExplicitlyConnected(): void {
    this.explicitlyConnected = true;
    if (typeof window !== "undefined") {
      localStorage.setItem("stacks_amm_wallet_connected", "true");
    }
  }

  /**
   * Clear explicit connection state
   */
  private clearExplicitConnection(): void {
    this.explicitlyConnected = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem("stacks_amm_wallet_connected");
    }
  }

  /**
   * Check if wallet is explicitly connected through our app
   */
  isExplicitlyConnected(): boolean {
    return this.explicitlyConnected;
  }

  /**
   * Generate a challenge message for wallet authentication
   */
  private generateChallenge(address: string): string {
    const timestamp = Date.now();
    const randomNonce = Math.random().toString(36).substring(2, 15);
    return `Stacks AMM Authentication\n\nAddress: ${address}\nTimestamp: ${timestamp}\nNonce: ${randomNonce}\n\nSign this message to authenticate with Stacks AMM.`;
  }

  /**
   * Connect to a Stacks wallet with proper authentication flow
   * This method explicitly connects the wallet, requests signature confirmation, and marks it as connected
   */
  async connectWallet(appDetails?: {
    name: string;
    icon: string;
  }): Promise<WalletConnectionResult> {
    try {
      console.log("Starting wallet connection...");

      // Step 1: Connect to wallet extension
      const response = await connect();
      console.log("Wallet connection response:", response);

      const userData = getLocalStorage();
      console.log("User Data:", userData);

      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address,
        };
      };

      const { stx, btc } = getWalletAddresses(userData);
      console.log("Extracted addresses:", { stx, btc });

      if (!stx) {
        throw new Error("Failed to retrieve wallet address");
      }

      const publicKey = (userData as any)?.profile?.publicKey || (userData as any)?.publicKey || "";

      // Step 2: Generate authentication challenge
      const challenge = this.generateChallenge(stx);
      console.log("Generated authentication challenge:", challenge);

      // Step 3: Request wallet signature (this triggers the wallet confirmation popup!)
      console.log("Requesting wallet signature for authentication...");
      const signatureResult = await request("stx_signMessage", {
        message: challenge,
        publicKey: publicKey,
      });

      console.log("✅ Wallet signature confirmed by user");
      console.log("Signature received:", signatureResult.signature);

      // Step 4: Mark as explicitly connected ONLY after successful signature
      this.markAsExplicitlyConnected();

      return {
        address: stx,
        publicKey: signatureResult.publicKey || publicKey,
        profile: (userData as any)?.profile || userData,
        isConnected: true,
        walletType: this.detectWalletType(),
        network: this.network === STACKS_MAINNET ? "mainnet" : "testnet",
      };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      // If user cancels signature, don't mark as connected
      this.clearExplicitConnection();
      throw new Error(
        error instanceof Error && error.message.includes("User rejected")
          ? "Wallet connection cancelled by user"
          : "Failed to connect wallet"
      );
    }
  }

  /**
   * Get current wallet address if explicitly connected
   */
  async getCurrentAddress(): Promise<string | null> {
    try {
      // First check if wallet was explicitly connected through our app
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected");
        return null;
      }

      if (!isConnected()) {
        // Clear our explicit connection flag if Stacks connect says not connected
        this.clearExplicitConnection();
        return null;
      }

      const userData = getLocalStorage();

      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
        };
      };

      const { stx } = getWalletAddresses(userData);
      return stx || null;
    } catch (error) {
      console.error("Error getting wallet address:", error);
      return null;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      await disconnect();
      this.clearExplicitConnection();
      console.log("✅ Wallet disconnected");
    } catch (error) {
      console.error("❌ Wallet disconnection failed:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to disconnect wallet"
      );
    }
  }

  /**
   * Check if wallet is connected
   */
  async isWalletConnected(): Promise<boolean> {
    try {
      return this.explicitlyConnected && (await isConnected());
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      return false;
    }
  }

  /**
   * Get current wallet data if explicitly connected through our app
   */
  async getCurrentWalletData(): Promise<WalletConnectionResult | null> {
    try {
      // First check if wallet was explicitly connected through our app
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected");
        return null;
      }

      const connected = await isConnected();
      if (!connected) {
        console.log("Stacks wallet not connected");
        // Clear our explicit connection flag if Stacks connect says not connected
        this.clearExplicitConnection();
        return null;
      }

      const walletData = getLocalStorage();
      if (!walletData) {
        console.log("No wallet data available");
        return null;
      }

      console.log("Wallet data retrieved:", walletData);

      // Helper to safely access wallet response
      const getWalletAddresses = (response: any) => {
        return {
          stx: response?.addresses?.stx?.[0]?.address,
          btc: response?.addresses?.btc?.[0]?.address,
        };
      };

      const { stx, btc } = getWalletAddresses(walletData);

      if (!stx) {
        console.log("No Stacks address found in wallet data");
        return null;
      }

      return {
        address: stx,
        publicKey:
          (walletData as any)?.profile?.publicKey ||
          (walletData as any)?.publicKey ||
          "",
        profile: (walletData as any)?.profile || walletData,
        isConnected: true,
        walletType: this.detectWalletType(),
        network: this.network === STACKS_MAINNET ? "mainnet" : "testnet",
      };
    } catch (error) {
      console.error("❌ Failed to get current wallet data:", error);
      return null;
    }
  }

  /**
   * Detect wallet type based on available providers
   */
  private detectWalletType(): string {
    if (typeof window === "undefined") return "unknown";

    if (window.LeatherProvider) return "leather";
    if (window.XverseProviders) return "xverse";
    if (window.StacksProvider) return "stacks";

    return "unknown";
  }

  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message: string): Promise<WalletSignatureResult> {
    try {
      const walletData = await this.getCurrentWalletData();
      if (!walletData) {
        throw new Error("No wallet connected");
      }

      console.log("✍️ Signing message with wallet...");
      console.log("📝 Message to sign:", message);

      // Use the modern request API for message signing
      const result = await request("stx_signMessage", {
        message,
        publicKey: walletData.publicKey,
      });

      console.log("✅ Message signed successfully");

      return {
        signature: result.signature,
        publicKey: result.publicKey,
        address: walletData.address,
        message: message,
      };
    } catch (error) {
      console.error("❌ Message signing failed:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to sign message"
      );
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      network: this.network,
      isMainnet: this.network === STACKS_MAINNET,
      stacksApiUrl:
        this.network === STACKS_MAINNET
          ? "https://api.mainnet.hiro.so"
          : "https://api.testnet.hiro.so",
    };
  }

  /**
   * Get STX balance for connected wallet
   */
  async getStxBalance(): Promise<bigint> {
    try {
      if (!this.explicitlyConnected) {
        console.log("Wallet not explicitly connected");
        return BigInt(0);
      }

      const address = await this.getCurrentAddress();
      if (!address) {
        throw new Error("No wallet connected");
      }

      const apiUrl =
        this.network === STACKS_MAINNET
          ? "https://api.hiro.so"
          : "https://api.testnet.hiro.so";

      const response = await fetch(
        `${apiUrl}/extended/v2/addresses/${address}/balances/stx?include_mempool=false`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      const data = await response.json();
      console.log("STX Balance Response:", data);

      // Return balance in microSTX
      return BigInt(data.balance || "0");
    } catch (error) {
      console.error("Error getting STX balance:", error);
      throw new Error("Failed to get STX balance");
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;
