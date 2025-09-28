Courses
Build full-stack apps on Stacks
Building a mini block explorer
Stacks Logo
Stacks

24 min read

·
8 months ago

+7,000 XP
19
9
5
Building a mini block explorer
Lesson Objectives
Learn how to set up and use the Stacks SDK

Learn how to build a "Connect Wallet" flow in a React frontend

Use Hiro's APIs to query information about the Stacks blockchain

View an account's transaction history

Learn about the different types of transactions that are possible

Introduction

Welcome to the first lesson of the second course in the Stacks Developer Degree! If you haven't already, make sure to check out the first course - Introduction to Stacks - before we start building apps here.

In this lesson, we'll build a mini block explorer of our own. It's a great little project that doesn't require us to write any smart contract code. Instead, we'll get to play around with the client-side Stacks SDK and Hiro's APIs to understand how we interact with onchain data offchain, and get an intro towards building full end to end applications within the Stacks ecosystem.

Our goal is to build a Next.js website where users can connect their wallet (optionally). Then, they can either look at their own account - or search for a different address - and go through the transaction history of that account.

The final code for this project is available in this repo - https://github.com/LearnWeb3DAO/stacks-account-history. You can also play with a demo of the final project here - https://stacks-account-history.vercel.app/

System Design

Before we start writing our code, let's spend a couple of minutes planning out a high level design of how this system will work. There are a few key functionalities we need to implement:

A user should be able to connect their Stacks wallet (e.g. Leather or Xverse) and view their transaction history easily

A user should also be able to search for any valid Stacks address and view their transaction history as well

Since a user can have potentially thousands of transactions, we want to paginate and show a limited number of transactions at a time, and offer a "Load More" button

We'll also place a couple of assumptions and constraints:

We will only support Stacks mainnet for now for transaction history, and not support Testnet here. Supporting Testnet is a trivial addition to make to this project and is left as homework for the reader!

For transaction history pagination, we will load 20 transactions at a time. This can also be increased/decreased trivially, but we're going with 20 as an arbitrary decision for now.

With these in mind, let's get started!

Setting up Next.js

We're going to use Next.js as our framework of choice for building React apps. We assume some level of familiarity here with React, Next, and TypeScript.

To get started, run the following command in your terminal:

npx create-next-app@latest --typescript --eslint --tailwind --app account-history

For the two additional questions it asks in the interactive menu during set up, select the default choices. Particularly, select No for wanting to use the src/ directory, select No for wanting to use Turbopack, and select No for customizing the default import alias.

This will create a new Next app inside a directory named account-history using the App Router, and set it up to work with TypeScript as the language, ESLint for linting, and Tailwind CSS for styling. You should have a folder structure that looks like this:

Fetching Transactions

We'll start off by creating the backend part of the code first. Create a folder named lib inside the project, and then a file named fetch-address-transactions.ts inside it.

Here we'll write a function that given an address and an offset (starting point) will return the next 20 transactions. The address is the one we're fetching the transactions for, and the offset defines the starting point from which we want to find the "next" 20 transactions. Initially, the offset is just zero - and as the user clicks "Load More", we will fetch with offsets 20, 40, 60, and so on.

So, for example, if an account has done 50 transactions onchain, initially we will fetch the first 20 transactions with an offset of zero. Then, when the user asks to load more transactions, we will fetch transactions again, this time with an offset of 20, and so on.

Types of Transactions

This is a great point to also take a quick detour into understanding the different types of transactions that can exist on Stacks. There are mainly five types of transactions that can occur:

coinbase: A coinbase transaction is a transaction where a new block is mined on the network. This happens periodically on every blockchain and is a common transaction type.

token_transfer: A transaction that signifies that a fungible or non fungible token transfer has taken place.

smart_contract: A transaction that signifies the deployment of a new smart contract onchain.

contract_call: A transaction that signifies a function call being made to a deployed smart contract onchain.

