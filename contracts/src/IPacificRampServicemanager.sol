// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IPacificRampServiceManager {
    error OfframpRequestAlreadyExists();
    error OfframpRequestAmountIsZero();
    error OfframpRequestChannelAccountIsEmpty();
    error OfframpRequestChannelIdIsEmpty();
    error OfframpRequestDoesNotExist();
    error OfframpRequestAlreadyCompleted();
    error CallerNotOperator();

    event Mint(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event RequestOfframp(bytes32 requestOfframpId, NewOfframpRequest params);
    event FillOfframp(
        bytes32 requestOfframpId,
        address receiver,
        bytes32 proof,
        bytes32 reclaimProof
    );
    event NewOfframpRequestCreated(uint32 indexed taskIndex, Task task);
    event NewTaskCreated(uint32 indexed taskIndex, Task task);
    event TaskResponded(uint32 indexed taskIndex, Task task, address operator);
    event OnRampRequested(bytes32 onRampId, address buyer, uint256 amount);
    event OnRampAccepted(bytes32 onRampId, string channelId, address seller);
    event ReceiptIdSubmitted(bytes32 onRampId, string receiptId);
    event OnRampCompleted(bytes32 onRampId, address buyer, uint256 amount);
    event StakeSettled(address indexed user, uint256 amount, string provider);

    struct OfframpRequestParams {
        address user;
        uint256 amount;
        uint256 amountRealWorld;
        bytes32 channelAccount;
        bytes32 channelId;
    }

    struct NewOfframpRequest {
        address user;
        uint256 amount;
        uint256 amountRealWorld;
        bytes32 channelAccount;
        bytes32 channelId;
        uint32 requestCreatedBlock;
    }

    struct OfframpRequestStorage {
        address user;
        uint256 amount;
        uint256 amountRealWorld;
        bytes32 channelAccount;
        bytes32 channelId;
        uint32 requestCreatedBlock;
        bool isCompleted;
    }

    struct Task {
        string channelId;
        string transactionId;
        bytes32 requestOfframpId;
        address receiver;
        uint32 taskCreatedBlock;
    }

    enum OnrampStatus {
        PENDING,
        ESCROWED,
        COMPLETED
    }

    struct OnrampRequestStorage {
        address buyer;
        uint256 amount;
        OnrampStatus status;
        uint256 escrowAmount;
        string receiptId;
        string channelId;
    }

    function latestTaskNum() external view returns (uint32);
    function allTaskHashes(uint32 taskIndex) external view returns (bytes32);
    function allTaskResponses(
        address operator,
        uint32 taskIndex
    ) external view returns (bytes memory);
}
