import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stacks AMM - Decentralized Exchange on Stacks Blockchain",
  description: "Trade tokens, provide liquidity, and earn rewards on the Stacks blockchain. A professional AMM DEX built for Bitcoin DeFi.",
  keywords: ["Stacks", "AMM", "DEX", "DeFi", "Bitcoin", "Cryptocurrency", "Swap", "Liquidity"],
  authors: [{ name: "Stacks AMM" }],
  openGraph: {
    title: "Stacks AMM - Decentralized Exchange",
    description: "Trade tokens and provide liquidity on Stacks blockchain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
