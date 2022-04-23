// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "./myVault.sol";

contract VaultFactory {
    uint256 public vaultNumber;
    Vault[] public vaults;

    function create() public {
        Vault vault = new Vault(msg.sender, vaultNumber + 1);
        vaults.push(vault);
        vaultNumber = vaultNumber + 1;
    }
    
    function getVaultCount() public view returns(uint256){
        return vaultNumber;
    }
}