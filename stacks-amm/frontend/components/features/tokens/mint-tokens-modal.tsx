"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Check, AlertCircle } from "lucide-react";
import { MOCK_TOKEN_1, MOCK_TOKEN_2, MOCK_TOKEN_3, MOCK_TOKEN_4, getTokenName, formatTokenAmount } from "@/lib/amm";
import { useStacks } from "@/hooks/use-stacks";

interface MintTokensModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMintComplete?: () => void;
}

export function MintTokensModal({ open, onOpenChange, onMintComplete }: MintTokensModalProps) {
  const { handleMintTokens, checkTokenBalances, isLoading, userData } = useStacks();
  const [balances, setBalances] = useState({ token1: 0, token2: 0, token3: 0, token4: 0 });
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
  const hasToken3 = balances.token3 > 0;
  const hasToken4 = balances.token4 > 0;
  const hasAllTokens = hasToken1 && hasToken2 && hasToken3 && hasToken4;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-500" />
            Get Test Tokens
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Mint test tokens to create pools and trade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2 overflow-y-auto flex-1">
          {/* Token 1 */}
          <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-white text-sm truncate">{getTokenName(MOCK_TOKEN_1)}</h3>
                {hasToken1 && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-400">
                {formatTokenAmount(balances.token1)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleMint(MOCK_TOKEN_1)}
              disabled={isLoading || refreshing}
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 text-xs h-7 px-3 flex-shrink-0"
            >
              {isLoading ? "Minting..." : "Mint"}
            </Button>
          </div>

          {/* Token 2 */}
          <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-white text-sm truncate">{getTokenName(MOCK_TOKEN_2)}</h3>
                {hasToken2 && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-400">
                {formatTokenAmount(balances.token2)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleMint(MOCK_TOKEN_2)}
              disabled={isLoading || refreshing}
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 text-xs h-7 px-3 flex-shrink-0"
            >
              {isLoading ? "Minting..." : "Mint"}
            </Button>
          </div>

          {/* Token 3 */}
          <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-white text-sm truncate">{getTokenName(MOCK_TOKEN_3)}</h3>
                {hasToken3 && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-400">
                {formatTokenAmount(balances.token3)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleMint(MOCK_TOKEN_3)}
              disabled={isLoading || refreshing}
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 text-xs h-7 px-3 flex-shrink-0"
            >
              {isLoading ? "Minting..." : "Mint"}
            </Button>
          </div>

          {/* Token 4 */}
          <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-white text-sm truncate">{getTokenName(MOCK_TOKEN_4)}</h3>
                {hasToken4 && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
              </div>
              <p className="text-xs text-slate-400">
                {formatTokenAmount(balances.token4)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleMint(MOCK_TOKEN_4)}
              disabled={isLoading || refreshing}
              className="bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 text-xs h-7 px-3 flex-shrink-0"
            >
              {isLoading ? "Minting..." : "Mint"}
            </Button>
          </div>

          {/* Info Card */}
          <Card className="border border-teal-500/20 bg-teal-500/5">
            <CardContent className="p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  {hasAllTokens ? (
                    <>
                      <p className="font-medium text-emerald-400">You're all set!</p>
                      <p className="text-slate-400 mt-0.5">
                        You have all 4 tokens. Create pools and start trading.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-teal-400">About test tokens</p>
                      <p className="text-slate-400 mt-0.5">
                        Mint test tokens for free. Create up to 6 different pool combinations!
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mt-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refreshBalances()}
            disabled={refreshing}
            className="flex-1 border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white text-xs h-9"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          {hasAllTokens && (
            <Button
              size="sm"
              onClick={() => {
                onMintComplete?.();
                onOpenChange(false);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
