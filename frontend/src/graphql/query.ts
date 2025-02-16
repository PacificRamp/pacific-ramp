import { gql } from "graphql-request";

export const queryMint = gql`
  {
    mints(orderDirection: desc, orderBy: blockTimestamp) {
      amount
      blockNumber
      blockTimestamp
      transactionHash
      user
      id
    }
  }
`;

export const queryWithdraw = gql`
  {
    withdraws(orderBy: blockTimestamp, orderDirection: desc) {
      id
      blockTimestamp
      blockNumber
      amount
      transactionHash
      user
    }
  }
`;

export const querySwap = gql`
  {
    offRamps(orderBy: blockTimestamp, orderDirection: desc) {
      id
      user
      requestedAmount
      requestedAmountRealWorld
      blockNumber
      blockTimestamp
      channelAccount
      channelId
      transactionHash
    }
  }
`;

export const queryOperator = gql`
  {
    offRamps(orderBy: blockTimestamp, orderDirection: desc) {
      id
      user
      requestedAmount
      requestedAmountRealWorld
      blockNumber
      blockTimestamp
      channelAccount
      channelId
      transactionHash
      status
      fillBlockNumber
      fillBlockTimestamp
      fillTransactionHash
      proof
      receiver
      reclaimProof
    }
  }
`;

export const queryOnramp = gql`
  {
    onRamps {
      id
      status
      seller
      receiptId
      onRampId
      channelId
      buyer
      amount
    }
  }
`;

export const queryStake = gql`
  {
    stakes(first: 10) {
      id
      user
      provider
      amount
      blockTimestamp
      blockNumber
      transactionHash
    }
  }
`;