poison_microblock: A transaction where a Stacks microblock is being produced, which is an "intermediate" block that Stacks produces between full Bitcoin blocks that happen on average only once every 10 minutes - and relate to the coinbase transactions.

Which of the following is not a valid transaction type on Stacks?
contract_call

stx_transfer

coinbase

To properly be able to distinguish the types of transactions and how to display them on our frontend eventually, we'll leverage TypeScript types to create a single Transaction type that is actually a union of these five subtypes of transactions.

We'll also be using Hiro's Stacks API to fetch these transactions, so we'll base these data types off what Hiro's API returns to us when we fetch transactions for a given address.

ℹ️
When you want to read onchain data offchain, Hiro's Stacks APIs are really powerful and commonly used for access to information that cannot be directly queried for onchain. For example, calling a read-only function onchain to get a value can be done directly via a contract call, so we don't need Hiro's APIs for that. But, for historical data like account transactions, Hiro's APIs offer an easy way to get access to this historical information that they store.

So in the fetch-address-transactions.ts file, start off by writing the following code defining the interfaces and types we will expect as the input, output and intermediary types for our function:

// Input to our function
interface FetchAddressTransactionsArgs {
address: string;
offset?: number;
}

// Output from our function
export interface FetchAddressTransactionsResponse {
limit: number;
offset: number;
total: number;
results: Array<{
tx: Transaction;
stx_sent: string;
stx_received: string;
events: {
stx: TransactionEvent;
ft: TransactionEvent;
nft: TransactionEvent;
};
}>;
}

// Intermediary types of transactions we get from Hiro's APIs
interface BaseTransaction {
tx_id: string;
nonce: number;
sender_address: string;
block_hash: string;
parent_block_hash: string;
block_height: number;
block_time: number;
tx_status: string;
tx_type:
| "coinbase"
| "token_transfer"
| "smart_contract"
| "contract_call"
| "poison_microblock";
}

interface CoinbaseTransaction extends BaseTransaction {
tx_type: "coinbase";
}

interface TokenTransferTransaction extends BaseTransaction {
tx_type: "token_transfer";
token_transfer: {
recipient_address: string;
amount: string;
};
}

interface SmartContractTransaction extends BaseTransaction {
tx_type: "smart_contract";
smart_contract: {
clarity_version: number;
contract_id: string;
};
}

interface ContractCallTransaction extends BaseTransaction {
tx_type: "contract_call";
contract_call: {
contract_id: string;
function_name: string;
};
}

interface PoisonMicroblockTransaction extends BaseTransaction {
tx_type: "poison_microblock";
}

export type Transaction =
| CoinbaseTransaction
| TokenTransferTransaction
| SmartContractTransaction
| ContractCallTransaction
| PoisonMicroblockTransaction;

interface TransactionEvent {
transfer: number;
mint: number;
burn: number;
}

Notably, there are three main things we've defined here:

FetchAddressTransactionsArgs: This is the input to the function we will write shortly, specifying an address and an offset to start fetching transactions

FetchAddressTransactionsResponse: This is the output from the function, specifying transactions to show on the frontend along with metadata used to calculate the next offset to load more transactions

Transaction: A union type that combines the five different types of transactions that are possible. This is used within the output response type to explain the specific transaction we are talking about.

With all of these in place, we can write our actual function which will use Hiro's API to fetch the transaction history. Let's write the function:

export async function fetchAddressTransactions({
address,
offset = 0,
}: FetchAddressTransactionsArgs): Promise<FetchAddressTransactionsResponse> {
const url = `https://api.hiro.so/extended/v2/addresses/${address}/transactions?limit=20&offset=${offset}`;

const response = await fetch(url);

if (!response.ok) {
throw new Error("Failed to fetch address transactions");
}

const data = await response.json();
return data as FetchAddressTransactionsResponse;
}

Great! Apart from the TypeScript types, the function itself is quite simple. We take an address and an offset (default to 0 if not provided), and call Hiro's /transactions endpoint along with the offset. If we successfully receive a response, we just type-cast it to our output type and return it.

