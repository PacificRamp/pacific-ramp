// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {ECDSAStakeRegistry} from "@eigenlayer-middleware/src/unaudited/ECDSAStakeRegistry.sol";
import {PacificRampServiceManager} from "../../src/PacificRampServiceManager.sol";
import {IDelegationManager} from "@eigenlayer/contracts/interfaces/IDelegationManager.sol";
import {Quorum} from "@eigenlayer-middleware/src/interfaces/IECDSAStakeRegistryEventsAndErrors.sol";
import {UpgradeableProxyLib} from "./UpgradeableProxyLib.sol";
import {CoreDeploymentLib} from "./CoreDeploymentLib.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

library PacificRampDeploymentLib {
    using stdJson for *;
    using Strings for *;
    using UpgradeableProxyLib for address;

    Vm internal constant vm =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    struct DeploymentData {
        address pacificRampServiceManager;
        address stakeRegistry;
        address strategy;
        address token;
        address underlyingUSD;
    }

    function deployContracts(
        address proxyAdmin,
        CoreDeploymentLib.DeploymentData memory core,
        Quorum memory quorum,
        address underlyingUSD
    ) internal returns (DeploymentData memory) {
        DeploymentData memory result;

        // First, deploy upgradeable proxy contracts that will point to the implementations.
        result.pacificRampServiceManager = UpgradeableProxyLib.setUpEmptyProxy(
            proxyAdmin
        );
        result.stakeRegistry = UpgradeableProxyLib.setUpEmptyProxy(proxyAdmin);
        // Deploy the implementation contracts, using the proxy contracts as inputs
        address stakeRegistryImpl = address(
            new ECDSAStakeRegistry(IDelegationManager(core.delegationManager))
        );
        address pacificRampServiceManagerImpl = address(
            new PacificRampServiceManager(
                core.avsDirectory,
                result.stakeRegistry,
                core.rewardsCoordinator,
                core.delegationManager,
                underlyingUSD
            )
        );
        // Upgrade contracts
        bytes memory upgradeCall = abi.encodeCall(
            ECDSAStakeRegistry.initialize,
            (result.pacificRampServiceManager, 0, quorum)
        );
        UpgradeableProxyLib.upgradeAndCall(
            result.stakeRegistry,
            stakeRegistryImpl,
            upgradeCall
        );
        UpgradeableProxyLib.upgrade(
            result.pacificRampServiceManager,
            pacificRampServiceManagerImpl
        );

        return result;
    }

    function readDeploymentJson(
        uint256 chainId
    ) internal returns (DeploymentData memory) {
        return readDeploymentJson("deployments/", chainId);
    }

    function readDeploymentJson(
        string memory directoryPath,
        uint256 chainId
    ) internal returns (DeploymentData memory) {
        string memory fileName = string.concat(
            directoryPath,
            vm.toString(chainId),
            ".json"
        );

        require(vm.exists(fileName), "Deployment file does not exist");

        string memory json = vm.readFile(fileName);

        DeploymentData memory data;
        /// TODO: 2 Step for reading deployment json.  Read to the core and the AVS data
        data.pacificRampServiceManager = json.readAddress(
            ".contracts.pacificRampServiceManager"
        );
        data.stakeRegistry = json.readAddress(".contracts.stakeRegistry");
        data.strategy = json.readAddress(".contracts.strategy");
        data.token = json.readAddress(".contracts.token");
        data.underlyingUSD = json.readAddress(".contracts.underlyingUSD");
        return data;
    }

    /// write to default output path
    function writeDeploymentJson(DeploymentData memory data) internal {
        writeDeploymentJson("deployments/pacificRamp/", block.chainid, data);
    }

    function writeDeploymentJson(
        string memory outputPath,
        uint256 chainId,
        DeploymentData memory data
    ) internal {
        address proxyAdmin = address(
            UpgradeableProxyLib.getProxyAdmin(data.pacificRampServiceManager)
        );

        string memory deploymentData = _generateDeploymentJson(
            data,
            proxyAdmin
        );

        string memory fileName = string.concat(
            outputPath,
            vm.toString(chainId),
            ".json"
        );
        if (!vm.exists(outputPath)) {
            vm.createDir(outputPath, true);
        }

        vm.writeFile(fileName, deploymentData);
        console2.log("Deployment artifacts written to:", fileName);
    }

    function _generateDeploymentJson(
        DeploymentData memory data,
        address proxyAdmin
    ) private view returns (string memory) {
        return
            string.concat(
                '{"lastUpdate":{"timestamp":"',
                vm.toString(block.timestamp),
                '","block_number":"',
                vm.toString(block.number),
                '"},"addresses":',
                _generateContractsJson(data, proxyAdmin),
                "}"
            );
    }

    function _generateContractsJson(
        DeploymentData memory data,
        address proxyAdmin
    ) private view returns (string memory) {
        return
            string.concat(
                '{"proxyAdmin":"',
                proxyAdmin.toHexString(),
                '","pacificRampServiceManager":"',
                data.pacificRampServiceManager.toHexString(),
                '","pacificRampServiceManagerImpl":"',
                data.pacificRampServiceManager.getImplementation().toHexString(),
                '","stakeRegistry":"',
                data.stakeRegistry.toHexString(),
                '","stakeRegistryImpl":"',
                data.stakeRegistry.getImplementation().toHexString(),
                '","strategy":"',
                data.strategy.toHexString(),
                '","token":"',
                data.token.toHexString(),
                '","underlyingUSD":"',
                data.underlyingUSD.toHexString(),
                '"}'
            );
    }
}
