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
    function latestAnswer() external view returns(int256); //gets the price for ethereum.
}

//Uniswap v3 interface
interface IUniswapRouter is ISwapRouter {
    function refundETH() external payable; //call at the end of a swap
}

// Add deposit function for WETH
interface DepositableERC20 is IERC20 {
    function deposit() external payable; //add deposit interface for WETH
}


contract myVault {
uint256 public version = 1;
address public daiAddress;
address public wethAddress;
address public uniswapV3QuoterAddress;
address public uniswapV3RouterAddress;
address public chainLinkETHUSDAddress;

uint256 public ethPrice;
uint256 public updatedPriceTime;
uint256 public usdTargetPercentage = 40;
uint256 public usdDividentPercentage = 25; // 25% of 40% = 10% Annual Drawdown
uint256 private dividendFrequency = 5 minutes; // change to 1 years of production. 
uint256 public nextDividendTS;
address public owner;

using SafeERC20 for IERC20;
using SafeERC20 for DepositableERC20;


constructor (
address memory _daiAddress,
address memory _wethAddress,
address memory _uniswapV3QuoterAddress,
address memory _uniswapV3RouterAddress,
address memory _chainLinkETHUSDAddress
) public {
daiAddress = _daiAddress;
wethAddress =_wethAddress;
uniswapV3QuoterAddress = _uniswapV3QuoterAddress;
uniswapV3RouterAddress = _uniswapV3RouterAddress;
chainLinkETHUSDAddress = _chainLinkETHUSDAddress;
console.log("Deploying myVault Version:", version);
nextDividendTS = block.timestamp + dividendFrequency;
owner = msg.sender;
}

IERC20 daiToken = IERC20(daiAddress);
DepositableERC20 wethToken = DepositableERC20(wethAddress);
IQuoter quoter = IQuoter(uniswapV3QuoterAddress);
IUniswapRouter uniswapRouter = IUniswapRouter(uniswapV3RouterAddress);

event myVaultLog(string msg, uint ref);




function getDaiBalance() public view returns(uint256) {
    return daiToken.balanceOf(address(this));
}

function getWethBalance() public view returns(uint256){
    return wethToken.balanceOf(address(this));
}

function getTotalBalance() public view returns(uint256){
    require(ethPrice > 0, "Eth price has not been set");
    require(updatedPriceTime >= block.timestamp, "Need to get updated Eth price");
    uint256 daiBalance = getDaiBalance();
    uint256 wethBalance = getWethBalance();
    uint256 wethUSD = wethBalance * ethPrice;
    uint256 totalBalance = wethUSD + daiBalance;
    return totalBalance;
}

function updateEthPriceUniswap() public returns(uint256) {
    uint256 ethPriceRaw = quoter.quoteExactOutputSingle(daiAddress, wethAddress, 3000, 100000,0);
    ethPrice = ethPriceRaw / 100000;
    return ethPrice;
}

function updteEthPriceChainlink() public returns(uint256) {
    int256 chainLinkEthPrice = EACAggregatorProxy(chainLinkETHUSDAddress).latestAnswer();
    ethPrice = uint256(chainLinkEthPrice / 100000000);
    return ethPrice;
}

function buyWeth(uint amountUSD) internal {
    uint256 deadline = block.timestamp + 15;
    uint24 fee = 3000; //pool fee
    address recipient = address(this);
    uint256 amountIn = amountUSD; //includes 18 decimals
    uint256 amountOutMinimum = 0; // if set to zero, front runners have an easier change of getting you
    uint160 sqrtPriceLimitX96 = 0;
    emit myVaultLog("AmountIn", amountIn);
    require(daiToken.approve(address(uniswapV3RouterAddress), amountIn), "DAI approve failed");
    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams(
        daiAddress,
        wethAddress,
        fee,
        recipient,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96
    );

    uniswapRouter.exactInputSingle(params);
    uniswapRouter.refundETH();

}


}