"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Check, AlertCircle } from "lucide-react";
import { MOCK_TOKEN_1, MOCK_TOKEN_2, getTokenName, formatTokenAmount } from "@/lib/amm";
import { useStacks } from "@/hooks/use-stacks";

interface MintTokensModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMintComplete?: () => void;
}

export function MintTokensModal({ open, onOpenChange, onMintComplete }: MintTokensModalProps) {
  const { handleMintTokens, checkTokenBalances, isLoading, userData } = useStacks();
  const [balances, setBalances] = useState({ token1: 0, token2: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const MINT_AMOUNT = 1000000000; // 1000 tokens with 6 decimals

  useEffect(() => {
    if (open && userData) {
      refreshBalances();
    }
  }, [open, userData]);

  async function refreshBalances() {
    setRefreshing(true);
    const newBalances = await checkTokenBalances();
    setBalances(newBalances);
    setRefreshing(false);
  }

  async function handleMint(tokenAddress: string) {
    await handleMintTokens(tokenAddress, MINT_AMOUNT);
    // Refresh balances after a short delay to allow blockchain to update
    setTimeout(() => {
      refreshBalances();
    }, 2000);
  }

  const hasToken1 = balances.token1 > 0;
  const hasToken2 = balances.token2 > 0;
  const hasAllTokens = hasToken1 && hasToken2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-slate-800 bg-slate-950">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-500" />
            Get Test Tokens
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Mint test tokens to your wallet to create pools and trade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Token 1 */}
          <Card className="border border-slate-800 bg-slate-900/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{getTokenName(MOCK_TOKEN_1)}</h3>
                  {hasToken1 && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Balance: {formatTokenAmount(balances.token1)}
                </p>
              </div>
              <Button
                onClick={() => handleMint(MOCK_TOKEN_1)}
                disabled={isLoading || refreshing}
                className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              >
                {isLoading ? "Minting..." : "Mint 1,000"}
              </Button>
            </CardContent>
          </Card>

          {/* Token 2 */}
          <Card className="border border-slate-800 bg-slate-900/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{getTokenName(MOCK_TOKEN_2)}</h3>
                  {hasToken2 && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Balance: {formatTokenAmount(balances.token2)}
                </p>
              </div>
              <Button
                onClick={() => handleMint(MOCK_TOKEN_2)}
                disabled={isLoading || refreshing}
                className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              >
                {isLoading ? "Minting..." : "Mint 1,000"}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border border-teal-500/20 bg-teal-500/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-300">
                  {hasAllTokens ? (
                    <>
                      <p className="font-medium text-emerald-400 mb-1">You're all set!</p>
                      <p className="text-slate-400">
                        You have both tokens. You can now create pools and start trading.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-teal-400 mb-1">About test tokens</p>
                      <p className="text-slate-400">
                        These are test tokens on Stacks testnet. Mint them for free to test the AMM functionality.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={() => refreshBalances()}
            disabled={refreshing}
            className="flex-1 border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {refreshing ? "Refreshing..." : "Refresh Balances"}
          </Button>
          {hasAllTokens && (
            <Button
              onClick={() => {
                onMintComplete?.();
                onOpenChange(false);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
