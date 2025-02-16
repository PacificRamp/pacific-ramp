# Jackramp Operator

## Overview

**Jackramp Operator** is an Actively Validated Services (AVS) designed for secure verification of data related to the `fillOfframp` function from a smart contract. The operator generates a zero-knowledge proof using zkTLS, signs the data, and submits it to the `completeOfframp` function within the smart contract, ensuring trustless data verification.

## Commands

| Command             | Description                                                              |
|---------------------|--------------------------------------------------------------------------|
| `build`             | Compiles the TypeScript code using `tsc`.                               |
| `start:operator`    | Starts the Jackramp Operator using `src/index.ts`.                      |
| `start:traffic`     | Initializes the task creation process via `src/createNewTasks.ts`.      |
| `extract:abis`      | Extracts ABI files using `src/abis.ts`.                                 |

To execute any of these commands, run:

```bash
npm run <command>
```

Replace `<command>` with any command from the list above (e.g., `npm run build`).

## Flow
The Jackramp Operator flow follows a structured series of steps to securely process and verify data:
1. **Data Input**: The AVS Consumer fills the `fillOfframp` data on the smart contract.
2. **Event Subscription**: The operator subscribes to the `fillOfframp` event emitted by the smart contract and retrieves the necessary data.
3. **Proof Generation**: Using zkTLS, the operator generates a zero-knowledge proof based on the received data.
4. **Task Signing**: The operator signs the task, confirming its validity before submission.
5. **Verification and Completion**: The signed proof is sent to the smart contract’s `completeOfframp` function, where it is verified and the process is marked as complete.

## Architecture Overview

Jackramp Operator leverages the EigenLayer AVS architecture to enable decentralized verification, with the following key components:
- **Stakers**: Provide security by staking assets, which can be delegated to operators.
- **Operators**: Manage off-chain client software that processes tasks specific to the Jackramp AVS.
- **Contracts**: Include smart contracts for `fillOfframp` and `completeOfframp` functions, facilitating data entry and verification.


## License
This project is licensed under the [MIT License](LICENSE).
