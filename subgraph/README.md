# 🚀 PacificRamp Subgraph

A subgraph implementation for tracking PacificRamp contract events and entities on the Ethena testnet network. This subgraph indexes transfers, operators, and off-ramp transactions.

## 📋 Overview

This subgraph tracks the following events from the PacificRamp contract:
- Off-ramp requests and fills
- Token transfers
- Operators

## 🏗 Schema

### OffRamp
Tracks off-ramping operations with their current status:
```graphql
type OffRamp @entity {
  id: Bytes!
  user: Bytes!
  requestedAmount: BigInt!
  requestedAmountRealWorld: BigInt!
  channelAccount: Bytes!
  channelId: Bytes!
  status: OffRampStatus!
  # ... additional fields
}
```

### Other Entities
- `Transfer`: Tracks token transfers
- `Withdraw`: Logs withdrawal events
- `Operator`: Logs operator events

## 🛠 Setup

1. Install dependencies:
```bash
npm install
```

2. Generate types:
```bash
graph codegen
```

3. Build the subgraph:
```bash
graph build
```

## 📝 Configuration

The subgraph is configured to start indexing on the Ethena Testnet network. Key configurations:

- Spec Version: 1.0.0
- API Version: 0.0.7
- Network: Holesky
- Language: AssemblyScript

## 🔍 Event Handlers

The subgraph implements handlers for:
- `handleFillOfframp`: Processes off-ramp completion events
- `handleRequestOfframp`: Tracks new off-ramp requests
- `handleTransfer`: Monitors token transfers
- `handleTaskResponded`: Records operator events

## 📊 Querying Examples

Query off-ramp requests:
```graphql
{
  offRamps(first: 5) {
    id
    user
    requestedAmount
    status
    blockTimestamp
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links
- [The Graph Protocol Documentation](https://thegraph.com/docs/en/)
- [AssemblyScript Documentation](https://www.assemblyscript.org/)
- [GraphQL Documentation](https://graphql.org/learn/)