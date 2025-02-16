import { ethers, Contract, Wallet, JsonRpcProvider } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";

dotenv.config();

// Setup environment variables and types
const provider: JsonRpcProvider = new ethers.JsonRpcProvider(
  process.env.RPC_URL
);
const wallet: Wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const userWallet: Wallet = new ethers.Wallet(
  process.env.USER_PRIVATE_KEY!,
  provider
);

const chainId: number = 169; // TODO: Hack

// Define interfaces
interface DeploymentData {
  addresses: {
    pacificRampServiceManager: string;
    underlyingUSD: string; // Replace with USDM address if different
    USDM: string; // Add USDM address here
  };
}

interface OfframpRequestParams {
  user: string;
  amount: bigint;
  amountRealWorld: bigint;
  channelAccount: string;
  channelId: string;
}

// Read deployment data with proper typing
const avsDeploymentData: DeploymentData = JSON.parse(
  fs.readFileSync(
    path.resolve(
      __dirname,
      `../../contracts/deployments/jackramp/${chainId}.json`
    ),
    "utf8"
  )
);

const pacificRampServiceManagerAddress: string =
  avsDeploymentData.addresses.pacificRampServiceManager;
const USDMAddress: string = "0x3620f69a5d745260544692164cc8c7ff736e54b5"; // USDM address

const pacificRampServiceManagerABI = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../abis/PacificRampServiceManager.json"),
    "utf8"
  )
);
const USDMABI = JSON.parse(
  // Replace ABI with USDM ABI
  fs.readFileSync(path.resolve(__dirname, "../../abis/USDM.json"), "utf8")
);

// Initialize contract objects
const pacificRampServiceManagerFromUser: Contract = new ethers.Contract(
  pacificRampServiceManagerAddress,
  pacificRampServiceManagerABI,
  userWallet
);
const pacificRampServiceManager: Contract = new ethers.Contract(
  pacificRampServiceManagerAddress,
  pacificRampServiceManagerABI,
  wallet
);
const USDM: Contract = new ethers.Contract(USDMAddress, USDMABI, userWallet); // Initialize USDM contract

let currentData: [bigint, string, string, string];

// ASCII banner with figlet
console.log(
  chalk.green(
    figlet.textSync("PacificRamp CLI", { horizontalLayout: "fitted" })
  )
);

// Helper function for hashing
function hashIt(content: string): string {
  const hexi: Uint8Array = ethers.toUtf8Bytes(content);
  return ethers.keccak256(hexi);
}

// Generate random task data
function generateRandomData(): [bigint, string, string, string] {
  const amounts: bigint[] = [
    BigInt(1000000),
    BigInt(2000000),
    BigInt(3000000),
    BigInt(1000000),
    BigInt(2000000),
    BigInt(1500000),
  ];
  const channelIds: string[] = [
    "bca",
    "mandiri",
    "bni",
    "bca",
    "bni",
    "mandiri",
  ];
  const channelAccounts: string[] = [
    "111111",
    "222222",
    "333333",
    "444444",
    "343434",
    "78989",
  ];
  const transactionIds: string[] = ["121", "122", "123", "124", "125", "126"];

  const index = Math.floor(Math.random() * amounts.length);
  return [
    amounts[index],
    channelIds[index],
    channelAccounts[index],
    transactionIds[index],
  ];
}