NOTE: The TypeScript types and interfaces definition are somewhat optional. We do it for easier developer experience when building the project, but using any or using an untyped language like JavaScript would still work without all the interface and type definitions. These don't affect the runtime of the program, they only give us nice autocomplete and intellisense when writing code.

Abbreviation Helpers

While we're here doing our backend, let us do one more quick thing. On the frontend side, we generally don't want to display full transaction hashes or addresses since they're hard to read and not really human friendly. A common practice is to abbreviate those things and just link to a blockchain explorer instead.

For example, a long address like ST3P49R8XXQWG69S66MZASYPTTGNDKK0WW32RRJDN is usually abbreviated to something like ST3…JDN just to display a few characters from the beginning and end and truncating the rest.

Let's create a file named stx-utils.ts under the lib/ directory and add a couple of abbreviation functions:

export function abbreviateAddress(address: string) {
return `${address.substring(0, 5)}...${address.substring(36)}`;
}

export function abbreviateTxnId(txnId: string) {
return `${txnId.substring(0, 5)}...${txnId.substring(62)}`;
}

A Stacks address is 41 characters long, so abbreviateAddress takes the first 5 (0 to 5) and the last 5 (36 to 41), and truncate the rest.

A Stacks transaction hash (or transaction id) is 67 characters long, so we similarly take the first 5 (0 to 5) and the last 5 (62 to 67) and truncate the rest.

Connect Wallet Hook

Great, now let's start on the frontend side of things. The first thing we'll do here is let people connect their wallets. We'll do this in a few steps:

First, we'll install the required Stacks.js SDK dependencies

Secondly, we'll create a React hook that will provide an easy way to connect or disconnect a user's wallet, and get access to the wallet's details if it is connected

Lastly, we'll utilize this hook in our UI components as we build those to create a "Connect Wallet" and "Disconnect Wallet" button

So, let's install the required dependency:

npm install --save @stacks/connect

@stacks/connect contains helper function that will help us communicate with wallets.

There are other Stacks js libraries as well, present under different names under the @stacks/ identifier on NPM - but we'll use those as they become necessary. For wallet communication, this is the only one we need for now.

Once installed, create a folder named hooks/ in your project and inside it create a file named use-stacks.ts. This is where we'll create our custom React hook.

Write the following code in that file:

import {
AppConfig,
showConnect,
type UserData,
UserSession,
} from "@stacks/connect";
import { useEffect, useState } from "react";

export function useStacks() {
// Initially when the user is not logged in, userData is null
const [userData, setUserData] = useState<UserData | null>(null);

// create application config that allows
// storing authentication state in browser's local storage
const appConfig = new AppConfig(["store_write"]);

// creating a new user session based on the application config
const userSession = new UserSession({ appConfig });

function connectWallet() {
showConnect({
appDetails: {
name: "Stacks Account History",
icon: "https://cryptologos.cc/logos/stacks-stx-logo.png",
},
onFinish: () => {
// reload the webpage when wallet connection succeeds
// to ensure that the user session gets populated from local storage
window.location.reload();
},
userSession,
});
}

function disconnectWallet() {
// sign out the user and close their session
// also clear out the user data
userSession.signUserOut();
setUserData(null);
}

// When the page first loads, if the user is already signed in,
// set the userData
// If the user has a pending sign-in instead, resume the sign-in flow
useEffect(() => {
if (userSession.isUserSignedIn()) {
setUserData(userSession.loadUserData());
} else if (userSession.isSignInPending()) {
userSession.handlePendingSignIn().then((userData) => {
setUserData(userData);
});
}
}, []);

// return the user data, connect wallet function, and disconnect wallet function
return { userData, connectWallet, disconnectWallet };
}

We've left comments in the code to help you understand what is going on, but let's do a quick review:

We create two functions - connectWallet and disconnectWallet - that are small wrappers around the requisite connection and disconnection flows.

We create a state variable - userData - that gets populated through a "on load" useEffect based on whether the user is already signed in or not.

