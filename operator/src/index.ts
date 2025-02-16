import { ethers } from "ethers";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ReclaimClient } from "@reclaimprotocol/zk-fetch";
import * as Reclaim from "@reclaimprotocol/js-sdk";
import log from "loglevel";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";

dotenv.config();
log.setLevel(process.env.NODE_ENV === "development" ? "debug" : "info");

const client = new ReclaimClient(
  process.env.RECLAIM_APP_ID!,
  process.env.RECLAIM_SECRET!
);

if (!Object.keys(process.env).length) {
  log.error(chalk.red("🔥 Environment variables missing! Exiting process..."));
  throw new Error("process.env object is empty");
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
let chainId = 169;

console.log(
  chalk.green(figlet.textSync("Operator AVS", { horizontalLayout: "fitted" }))
);

const spinner = ora({
  spinner: "dots",
  color: "cyan",
});

const avsDeploymentData = JSON.parse(
  fs.readFileSync(
    path.resolve(
      __dirname,
      `../../contracts/deployments/pacificRamp/${chainId}.json`
    ),
    "utf8"
  )
);
const coreDeploymentData = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, `../../contracts/deployments/core/${chainId}.json`),
    "utf8"
  )
);

const delegationManagerAddress = coreDeploymentData.addresses.delegation;
const avsDirectoryAddress = coreDeploymentData.addresses.avsDirectory;
const pacificRampServiceManagerAddress =
  avsDeploymentData.addresses.pacificRampServiceManager;
const ecdsaStakeRegistryAddress = avsDeploymentData.addresses.stakeRegistry;

const delegationManagerABI = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../abis/IDelegationManager.json"),
    "utf8"
  )
);
const ecdsaRegistryABI = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../abis/ECDSAStakeRegistry.json"),
    "utf8"
  )
);
const pacificRampServiceManagerABI = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../abis/PacificRampServiceManager.json"),
    "utf8"
  )
);
const avsDirectoryABI = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../abis/IAVSDirectory.json"),
    "utf8"
  )
);

const delegationManager = new ethers.Contract(
  delegationManagerAddress,
  delegationManagerABI,
  wallet
);
const pacificRampServiceManager = new ethers.Contract(
  pacificRampServiceManagerAddress,
  pacificRampServiceManagerABI,
  wallet
);
const ecdsaRegistryContract = new ethers.Contract(
  ecdsaStakeRegistryAddress,
  ecdsaRegistryABI,
  wallet
);
const avsDirectory = new ethers.Contract(
  avsDirectoryAddress,
  avsDirectoryABI,
  wallet
);

