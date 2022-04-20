// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

/* 
@title myVault
@license GNU GPLv3
@author Tyler Cranmer
@notice Vault to automate and denctralize a long term donation strategy
*/

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol'; //swaps done on uniswap
import '@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol'; //price quoter oracle

// EACAggregatorProxy is used for chainlink oracle
interface EACAggregatorProxy {
    function latestAnswer() external views returns(int256) //gets the price for ethereum.
}

//Uniswap v3 interface
interface IUniswapRouter is ISwapRouter {
    function refundETH() external payable; //call at the end of a swap
}

// Add deposit function for WETH
interface DepositableERC20 is IERC20 {
    function deposit() external payable; //
}


 contract myVault {
    uint256 public version = 1
    address public daiAddress;
    address public wethAddress;
    address public uniswapV3QuoterAddress;
    address public uniswapV3RouterAddress;
    address public chainLinkETHUSDAddress;

    uint256 public ethPrice = 0;
    uint256 public usdTargetPercentage = 40;
    uint256 public usdDividentPercentage = 25; // 25% of 40% = 10% Annual Drawdown
    uint256 private dividendFrequency = 3 minutes; // change to 1 years of production. 
    uint256 public nextDividentTS;
    address public owner;
    constructor (
        string memory _daiAddress,
        string memory _wethAddress,
        string memory _uniswapV3QuoterAddress,
        string memory _uniswapV3RouterAddress,
        string memory _chainLinkETHUSDAddress
    ) public {
        daiAddress = _daiAddress;
        wethAddress =_wethAddress;
        uniswapV3QuoterAddress = _uniswapV3QuoterAddress;
        uniswapV3RouterAddress = _uniswapV3RouterAddress;
        chainLinkETHUSDAddress = _chainLinkETHUSDAddress;
    }


    using SafeERC20 for IERC20;
    using SafeERC20 for DepositableERC20;
 }