Now, we can simply useStacks() in any of our React components and get access to userData as well as the helper connectWallet and disconnectWallet functions wherever we need it.

Making the Navbar

With all the helper components in place, we can now start work on our UI! Create a new folder named components/ in your project root and inside it create a file named navbar.tsx.

We'll create a top level navigation bar on our website here which will have:

A link to go back to the homepage

A search bar to look up any Stacks address

A connect/disconnect wallet button

Here we'll also install another Stacks.js library:

npm install --save @stacks/transactions

@stacks/transactions contains a helper function that helps us validate that a given Stacks address is actually valid or not. When the user searches for an address, we need to check if it's actually valid or not before attempting to fetch it's transaction history - so we will use that here.

Write the following code inside navbar.tsx:

"use client";
import { useStacks } from "@/hooks/use-stacks";
import { abbreviateAddress } from "@/lib/stx-utils";
import { createAddress } from "@stacks/transactions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Navbar() {
// next.js router to handle redirecting to different pages
const router = useRouter();

// state variable for storing the address input in the search bar
const [searchAddress, setSearchAddress] = useState("");

// our useStacks hook
const { userData, connectWallet, disconnectWallet } = useStacks();

// function that validates the user inputted address
// If it is valid, we will redirect the user to the txn history page
function handleSearch() {
if (!searchAddress.startsWith("SP")) {
return alert("Please enter a mainnet Stacks address");
}

    try {
      // createAddress comes from @stacks/transactions
      // and throws an error if the given user input is not a valid Stacks address
      createAddress(searchAddress);
    } catch (error) {
      return alert(`Invalid Stacks address entered ${error}`);
    }

    // redirect to /SP... which will show the txn history for this address
    router.push(`/${searchAddress}`);

}

return (
<nav className="flex w-full items-center justify-between gap-4 p-4 h-16 border-b border-gray-500">
<Link href="/" className="text-2xl font-bold">
Stacks Account History
</Link>

      <input
        type="text"
        placeholder="SP..."
        className="w-96 rounded-lg bg-gray-700  px-4 py-2 text-sm"
        onChange={(e) => setSearchAddress(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            // enter = search
            handleSearch();
          }
        }}
      />

      <div className="flex items-center gap-2">
        {/* If userData exists, show the disconnect wallet button, else show the connect wallet button */}
        {userData ? (
          <div className="flex items-center gap-2">
            {/* button for quickly viewing the user's own transaction history */}
            <button
              type="button"
              onClick={() =>
                router.push(`/${userData.profile.stxAddress.mainnet}`)
              }
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View {abbreviateAddress(userData.profile.stxAddress.mainnet)}
            </button>
            <button
              type="button"
              onClick={disconnectWallet}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={connectWallet}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>

);
}

Now, to actually use this Navbar throughout the website, open up app/layout.tsx which defines our web app's core layout and replace the default code there with the following which makes sure the Navbar is visible on every page of the website:

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
title: "Stacks Account History",
description: "View your Stacks account history and transactions.",
};

export default function RootLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
return (
<html lang="en">
<body className={inter.className}>
<div className="flex min-h-screen flex-col gap-8 w-full">
<Navbar />
{children}
</div>
</body>
</html>
);
}

Finally, let's update app/page.tsx to prompt the user to connect their wallet if they haven't already, or search for an address, on the homepage. This way, the homepage just displays the prompt - and the user can then either search or connect a wallet to view transactions of that address on a different page we will create.

"use client";

import { useStacks } from "@/hooks/use-stacks";
import { redirect } from "next/navigation";

export default function Home() {
const { userData } = useStacks();

if (!userData) {
return (
<main className="flex min-h-screen flex-col items-center gap-8 p-24">
<span>Connect your wallet or search for an address</span>
</main>
);
}

// If user's wallet is connected, just redirect to the /SP... page
// to show their profile
redirect(`/${userData.profile.stxAddress.mainnet}`);
}