// Create a new task
async function createNewTask(
  amount: bigint,
  channelId: string,
  channelAccount: string,
  transactionId: string
): Promise<void> {
  console.log(chalk.blue(`⚙️ Creating Task with:`));
  console.log(chalk.magenta(`🔢 Amount: ${amount}`));
  console.log(chalk.magenta(`🏦 ChannelId: ${channelId}`));
  console.log(chalk.magenta(`📞 ChannelAccount: ${channelAccount}`));

  const spinner = ora(chalk.cyan("Starting App..")).start();

  // try {
  //   const txMint = await USDM.mint(userWallet.address, amount); // Mint USDM instead of mockUSD
  //   const receiptMint = await txMint.wait();
  //   spinner.succeed(
  //     chalk.green(`✅ Minted USDM! Tx Hash: ${receiptMint.hash}`)
  //   );
  // } catch (error) {
  //   spinner.fail(chalk.red("❌ Error minting USDM: " + (error as Error).message));
  //   console.log(error);
  //   return;
  // }

  spinner.start(chalk.cyan("Approving USDM..."));

  try {
    const txApprove = await USDM.approve(
      // Approve USDM instead of mockUSD
      pacificRampServiceManagerAddress,
      amount
    );
    const receiptApprove = await txApprove.wait();
    spinner.succeed(
      chalk.green(`✅ Approved USDM! Tx Hash: ${receiptApprove.hash}`)
    );
  } catch (error) {
    spinner.fail(
      chalk.red("❌ Error approving USDM: " + (error as Error).message)
    );
    return;
  }

  spinner.start(chalk.cyan("Minting PacificUSD..."));

  try {
    const txMintPacific = await pacificRampServiceManagerFromUser.mint(amount);
    const receiptMintPacific = await txMintPacific.wait();
    spinner.succeed(
      chalk.green(`✅ Minted pUSD! Tx Hash: ${receiptMintPacific.hash}`)
    );
  } catch (error) {
    spinner.fail(
      chalk.red("❌ Error minting pUSD: " + (error as Error).message)
    );
    return;
  }

  spinner.start(chalk.cyan("Requesting Offramp..."));

  try {
    const params: OfframpRequestParams = {
      user: userWallet.address,
      amount: amount,
      amountRealWorld: amount,
      channelAccount: hashIt(channelAccount),
      channelId: hashIt(channelId),
    };

    const txOfframp = await pacificRampServiceManagerFromUser.requestOfframp(
      params
    );
    const receiptOfframp = await txOfframp.wait();
    spinner.succeed(
      chalk.green(`✅ Offramp Requested! Tx Hash: ${receiptOfframp.hash}`)
    );
  } catch (error) {
    spinner.fail(
      chalk.red("❌ Error requesting Offramp: " + (error as Error).message)
    );
    return;
  }
}

// Handle response to an offramp request
async function responseToRequest(requestOfframpId: string): Promise<void> {
  const spinner = ora(chalk.cyan("Filling Offramp...")).start();

  try {
    const txFill = await pacificRampServiceManager.fillOfframp(
      requestOfframpId,
      currentData[1],
      currentData[3]
    );
    const receiptFill = await txFill.wait();
    spinner.succeed(
      chalk.green(`✅ Offramp Filled! Tx Hash: ${receiptFill.hash}`)
    );
  } catch (error) {
    spinner.fail(
      chalk.red("❌ Error filling Offramp: " + (error as Error).message)
    );
  }
}

// Monitor new offramp requests
async function monitorNewOfframp(): Promise<void> {
  console.log(chalk.yellow("👀 Monitoring for new offramp requests..."));

  pacificRampServiceManager.on(
    "RequestOfframp",
    async (requestOfframpId: string, task: any) => {
      console.log(
        chalk.blueBright(`🔔 New Offramp Request: ID => ${requestOfframpId}`)
      );
      await responseToRequest(requestOfframpId);
    }
  );
}

// Start creating tasks and monitoring events
function startCreatingTasks(): void {
  monitorNewOfframp().catch((error) => {
    console.error(
      chalk.red(
        "❌ Error monitoring offramp requests: " + (error as Error).message
      )
    );
  });

  currentData = generateRandomData();
  console.log(chalk.green(`✨ Creating new task with data: ${currentData}`));
  createNewTask(currentData[0], currentData[1], currentData[2], currentData[3]);

  // Uncomment this to create tasks every 30 seconds
  /*
  setInterval(() => {
    currentData = generateRandomData();
    console.log(chalk.green(`✨ Creating new task with data: ${currentData}`));
    createNewTask(currentData[0], currentData[1], currentData[2], currentData[3]);
  }, 30000);
  */
}

// Start the process
startCreatingTasks();
