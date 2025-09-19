# Stacks Token Streaming Contract

A Clarity smart contract for creating time-based token streams on the Stacks blockchain. This contract enables users to set up continuous payment streams that release STX tokens over time to recipients.

## 🚀 Features

- **Create Token Streams**: Set up streams with custom timeframes and payment rates
- **Automatic Token Release**: Recipients can withdraw earned tokens based on elapsed blocks
- **Stream Management**: Refuel streams with additional tokens or withdraw excess funds
- **Signature-Based Updates**: Modify stream parameters with cryptographic consent from both parties
- **Secure Withdrawals**: Only authorized parties can withdraw their respective balances

## 📋 Smart Contract Overview

The `stream.clar` contract implements a token streaming system with the following core functionality:

### Data Structures

- **Streams Map**: Stores stream details including sender, recipient, balance, timeframe, and payment rate
- **Latest Stream ID**: Tracks the next available stream identifier

### Key Functions

#### Public Functions

- `stream-to`: Create a new payment stream
- `refuel`: Add more STX to an existing stream
- `withdraw`: Recipients withdraw earned tokens
- `refund`: Senders reclaim excess tokens after stream ends
- `update-details`: Modify stream parameters with signature verification

#### Read-Only Functions

- `balance-of`: Check available balance for sender or recipient
- `calculate-block-delta`: Calculate blocks elapsed for a stream
- `hash-stream`: Generate cryptographic hash for stream updates
- `validate-signature`: Verify signatures for secure updates

## 🛠️ Technical Details

### Stream Mechanics

1. **Time-Based Release**: Tokens are released linearly based on Stacks block height
2. **Payment Rate**: Configurable STX per block distribution
3. **Flexible Timeframes**: Custom start and stop blocks for each stream
4. **Partial Withdrawals**: Recipients can withdraw available balance at any time

### Security Features

- **Authorization Checks**: Only stream participants can perform operations
- **Signature Verification**: Cryptographic consent required for parameter updates
- **Balance Protection**: Prevents unauthorized token access
- **Stream State Validation**: Ensures operations respect stream lifecycle

## 🏗️ Project Structure

```
stacks-token-streaming/
├── contracts/
│   └── stream.clar              # Main streaming contract
├── tests/
│   └── stream.test.ts           # Comprehensive test suite
├── settings/
│   ├── Devnet.toml             # Development network config
│   ├── Testnet.toml            # Testnet configuration
│   └── Mainnet.toml            # Mainnet configuration
├── Clarinet.toml               # Project configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── vitest.config.js            # Test configuration
```

## 🧪 Testing

The project includes comprehensive tests covering:

- Stream creation and initialization
- Token withdrawal mechanisms
- Authorization and security checks
- Stream refueling functionality
- Signature verification
- Parameter updates with consent

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage and cost analysis
npm run test:report

# Watch mode for development
npm run test:watch
```

## 📦 Dependencies

- **@hirosystems/clarinet-sdk**: Stacks blockchain development framework
- **@stacks/transactions**: Stacks transaction utilities
- **TypeScript**: Type-safe development
- **Vitest**: Fast testing framework
- **chokidar-cli**: File watching for development

## 🚦 Usage Examples

### Creating a Stream

```typescript
// Create a 100 STX stream over 50 blocks (2 STX per block)
const result = simnet.callPublicFn(
  "stream",
  "stream-to",
  [
    Cl.principal(recipient),           // Recipient address
    Cl.uint(100),                     // Initial balance (100 STX)
    Cl.tuple({                        // Timeframe
      "start-block": Cl.uint(10),
      "stop-block": Cl.uint(60)
    }),
    Cl.uint(2)                        // Payment per block (2 STX)
  ],
  sender
);
```

### Withdrawing Tokens

```typescript
// Recipient withdraws available tokens
const withdrawal = simnet.callPublicFn(
  "stream",
  "withdraw",
  [Cl.uint(0)],                      // Stream ID
  recipient
);
```

### Updating Stream Parameters

```typescript
// Update stream with both parties' consent
const signature = signMessageHashRsv({
  messageHash: streamHash,
  privateKey: senderPrivateKey
});

const update = simnet.callPublicFn(
  "stream",
  "update-details",
  [
    Cl.uint(0),                       // Stream ID
    Cl.uint(3),                       // New payment per block
    Cl.tuple({                        // New timeframe
      "start-block": Cl.uint(5),
      "stop-block": Cl.uint(55)
    }),
    Cl.principal(sender),             // Signer
    Cl.bufferFromHex(signature.data)  // Signature
  ],
  recipient
);
```

## 🔐 Error Codes

- `ERR_UNAUTHORIZED (u0)`: Caller not authorized for operation
- `ERR_INVALID_SIGNATURE (u1)`: Signature verification failed
- `ERR_STREAM_STILL_ACTIVE (u2)`: Stream hasn't ended yet
- `ERR_INVALID_STREAM_ID (u3)`: Stream doesn't exist

## 🚀 Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Tests**:
   ```bash
   npm test
   ```

3. **Development with Watch Mode**:
   ```bash
   npm run test:watch
   ```

## 🔒 Security Considerations

- **Stream Integrity**: All operations validate stream existence and caller authorization
- **Signature Security**: Updates require cryptographic proof of consent
- **Balance Safety**: Prevents double-spending and unauthorized withdrawals
- **Time Validation**: Ensures operations respect stream lifecycle rules

## 📝 License

ISC License

## 🤝 Contributing

This project is part of the LearnWeb3 Stacks development curriculum. Contributions should follow established patterns and maintain security best practices.

---

*Built with Clarity on Stacks blockchain*