Great! At this point if you start up your Next.js app, you should be able to connect your wallet - but you'll notice that it will redirect to you a different page that we haven't implemented yet, resulting in an HTTP 404 error.

This other page is going to be the page where we actually display the transaction history of the selected address, so let's start work on that now!

Displaying Transaction Details

Once the user hits the dynamic page where we are to show the transaction history, we will design our components architecture such that the page will display a TransactionList along with a button to Load More transactions.

Inside the TransactionList will be a bunch of TransactionDetail components, which will provide information about individual transactions.

We'll go bottom-up in this tutorial, so we'll start off by creating the TransactionDetail component first, then the wrapper TransactionList, and then finally the page itself.

Let's also quickly install lucide-react, an icons library we can use to display some icons for the different types of transactions on our UI:

npm install --save lucide-react

Make a new file under the components/ directory named txn-details.tsx. We will pass the component here a singular Transaction we get from our backend, and based on the tx_type we will display different bits of information to the user.

Write the following code in the file. Review the comments to understand each piece of code:

import type {
FetchAddressTransactionsResponse,
Transaction,
} from "@/lib/fetch-address-transactions";
import { abbreviateTxnId, abbreviateAddress } from "@/lib/stx-utils";
import {
ActivityIcon,
ArrowLeftRightIcon,
BlocksIcon,
CodeSquareIcon,
FunctionSquareIcon,
type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface TransactionDetailProps {
result: FetchAddressTransactionsResponse["results"][number];
}

// Each component will display the following pieces of information
// that will vary depending on the type of transaction
type TransactionInformationByType = {
primaryTitle: string;
secondaryTitle: string;
tags: string[];
};

// An icon to represent each type of transaction
const TxTypeIcon: Record<Transaction["tx_type"], LucideIcon> = {
coinbase: BlocksIcon,
token_transfer: ArrowLeftRightIcon,
smart_contract: CodeSquareIcon,
contract_call: FunctionSquareIcon,
poison_microblock: ActivityIcon,
};

function getTransactionInformationByType(
result: TransactionDetailProps["result"]
): TransactionInformationByType {
if (result.tx.tx_type === "coinbase") {
return {
primaryTitle: `Block #${result.tx.block_height}`,
secondaryTitle: "",
tags: ["Coinbase"],
};
}

if (result.tx.tx_type === "token_transfer") {
return {
primaryTitle: `Transfer ${(
        Number.parseFloat(result.tx.token_transfer.amount) / 1_000_000
      ).toFixed(2)} STX`,
secondaryTitle: "",
tags: ["Token Transfer"],
};
}

if (result.tx.tx_type === "smart_contract") {
return {
primaryTitle: result.tx.smart_contract.contract_id,
secondaryTitle: "",
tags: ["Contract Deployment"],
};
}

if (result.tx.tx_type === "contract_call") {
return {
primaryTitle: result.tx.contract_call.function_name,
secondaryTitle: result.tx.contract_call.contract_id.split(".")[1],
tags: ["Contract Call"],
};
}

if (result.tx.tx_type === "poison_microblock") {
return {
primaryTitle: "Microblock",
secondaryTitle: "",
tags: ["Microblock"],
};
}

return {
primaryTitle: "",
secondaryTitle: "",
tags: [],
};
}
export function TransactionDetail({ result }: TransactionDetailProps) {
const Icon = TxTypeIcon[result.tx.tx_type];
const { primaryTitle, secondaryTitle, tags } =
getTransactionInformationByType(result);

return (
<div className="flex items-center p-4 border-l-2 border-transparent hover:border-blue-500 transition-all justify-between">
<div className="flex items-center gap-4">
<Icon className="h-10 w-10 rounded-full p-2 border border-gray-700" />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{primaryTitle}</span>
            {secondaryTitle && (
              <span className="text-gray-500">({secondaryTitle})</span>
            )}
          </div>
          <div className="flex items-center gap-1 font-bold text-xs text-gray-500">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
            <span>•</span>
            <span className="font-normal">
              By{" "}
              <Link
                href={`/address/${result.tx.sender_address}`}
                className="hover:underline transition-all"
              >{`${abbreviateAddress(result.tx.sender_address)}`}</Link>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span>{abbreviateTxnId(result.tx.tx_id)}</span>
          <span>•</span>
          <span suppressHydrationWarning>
            {new Date(result.tx.block_time).toLocaleTimeString()}
          </span>
        </div>

        <div className="flex items-center gap-1 font-bold text-xs text-gray-500">
          <span>Block #{result.tx.block_height}</span>
          <span>•</span>
          <span>Nonce {result.tx.nonce}</span>
        </div>
      </div>
    </div>

);
}

In this code block, we've built a React component that displays detailed information about a Stacks transaction. The TransactionDetailProps interface is defined to accept a single result prop, which represents an individual transaction fetched from the blockchain.

The TxTypeIcon object is a mapping that associates each transaction type (`coinbase`, token_transfer, smart_contract, contract_call, and poison_microblock) with a corresponding icon imported from the lucide-react library. This allows the component to dynamically render the correct icon based on the transaction type.

The getTransactionInformationByType function is a helper that extracts and formats key pieces of information from the transaction object based on its type. For instance, it might return the block height for a coinbase transaction, the amount of STX transferred for a token transfer, or the function name for a contract call. It also categorizes transactions with tags like "Coinbase" or "Contract Call," which can be displayed to help users quickly identify the nature of the transaction.

Within the TransactionDetail component, these extracted details are used to populate various parts of the UI. The component first renders the appropriate icon for the transaction type, followed by the primary and secondary titles that describe the transaction. Tags are displayed in a stylized manner to highlight the transaction category, and a link is provided to view the sender's address, which is abbreviated for brevity using the abbreviateAddress function.

On the right side of the component we show additional details such as the abbreviated transaction ID, the time the transaction was included in a block, the block height, and the transaction nonce.

Creating a Transaction List
With the TransactionDetail component taken care of, we can now build the wrapper TransactionList component that will render a list of transaction details. It will also allow the user to load more transactions dynamically to add more items to the list.

Create another file named txns-list.tsx under the components/ directory and add the following code:

"use client";

import {
fetchAddressTransactions,
type FetchAddressTransactionsResponse,
} from "@/lib/fetch-address-transactions";
import { TransactionDetail } from "./txn-details";
import { useState } from "react";

interface TransactionsListProps {
address: string;
transactions: FetchAddressTransactionsResponse;
}

export function TransactionsList({
address,
transactions,
}: TransactionsListProps) {
const [allTxns, setAllTxns] = useState(transactions);

// Load another 20 txns
async function loadMoreTxns() {

    // The new offset to fetch transaction is the offset we used
    // in the last request + the number of txns we fetched previously
    // e.g. if initially we fetched offset = 0 with limit = 20
    // the new offset would be 0 + 20 = 20 to fetch transactions
    // 20 to 40
    const newTxns = await fetchAddressTransactions({
      address,
      offset: allTxns.offset + allTxns.limit,
    });

    setAllTxns({
      ...newTxns,
      results: [...allTxns.results, ...newTxns.results],
    });

}

return (
<div className="flex flex-col gap-4">
<div className="flex flex-col border rounded-md divide-y border-gray-800 divide-gray-800">
{allTxns.results.map((tx) => (
<div key={tx.tx.tx_id}>
<TransactionDetail result={tx} />
</div>
))}
</div>
<button
        type="button"
        className="px-4 py-2 rounded-lg w-fit border border-gray-800 mx-auto text-center hover:bg-gray-900 transition-all"
        onClick={loadMoreTxns}
      >
Load More
</button>
</div>
);
}

Great! This is a relatively simple component. It just maintains a state variable allTxns, and is passed in an initial transactions array for the initial value.

Initially we'll give it the first 20 transactions to display, which it will display as independent TransactionDetail components. Then, if the user clicks the "Load More" button, we'll call fetchAddressTransactions again with the new offset, and update our allTxns state variable to include those transactions so the list can display the new transactions as well.

Building the Transaction History Page

We've built the requisite components we need, now to build the actual page for our web app.

Inside the app/ directory, create a new folder named [address]. The square brackets imply this is a dynamic route - which is Next.js terminology for a route that can take in any value. Inside the [address] directory, create a page.tsx file.

This allows users to visit a link like example.com/ABCDEF and ABCDEF will be assigned to the address variable as named in the dynamic route. It will display [address]/page.tsx as the page, and the page will have access to the address variable.

In our case, we will be routing users to pages like example.com/SP123… and use the address variable to load transactions for that address, hence the dynamic route [address].

Write the following code inside the app/[address]/page.tsx file:

import { TransactionsList } from "@/components/txns-list";
import { fetchAddressTransactions } from "@/lib/fetch-address-transactions";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

export default async function Activity({
params,
}: {
params: Promise<{ address: string }>;
}) {
// params contains parameters we can parse from the URL Route
const { address } = await params;

// Once we know the address, we fetch the initial 20 transactions
const initialTransactions = await fetchAddressTransactions({ address });

return (
<main className="flex h-[100vh-4rem] flex-col p-8 gap-8">
<div className="flex items-center gap-4">
<h1 className="text-3xl font-bold">{address}</h1>
<Link
href={`https://explorer.hiro.so/address/${address}`}
target="\_blank"
className="rounded-lg flex gap-1 bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" >
<ExternalLinkIcon className="h-4 w-4" />
View on Hiro
</Link>
</div>

      <TransactionsList address={address} transactions={initialTransactions} />
    </main>

);
}

This component takes in the parameters of the URL and extracts the user’s address out of them. It fetches transactions using our fetchAddressTransactions function. It then uses the extracted address and initialTransactions to render our TransactionsList component. We also get an external link for viewing the that history on Hiro instead of our app itself.

NOTE: If you try running this and see warnings in your terminal about ReferenceError: window is not defined - this is a bug with the @stacks/connect library and has an open issue on their GitHub here - https://github.com/hirosystems/connect/issues/402. Once this is fixed, you should simply be able to update your @stacks/connect to the latest version and it should be fine.

This does not affect functionality for now, but will affect being able to build and deploy your website outside of localhost dev. As an alternative temporary solution, you can downgrade your @stacks/connect version from 7.10.0 at the time of writing to something like 7.7.1 which does not have this bug.

With this, we are done!

Testing

At this point, we should be able to test our app!

From the root of your project, run the following command in your terminal:

npm run dev

This will start a Next.js dev server and your website will be accessible at localhost:3000. Opening the page, you should see the home screen prompting you to connect your wallet or search up an address.

Once you connect your wallet, it should redirect you to the history page. Make sure your wallet is set to Stacks Mainnet for this to work.

Now, it is possible you do not have any mainnet transactions on your wallet - so it will just show you an empty list. For testing, you can try searching for the address SP2AWE8GJ52MKEAGGBTTNEEXZSM9VF8CTYK7ZCZDC which is a random address we found that has some mainnet transactions, and you should see a list that looks like this:

If everything works, congratulations! You've succeeded!

Conclusion

Congratulations on completing the first lesson from this course. As we progress, we will build more full stack applications that will now also involve writing our own smart contracts. Up next, we are going to build our own decentralized exchange including the Clarity contracts, tests, and a frontend to go with it.

If you have any doubts orq uestions, feel free to reach out in the LearnWeb3 Discord - and we'll be happy to help you out!

Next lesson
Building PvP onchain Tic Tac Toe
Submit Quiz
19
9
5
User avatar
Add your comment
What do you think?
Post
User avatar
MoistDressmaker
·
2 months ago

Loving it 🤩

0
Reply
User avatar
Shadow_Boxing
·
5 months ago

Cool!Cool

0
Reply
User avatar
Nathan
·
5 months ago

good

0
Reply
User avatar
FamedCarriage
·
6 months ago

good

0
Reply
