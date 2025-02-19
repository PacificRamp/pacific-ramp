export type HexAddress = `0x${string}`;

export interface CoinItem {
  id: string;
  symbol: string;
  name: string;
  network: string;
  network_symbol: string;
  chain_id: number;
  is_maintenance: boolean;
  is_token: boolean;
  contract_address: string;
  decimals: number;
  max_trade_decimals: number;
  image: string;
}

export interface LiquidityContract {
  token: string;
  platform: string;
  depositor: string;
  amount: number;
  conversionRate: number;
}

export interface RequestOffRamps {
  blockNumber: string;
  blockTimestamp: string;
  id: string;
  params_amount: string;
  params_amountRealWorld: string;
  params_channelAccount: string;
  params_channelId: string;
  params_user: string;
  requestOfframpId: string;
  transactionHash: string;
}

export interface Mint {
  amount: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  user: string;
  id: string;
}

export interface OffRamps {
  id: string;
  user: string;
  requestedAmount: string;
  requestedAmountRealWorld: string;
  blockNumber: string;
  blockTimestamp: string;
  channelAccount: string;
  channelId: string;
  fillBlockNumber: string;
  fillBlockTimestamp: string;
  fillTransactionHash: string;
  proof: string;
  receiver: string;
  reclaimProof: string;
  status: string;
  transactionHash: string;
}

export interface Withdraw {
  id: string;
  blockTimestamp: string;s
  blockNumber: string;
  amount: string;
  transactionHash: string;
  user: string;
}

export interface Swap {
  id: string;
  user: string;
  requestedAmount: string;
  requestedAmountRealWorld: string;
  blockNumber: string;
  blockTimestamp: string;
  channelAccount: string;
  channelId: string;
  transactionHash: string;
}

interface TaskResponded {
  receiver: string;
  requestOfframpId: string;
  respondedAt: string;
  status: string;
  taskCreatedBlock: number;
  taskIndex: number;
  transactionHash: string;
  transactionId: string;
  createdAt: string;
  channelId: string;
}

interface Operator {
  id: string;
  address: string;
  lastActiveTimestamp: string;
  tasksResponded: TaskResponded[];
}

interface OnRamp {
  id: string;
  status: string;
  seller: string | null;
  receiptId: string | null;
  onRampId: string;
  channelId: string | null;
  buyer: string | null;
  amount: string;
}

export interface Stake {
  id: string;
  user: string;
  provider: string;
  amount: string;
  blockTimestamp: string;
  blockNumber: string;
  transactionHash: string;
}
