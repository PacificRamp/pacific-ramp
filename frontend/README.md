# PacificRamp

PacificRamp is a decentralized pacificUSD off-ramp solution powered by AVS, enabling seamless conversion between crypto and pacificUSD. The platform features pacificUSD and USDM tokens, with USDM serving as the mining token for pacificUSD.

## 📧 Docs

Project Documentation : [https://kbaji.gitbook.io/PacificRamp](https://kbaji.gitbook.io/PacificRamp)

## 🌟 Features

### Core Functionality
- **Swap**: Exchange between different supported tokens
- **OffRamp**: Swap digital token into real world money
- **Proof**: List of transactions proof
- **Liquidity**: Provide and manage liquidity pools

### Technical Integration
- Wallet connection using wagmi
- Smart contract interaction (read/write) via wagmi hooks

## 🚀 Tech Stack

- React + Vite
- TypeScript
- Wagmi for Web3 integration

## 🔧 Prerequisites

- Node.js (v16 or higher)
- Yarn or npm
- MetaMask or other Web3 wallet

## 💻 Installation

1. Clone the repository:
```bash
git clone https://github.com/PacificRamp/PacificRamp-web.git
cd PacificRamp-web
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
yarn dev
# or
npm run dev
```

## 🔗 Smart Contract Integration

### Reading Contract Data
```typescript
import { useReadContract } from 'wagmi'
```

### Writing to Contract
```typescript
import { useWriteContract } from 'wagmi'
```

## 🪙 Tokenomics

### pacificUSD
- Decentralized pacificUSD
- Maintains 1:1 pacificUSD peg

### USDM Token
- Mining token for pacificUSD
- Used for governance and rewards
- Earned through platform participation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.