const signAndRespondToTask = async (
  taskIndex: number,
  task: [string, string, string, string, bigint]
) => {
  spinner.start(chalk.yellow(`🚀 Processing Task #${taskIndex}...`));
  const params = {
    channelId: task[0],
    transactionId: task[1],
    requestOfframpId: task[2],
    receiver: task[3],
    taskCreatedBlock: task[4],
  };
  try {
    console.log(chalk.blue("📡 Calling API to generate proof..."));
    const publicOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer Test",
      },
    };

    const proof = await client.zkFetch(
      `https://jsonplaceholder.typicode.com/todos/1`,
      publicOptions,
      { responseMatches: [{ type: "regex", value: "(?<all>.*)" }] }
    );

    if (!proof) {
      spinner.fail(chalk.red("❗ Proof generation failed."));
      return;
    }

    console.log(
      chalk.green("🔍 Proof generated successfully. Verifying proof...")
    );
    const isProofVerified = await Reclaim.verifyProof(proof);

    log.info(chalk.cyan("Proof verified: "), isProofVerified);

    const onChainProof = Reclaim.transformForOnchain(proof);

    log.info(chalk.cyan("On-chain proof: "), onChainProof);

    if (isProofVerified) {
      console.log(chalk.green("✅ Proof verified. Signing the task..."));
      const messageHash = ethers.solidityPackedKeccak256(
        ["uint32"],
        [taskIndex]
      );
      const messageBytes = ethers.getBytes(messageHash);
      const signature = await wallet.signMessage(messageBytes);

      spinner.succeed(chalk.green(`✔ Task #${taskIndex} signed successfully!`));

      const operators = [await wallet.getAddress()];
      const signatures = [signature];
      const signedTask = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "bytes[]", "uint32"],
        [
          operators,
          signatures,
          ethers.toBigInt((await provider.getBlockNumber()) - 1),
        ]
      );

      const params = {
        channelId: task[0],
        transactionId: task[1],
        requestOfframpId: task[2],
        receiver: task[3],
        taskCreatedBlock: task[4],
      };

      console.log(chalk.blue("🔄 Sending transaction to complete task..."));
      let tx: any;
      if (params.channelId == "onRamp") {
        tx = await pacificRampServiceManager.completeOnramp(
          params,
          taskIndex,
          signedTask
        );
      } else {
        tx = await pacificRampServiceManager.completeOfframp(
          params,
          taskIndex,
          signedTask
        );
      }
      const receipt = await tx.wait();

      log.info(
        chalk.green(`✔ Task #${taskIndex} processed. Tx Hash: ${receipt.hash}`)
      );
    }
  } catch (error: any) {
    spinner.fail(chalk.red("❌ Error processing task: " + error.message));
  }
};

const registerOperator = async () => {
  spinner.start(chalk.yellow("Registering Operator..."));

  try {
    console.log(chalk.blue("📄 Registering operator on delegation manager..."));
    const tx1 = await delegationManager.registerAsOperator(
      {
        __deprecated_earningsReceiver: await wallet.getAddress(),
        delegationApprover: "0x0000000000000000000000000000000000000000",
        stakerOptOutWindowBlocks: 0,
      },
      ""
    );
    await tx1.wait();
    log.info(chalk.green("✔ Operator registered to Core EigenLayer contracts"));

    const salt = ethers.hexlify(ethers.randomBytes(32));
    const expiry = Math.floor(Date.now() / 1000) + 3600;

    let operatorSignatureWithSaltAndExpiry = { signature: "", salt, expiry };

    console.log(chalk.blue("📄 Calculating AVS registration digest hash..."));
    const operatorDigestHash =
      await avsDirectory.calculateOperatorAVSRegistrationDigestHash(
        wallet.address,
        await pacificRampServiceManager.getAddress(),
        salt,
        expiry
      );
    const operatorSigningKey = new ethers.SigningKey(process.env.PRIVATE_KEY!);
    const operatorSignedDigestHash =
      operatorSigningKey.sign(operatorDigestHash);

    operatorSignatureWithSaltAndExpiry.signature = ethers.Signature.from(
      operatorSignedDigestHash
    ).serialized;

    console.log(chalk.blue("📡 Registering operator on AVS..."));
    const tx2 = await ecdsaRegistryContract.registerOperatorWithSignature(
      operatorSignatureWithSaltAndExpiry,
      wallet.address
    );
    await tx2.wait();
    spinner.succeed(chalk.green("✔ Operator successfully registered on AVS"));
  } catch (error: any) {
    spinner.fail(chalk.red("❌ Error in AVS registration: " + error.message));
  }
};

const monitorNewTasks = async () => {
  console.log(chalk.magenta("👀 Monitoring for new tasks..."));
  pacificRampServiceManager.on("NewTaskCreated", async (taskIndex, task) => {
    console.log(taskIndex, task);

    log.info(chalk.blueBright(`🔔 New Task detected: Task #${taskIndex}`));
    await signAndRespondToTask(taskIndex, task);
  });
};

const main = async () => {
  await registerOperator();
  monitorNewTasks().catch((error) => {
    log.error(chalk.red("❌ Error in task monitoring: " + error.message));
  });
};

main().catch((error) => {
  log.error(chalk.red("❌ Fatal Error in main function: " + error.message));
});
