"use client";

import {
  addLiquidity,
  createPool,
  Pool,
  removeLiquidity,
  swap,
} from "@/lib/amm";
import { walletService } from "@/lib/wallet-service";
import { PostConditionMode } from "@stacks/transactions";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const appDetails = {
  name: "Stacks DeFi AMM",
  icon: "https://cryptologos.cc/logos/stacks-stx-logo.png",
};

export function useStacks() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize wallet service on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !initialized) {
      setInitialized(true);

      // Check if wallet was previously connected
      walletService.getCurrentWalletData().then((walletData) => {
        if (walletData) {
          setUserData({
            profile: {
              stxAddress: {
                testnet: walletData.address,
                mainnet: walletData.address,
              },
            },
            publicKey: walletData.publicKey,
          });
        }
      });
    }
  }, [initialized]);

  async function connectWallet() {
    if (typeof window === "undefined") {
      toast.error("Please wait for page to load");
      return;
    }

    try {
      setIsLoading(true);
      const walletData = await walletService.connectWallet(appDetails);

      setUserData({
        profile: {
          stxAddress: {
            testnet: walletData.address,
            mainnet: walletData.address,
          },
        },
        publicKey: walletData.publicKey,
      });

      toast.success("Wallet connected successfully!", {
        description: `Connected to ${walletData.walletType}`,
      });
    } catch (error) {
      console.error("Connect wallet error:", error);
      toast.error("Failed to connect wallet", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function disconnectWallet() {
    try {
      await walletService.disconnectWallet();
      setUserData(null);
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Disconnect wallet error:", error);
      toast.error("Failed to disconnect wallet");
    }
  }

  async function handleCreatePool(token0: string, token1: string, fee: number) {
    if (!userData) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const { openContractCall } = await import("@stacks/connect");
      const options = await createPool(token0, token1, fee);
      await openContractCall({
        ...options,
        appDetails,
        onFinish: (data: any) => {
          toast.success("Pool creation transaction submitted!", {
            description: `Transaction ID: ${data.txId.substring(0, 10)}...`,
          });
          console.log(data);
        },
        onCancel: () => {
          toast.info("Pool creation cancelled");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast.error("Failed to create pool", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSwap(pool: Pool, amount: number, zeroForOne: boolean) {
    if (!userData) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const { openContractCall } = await import("@stacks/connect");
      const options = await swap(pool, amount, zeroForOne);
      await openContractCall({
        ...options,
        appDetails,
        onFinish: (data: any) => {
          toast.success("Swap transaction submitted!", {
            description: `Transaction ID: ${data.txId.substring(0, 10)}...`,
          });
          console.log(data);
        },
        onCancel: () => {
          toast.info("Swap cancelled");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast.error("Swap failed", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddLiquidity(
    pool: Pool,
    amount0: number,
    amount1: number
  ) {
    if (!userData) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (amount0 <= 0 || amount1 <= 0) {
      toast.error("Please enter valid amounts for both tokens");
      return;
    }

    setIsLoading(true);
    try {
      const { openContractCall } = await import("@stacks/connect");
      const options = await addLiquidity(pool, amount0, amount1);
      await openContractCall({
        ...options,
        appDetails,
        onFinish: (data: any) => {
          toast.success("Liquidity added successfully!", {
            description: `Transaction ID: ${data.txId.substring(0, 10)}...`,
          });
          console.log({ data });
        },
        onCancel: () => {
          toast.info("Add liquidity cancelled");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast.error("Failed to add liquidity", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveLiquidity(pool: Pool, liquidity: number) {
    if (!userData) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (liquidity <= 0) {
      toast.error("Please enter a valid liquidity amount");
      return;
    }

    setIsLoading(true);
    try {
      const { openContractCall } = await import("@stacks/connect");
      const options = await removeLiquidity(pool, liquidity);
      await openContractCall({
        ...options,
        appDetails,
        onFinish: (data: any) => {
          toast.success("Liquidity removed successfully!", {
            description: `Transaction ID: ${data.txId.substring(0, 10)}...`,
          });
          console.log(data);
        },
        onCancel: () => {
          toast.info("Remove liquidity cancelled");
        },
        postConditionMode: PostConditionMode.Allow,
      });
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast.error("Failed to remove liquidity", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return {
    userData,
    isLoading,
    handleCreatePool,
    handleSwap,
    handleAddLiquidity,
    handleRemoveLiquidity,
    connectWallet,
    disconnectWallet,
  };
}
