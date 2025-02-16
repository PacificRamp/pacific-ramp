import {
  Approval as ApprovalEvent,
  FillOfframp as FillOfframpEvent,
  Initialized as InitializedEvent,
  Mint as MintEvent,
  NewOfframpRequestCreated as NewOfframpRequestCreatedEvent,
  NewTaskCreated as NewTaskCreatedEvent,
  OnRampAccepted,
  OnRampCompleted,
  OnRampRequested,
  OwnershipTransferred as OwnershipTransferredEvent,
  ReceiptIdSubmitted,
  RequestOfframp as RequestOfframpEvent,
  RewardsInitiatorUpdated as RewardsInitiatorUpdatedEvent,
  StakeSettled,
  TaskResponded as TaskRespondedEvent,
  Transfer as TransferEvent,
  Withdraw as WithdrawEvent,
} from "../generated/pacificramp/pacificramp";
import {
  Task,
  Operator,
  Transfer,
  Mint,
  Withdraw,
  OffRamp,
  OnRamp,
  Stake,
} from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

// Define all possible task statuses as constants
const STATUS_PENDING = "PENDING";
const STATUS_COMPLETED = "COMPLETED";
const STATUS_FAILED = "FAILED"; // Add this if you need to handle failed tasks

export function handleRequestOfframp(event: RequestOfframpEvent): void {
  let entity = new OffRamp(event.params.requestOfframpId);

  entity.id = event.params.requestOfframpId;
  entity.user = event.params.params.user;
  entity.requestedAmount = event.params.params.amount;
  entity.requestedAmountRealWorld = event.params.params.amountRealWorld;
  entity.channelAccount = event.params.params.channelAccount;
  entity.channelId = event.params.params.channelId;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.status = STATUS_PENDING;

  entity.save();
}

export function handleFillOfframp(event: FillOfframpEvent): void {
  const entity = OffRamp.load(event.params.requestOfframpId);

  if (entity === null) {
    log.error("OffRamp entity not found for requestOfframpId: {}", [
      event.params.requestOfframpId.toHexString(),
    ]);
    return;
  }

  entity.receiver = event.params.receiver;
  entity.proof = event.params.proof;
  entity.reclaimProof = event.params.reclaimProof;
  entity.fillBlockNumber = event.block.number;
  entity.fillBlockTimestamp = event.block.timestamp;
  entity.fillTransactionHash = event.transaction.hash;
  entity.status = STATUS_COMPLETED;

  entity.save();
}

export function handleNewTaskCreated(event: NewTaskCreatedEvent): void {
  let id = event.params.taskIndex.toString();
  let task = new Task(id);

  task.taskIndex = event.params.taskIndex;
  task.channelId = event.params.task.channelId;
  task.transactionId = event.params.task.transactionId;
  task.requestOfframpId = event.params.task.requestOfframpId;
  task.receiver = event.params.task.receiver;
  task.taskCreatedBlock = event.params.task.taskCreatedBlock;
  task.offrampRequest = event.params.task.requestOfframpId.toHexString();
  task.status = STATUS_PENDING;
  task.createdAt = event.block.timestamp;
  task.transactionHash = event.transaction.hash;

  task.save();
}

export function handleTaskResponded(event: TaskRespondedEvent): void {
  let id = event.params.taskIndex.toString();
  let task = Task.load(id);

  if (!task) {
    log.error("Task not found for taskIndex: {}", [id]);
    return;
  }

  // Always progress from PENDING to COMPLETED
  if (task.status == STATUS_PENDING) {
    task.status = STATUS_COMPLETED;
    task.respondedAt = event.block.timestamp;

    let operatorId = event.params.operator.toHexString();
    let operator = Operator.load(operatorId);

    if (!operator) {
      operator = new Operator(operatorId);
      operator.address = event.params.operator;
      operator.totalTasksCompleted = BigInt.fromI32(0);
    }

    // Increment completed tasks counter since we're completing the task
    operator.totalTasksCompleted = operator.totalTasksCompleted.plus(
      BigInt.fromI32(1)
    );
    operator.lastActiveTimestamp = event.block.timestamp;
    task.operator = operatorId;

    operator.save();
    task.save();
  } else {
    log.warning("Unexpected task response: Task {} is already in {} status", [
      id,
      task.status,
    ]);
  }
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.from = event.params.from;
  let toHolderId = event.params.to.toHexString();
  entity.to = toHolderId;
  entity.value = event.params.value;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleMint(event: MintEvent): void {
  let entity = new Mint(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  log.info("Mint event: {}", [event.params.user.toString()]);
  entity.user = event.params.user;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  let entity = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.user = event.params.user;
  entity.amount = event.params.amount;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}

export function handleOnRampAccepted(event: OnRampAccepted): void {
  let entity = OnRamp.load(event.params.onRampId);

  if (!entity) {
    entity = new OnRamp(event.params.onRampId);
    entity.onRampId = event.params.onRampId;
    entity.status = "Accepted";
  }

  entity.channelId = event.params.channelId;
  entity.seller = event.params.seller;
  entity.save();
}

export function handleOnRampCompleted(event: OnRampCompleted): void {
  let entity = OnRamp.load(event.params.onRampId);

  if (!entity) {
    entity = new OnRamp(event.params.onRampId);
    entity.onRampId = event.params.onRampId;
    entity.status = "Completed";
  }

  entity.buyer = event.params.buyer;
  entity.amount = event.params.amount;
  entity.save();
}

export function handleReceiptIdSubmitted(event: ReceiptIdSubmitted): void {
  let entity = OnRamp.load(event.params.onRampId);

  if (!entity) {
    entity = new OnRamp(event.params.onRampId);
    entity.onRampId = event.params.onRampId;
    entity.status = "Receipt Submitted";
  }

  entity.receiptId = event.params.receiptId;
  entity.save();
}

export function handleOnRampRequested(event: OnRampRequested): void {
  let entity = new OnRamp(event.params.onRampId);

  entity.onRampId = event.params.onRampId;
  entity.status = "Requested";
  entity.buyer = event.params.buyer;
  entity.amount = event.params.amount;
  entity.save();
}

export function handleStakeSettled(event: StakeSettled): void {
  let entity = new Stake(event.transaction.hash.toHexString());
  entity.user = event.params.user;
  entity.amount = event.params.amount;
  entity.provider = event.params.provider;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
