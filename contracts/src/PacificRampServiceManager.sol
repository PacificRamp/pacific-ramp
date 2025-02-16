// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ECDSAServiceManagerBase} from "@eigenlayer-middleware/src/unaudited/ECDSAServiceManagerBase.sol";
import {ECDSAStakeRegistry} from "@eigenlayer-middleware/src/unaudited/ECDSAStakeRegistry.sol";
import {IServiceManager} from "@eigenlayer-middleware/src/interfaces/IServiceManager.sol";
import {ECDSAUpgradeable} from "@openzeppelin-upgrades/contracts/utils/cryptography/ECDSAUpgradeable.sol";
import {IERC1271Upgradeable} from "@openzeppelin-upgrades/contracts/interfaces/IERC1271Upgradeable.sol";
import {IPacificRampServiceManager} from "./IPacificRampServicemanager.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin-upgrades/contracts/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@eigenlayer/contracts/interfaces/IRewardsCoordinator.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Primary entrypoint for procuring services from PacificRamp.
 */
contract PacificRampServiceManager is
    ECDSAServiceManagerBase,
    ERC20,
    IPacificRampServiceManager
{
    using SafeERC20 for IERC20;
    using ECDSAUpgradeable for bytes32;

    // storages
    uint32 public latestTaskNum;
    mapping(uint32 => bytes32) public allTaskHashes;
    mapping(address => mapping(uint32 => bytes)) public allTaskResponses;
    address public immutable underlyingUSD;
    mapping(bytes32 => OfframpRequestStorage) public offrampRequests;
    mapping(bytes32 => OnrampRequestStorage) public onrampRequests;

    modifier onlyOperator() {
        if (ECDSAStakeRegistry(stakeRegistry).operatorRegistered(msg.sender)) {
            revert CallerNotOperator();
        }
        _;
    }

    constructor(
        address _avsDirectory,
        address _stakeRegistry,
        address _rewardsCoordinator,
        address _delegationManager,
        address _underlyingUSD
    )
        ECDSAServiceManagerBase(
            _avsDirectory,
            _stakeRegistry,
            _rewardsCoordinator,
            _delegationManager
        )
        ERC20("pacificUSD", "pUSD")
    {
        underlyingUSD = _underlyingUSD;
    }

    // Buyer creates OnRamp request
    function requestOnRamp(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");

        bytes32 onRampId = keccak256(
            abi.encode(msg.sender, amount, block.timestamp)
        );

        OnrampRequestStorage memory onrampRequest = OnrampRequestStorage({
            buyer: msg.sender,
            amount: amount,
            status: OnrampStatus.PENDING,
            escrowAmount: amount,
            receiptId: "",
            channelId: ""
        });

        // Ensure the request doesn't already exist
        require(
            onrampRequests[onRampId].buyer == address(0),
            "OnRamp request already exists"
        );

        onrampRequests[onRampId] = onrampRequest;

        emit OnRampRequested(onRampId, msg.sender, amount);
    }

    // Seller accepts the OnRamp request
    function acceptOnRamp(bytes32 onRampId, string memory channelId) public {
        OnrampRequestStorage storage request = onrampRequests[onRampId];

        require(request.buyer != address(0), "Request does not exist");
        require(
            request.status == OnrampStatus.PENDING,
            "Request already processed"
        );

        // Escrow the amount of crypto for the buyer
        _transfer(msg.sender, address(this), request.amount);

        request.status = OnrampStatus.ESCROWED;
        request.channelId = channelId;

        emit OnRampAccepted(onRampId, channelId, msg.sender);
    }

    function submitReceiptId(
        bytes32 requestOnrampId,
        string memory receiptId
    ) public returns (Task memory newTask) {
        OnrampRequestStorage storage request = onrampRequests[requestOnrampId];

        require(request.buyer == msg.sender, "Only buyer can submit receipt");
        require(
            request.status == OnrampStatus.ESCROWED,
            "Request is not in escrow"
        );

        request.receiptId = receiptId;

        newTask.channelId = "onRamp";
        newTask.transactionId = receiptId;
        newTask.requestOfframpId = requestOnrampId;
        newTask.receiver = msg.sender;
        newTask.taskCreatedBlock = uint32(block.number);

        allTaskHashes[latestTaskNum] = keccak256(abi.encode(newTask));
        emit NewTaskCreated(latestTaskNum, newTask);
        latestTaskNum = latestTaskNum + 1;

        emit ReceiptIdSubmitted(requestOnrampId, receiptId);
    }

    function completeOnramp(
        Task calldata task,
        uint32 referenceTaskIndex,
        bytes memory signature
    ) public {
        OnrampRequestStorage storage request = onrampRequests[
            task.requestOfframpId
        ];

        require(request.buyer != address(0), "Request does not exist");
        require(
            request.status == OnrampStatus.ESCROWED,
            "Request not in escrow"
        );

        // Task validation - ensures the operator's response matches the correct task
        require(
            keccak256(abi.encode(request)) == allTaskHashes[referenceTaskIndex],
            "supplied request does not match the one recorded in the contract"
        );
        require(
            allTaskResponses[msg.sender][referenceTaskIndex].length == 0,
            "Operator has already responded to the task"
        );

        // Updating the storage with operator's signature
        // bytes32 messageHash = keccak256(abi.encodePacked(referenceTaskIndex));
        // bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        // The message that was signed
        // bytes4 magicValue = IERC1271Upgradeable.isValidSignature.selector;

        // Optionally validate signature here (if needed)
        // if (!(magicValue == ECDSAStakeRegistry(stakeRegistry).isValidSignature(ethSignedMessageHash, signature))) {
        //     revert("Invalid operator signature");
        // }

        request.status = OnrampStatus.COMPLETED;
        _transfer(address(this), request.buyer, request.amount);

        emit OnRampCompleted(
            task.requestOfframpId,
            request.buyer,
            request.amount
        );
        emit TaskResponded(referenceTaskIndex, task, msg.sender);
    }

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
        IERC20(underlyingUSD).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        emit Mint(msg.sender, amount);
    }

    function withdraw(uint256 amount) public {
        _burn(msg.sender, amount);
        IERC20(underlyingUSD).safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    function requestOfframp(OfframpRequestParams memory params) public {
        if (params.amount == 0) revert OfframpRequestAmountIsZero();
        if (params.amountRealWorld == 0) revert OfframpRequestAmountIsZero();
        if (params.channelAccount == bytes32("")) {
            revert OfframpRequestChannelAccountIsEmpty();
        }
        if (params.channelId == bytes32("")) {
            revert OfframpRequestChannelIdIsEmpty();
        }

        params.user = msg.sender;
        params.amountRealWorld = params.amount;

        // Create ID
        NewOfframpRequest memory offrampRequest;
        offrampRequest.user = params.user;
        offrampRequest.amount = params.amount;
        offrampRequest.amountRealWorld = params.amountRealWorld;
        offrampRequest.channelAccount = params.channelAccount;
        offrampRequest.channelId = params.channelId;
        offrampRequest.requestCreatedBlock = uint32(block.number);

        bytes32 requestOfframpId = keccak256(abi.encode(offrampRequest));

        if (offrampRequests[requestOfframpId].user != address(0)) {
            revert OfframpRequestAlreadyExists();
        }

        _transfer(msg.sender, address(this), params.amount);

        offrampRequests[requestOfframpId] = OfframpRequestStorage({
            user: params.user,
            amount: params.amount,
            amountRealWorld: params.amountRealWorld,
            channelAccount: params.channelAccount,
            channelId: params.channelId,
            requestCreatedBlock: offrampRequest.requestCreatedBlock,
            isCompleted: false
        });

        emit RequestOfframp(requestOfframpId, offrampRequest);
    }

    function fillOfframp(
        bytes32 requestOfframpId,
        string memory channelId,
        string memory transactionId
    ) public returns (Task memory newTask) {
        OfframpRequestStorage storage request = offrampRequests[
            requestOfframpId
        ];

        if (request.user == address(0)) revert OfframpRequestDoesNotExist();
        if (request.isCompleted) revert OfframpRequestAlreadyCompleted();

        newTask.channelId = channelId;
        newTask.transactionId = transactionId;
        newTask.requestOfframpId = requestOfframpId;
        newTask.receiver = msg.sender;
        newTask.taskCreatedBlock = uint32(block.number);

        allTaskHashes[latestTaskNum] = keccak256(abi.encode(newTask));
        emit NewTaskCreated(latestTaskNum, newTask);
        latestTaskNum = latestTaskNum + 1;

        emit FillOfframp(
            requestOfframpId,
            msg.sender,
            keccak256(abi.encode(newTask)),
            keccak256(abi.encode(request))
        );

        return newTask;
    }

    function completeOfframp(
        Task calldata task,
        uint32 referenceTaskIndex,
        bytes memory signature
    ) public {
        require(
            keccak256(abi.encode(task)) == allTaskHashes[referenceTaskIndex],
            "supplied task does not match the one recorded in the contract"
        );
        require(
            allTaskResponses[msg.sender][referenceTaskIndex].length == 0,
            "Operator has already responded to the task"
        );

        // The message that was signed
        bytes32 messageHash = keccak256(abi.encodePacked(referenceTaskIndex));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        bytes4 magicValue = IERC1271Upgradeable.isValidSignature.selector;
        if (
            !(magicValue ==
                ECDSAStakeRegistry(stakeRegistry).isValidSignature(
                    ethSignedMessageHash,
                    signature
                ))
        ) {
            revert();
        }

        // updating the storage with task responses
        allTaskResponses[msg.sender][referenceTaskIndex] = signature;

        OfframpRequestStorage storage request = offrampRequests[
            task.requestOfframpId
        ];

        if (request.user == address(0)) revert OfframpRequestDoesNotExist();
        if (request.isCompleted) revert OfframpRequestAlreadyCompleted();

        request.isCompleted = true;

        _burn(address(this), request.amount);

        IERC20(underlyingUSD).safeTransfer(task.receiver, request.amount);

        emit TaskResponded(referenceTaskIndex, task, msg.sender);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function _msgSender()
        internal
        view
        override(Context, ContextUpgradeable)
        returns (address sender)
    {
        sender = ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        override(Context, ContextUpgradeable)
        returns (bytes calldata)
    {
        return ContextUpgradeable._msgData();
    }

    function stake(uint256 amount, string memory provider) public {
        // burn underlyingUSD with amount
        IERC20(underlyingUSD).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        emit StakeSettled(msg.sender, amount, provider);
    }
}
