// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {PacificRampDeploymentLib} from "./utils/PacificRampDeploymentLib.sol";
import {CoreDeploymentLib} from "./utils/CoreDeploymentLib.sol";
import {UpgradeableProxyLib} from "./utils/UpgradeableProxyLib.sol";
import {StrategyBase} from "@eigenlayer/contracts/strategies/StrategyBase.sol";
import {ERC20Mock} from "../test/ERC20mock.sol";
import {USDMmock} from "../test/USDMmock.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {StrategyFactory} from "@eigenlayer/contracts/strategies/StrategyFactory.sol";
import {StrategyManager} from "@eigenlayer/contracts/core/StrategyManager.sol";

import {Quorum, StrategyParams, IStrategy} from "@eigenlayer-middleware/src/interfaces/IECDSAStakeRegistryEventsAndErrors.sol";
import {console2} from "forge-std/Test.sol";

contract PacificRampDeployer is Script {
    using CoreDeploymentLib for *;
    using UpgradeableProxyLib for address;

    address private deployer;
    address proxyAdmin;
    IStrategy pacificRampStrategy;
    CoreDeploymentLib.DeploymentData coreDeployment;
    PacificRampDeploymentLib.DeploymentData pacificRampDeployment;
    Quorum internal quorum;
    ERC20Mock token;
    USDMmock underToken;

    function setUp() public virtual {
        deployer = vm.rememberKey(vm.envUint("PRIVATE_KEY"));
        vm.label(deployer, "Deployer");

        coreDeployment = CoreDeploymentLib.readDeploymentJson(
            "deployments/core/",
            block.chainid
        );
        token = new ERC20Mock();
        pacificRampStrategy = IStrategy(
            StrategyFactory(coreDeployment.strategyFactory).deployNewStrategy(
                token
            )
        );

        quorum.strategies.push(
            StrategyParams({strategy: pacificRampStrategy, multiplier: 10_000})
        );
    }

    function run() external {
        vm.startBroadcast(deployer);
        underToken = new USDMmock();
        proxyAdmin = UpgradeableProxyLib.deployProxyAdmin();
        pacificRampDeployment = PacificRampDeploymentLib.deployContracts(
            proxyAdmin,
            coreDeployment,
            quorum,
            address(underToken)
        );

        pacificRampDeployment.strategy = address(pacificRampStrategy);
        pacificRampDeployment.token = address(token);
        pacificRampDeployment.underlyingUSD = address(underToken);
        vm.stopBroadcast();

        console2.log("Deployed MockToken address:", address(token));
        console2.log(
            "Deployed pacificRampServiceManager address:",
            pacificRampDeployment.pacificRampServiceManager
        );

        verifyDeployment();
        PacificRampDeploymentLib.writeDeploymentJson(pacificRampDeployment);
    }

    function verifyDeployment() internal view {
        require(
            pacificRampDeployment.stakeRegistry != address(0),
            "StakeRegistry address cannot be zero"
        );
        require(
            pacificRampDeployment.pacificRampServiceManager != address(0),
            "pacificRampServiceManager address cannot be zero"
        );
        require(
            pacificRampDeployment.strategy != address(0),
            "Strategy address cannot be zero"
        );
        require(proxyAdmin != address(0), "ProxyAdmin address cannot be zero");
        require(
            coreDeployment.delegationManager != address(0),
            "DelegationManager address cannot be zero"
        );
        require(
            coreDeployment.avsDirectory != address(0),
            "AVSDirectory address cannot be zero"
        );
    }
}
