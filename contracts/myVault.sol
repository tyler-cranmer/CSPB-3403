// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

/* 
@title myVault
@license GNU GPLv3
@author Tyler Cranmer
@notice Vault to automate and decentralize a long term donation strategy
*/

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol"; //swaps done on uniswap
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol"; //price quoter oracle

// EACAggregatorProxy is used for chainlink oracle
interface EACAggregatorProxy {
    function latestAnswer() external view returns (int256); //gets the price for ethereum.
}

//Uniswap v3 interface
interface IUniswapRouter is ISwapRouter {
    function refundETH() external payable; //call at the end of a swap
}

// Add deposit function for WETH
interface DepositableERC20 is IERC20 {
    function deposit() external payable; //add deposit interface for WETH
}

contract Vault {
    uint256 public version;
    address public daiAddress = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;
    address public wethAddress = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
    address public uniswapV3QuoterAddress =
        0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6;
    address public uniswapV3RouterAddress =
        0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public chainLinkETHUSDAddress =
        0x9326BFA02ADD2366b30bacB125260Af641031331;

    uint256 public ethPrice;
    uint256 public updatedPriceTime;
    uint256 public usdTargetPercentage = 40;
    uint256 public usdDividentPercentage = 25; // 25% of 40% = 10% Annual Drawdown
    uint256 private dividendFrequency = 5 minutes; // change to 1 years of production.
    uint256 public nextDividendTS;
    address public owner;

    using SafeERC20 for IERC20;
    using SafeERC20 for DepositableERC20;

    IERC20 daiToken = IERC20(daiAddress);
    DepositableERC20 wethToken = DepositableERC20(wethAddress);
    IQuoter quoter = IQuoter(uniswapV3QuoterAddress);
    IUniswapRouter uniswapRouter = IUniswapRouter(uniswapV3RouterAddress);

    event myVaultLog(string msg, uint256 ref);

    constructor(address _owner, uint256 _version) {
        version = _version;
        nextDividendTS = block.timestamp + dividendFrequency;
        owner = _owner;
        console.log("Deploying myVault Version:", version);
        console.log("Owner of myVault:", owner);
    }

    function getDaiBalance() public view returns (uint256) {
        return daiToken.balanceOf(address(this));
    }

    function getWethBalance() public view returns (uint256) {
        return wethToken.balanceOf(address(this));
    }

    function getTotalBalance() public view returns (uint256) {
        require(ethPrice > 0, "Eth price has not been set");
        require(
            block.timestamp - updatedPriceTime <= 1 days,
            "Need to get updated Eth price"
        );
        uint256 daiBalance = getDaiBalance();
        uint256 wethBalance = getWethBalance();
        uint256 wethUSD = wethBalance * ethPrice;
        uint256 totalBalance = wethUSD + daiBalance;
        return totalBalance;
    }

    function updateEthPriceUniswap() public returns (uint256) {
        uint256 ethPriceRaw = quoter.quoteExactOutputSingle(
            daiAddress,
            wethAddress,
            3000,
            100000,
            0
        );
        ethPrice = ethPriceRaw / 100000;
        updatedPriceTime = block.timestamp;
        return ethPrice;
    }

    function updteEthPriceChainlink() public returns (uint256) {
        int256 chainLinkEthPrice = EACAggregatorProxy(chainLinkETHUSDAddress)
            .latestAnswer();
        ethPrice = uint256(chainLinkEthPrice / 100000000);
        updatedPriceTime = block.timestamp;
        return ethPrice;
    }

    function buyWeth(uint256 amountUSD) internal {
        uint256 deadline = block.timestamp + 15;
        uint24 fee = 3000; //0.3% pool fee
        address recipient = address(this);
        uint256 amountIn = amountUSD; //includes 18 decimals
        uint256 amountOutMinimum = 0; // if set to zero, front runners have an easier change of getting you
        uint160 sqrtPriceLimitX96 = 0;
        emit myVaultLog("AmountIn", amountIn);
        require(
            daiToken.approve(address(uniswapV3RouterAddress), amountIn),
            "DAI approve failed"
        );
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams(
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

    function sellWeth(uint256 amountUSD) internal {
        uint256 deadline = block.timestamp + 15;
        uint24 fee = 3000;
        address recipient = address(this);
        uint256 amountOut = amountUSD; //includes 18 decimals
        uint256 amountInMaximum = 10**28;
        uint160 sqrtPriceLimitX96 = 0;
        require(
            wethToken.approve(address(uniswapV3RouterAddress), amountOut),
            "Weth Approve failed"
        );
        ISwapRouter.ExactOutputSingleParams memory params = ISwapRouter
            .ExactOutputSingleParams(
                wethAddress,
                daiAddress,
                fee,
                recipient,
                deadline,
                amountOut,
                amountInMaximum,
                sqrtPriceLimitX96
            );

        uniswapRouter.exactOutputSingle(params);
        uniswapRouter.refundETH();
    }

    function rebalance() public {
        require(msg.sender == owner, "Only the owner can rebalance");
        uint256 usdBalance = getDaiBalance();
        uint256 totalBalance = getTotalBalance();
        uint256 usdBalancePercentage = (100 * usdBalance) / totalBalance;
        emit myVaultLog("usdBalancePercentage: ", usdBalancePercentage);
        if (usdBalancePercentage < usdTargetPercentage) {
            uint256 amountToSell = (totalBalance / 100) *
                (usdTargetPercentage - usdBalancePercentage);
            emit myVaultLog("Amount to Sell", amountToSell);
            require(amountToSell > 0, "Nothing to sell");
            sellWeth(amountToSell);
        } else {
            uint256 amountToBuy = (totalBalance / 100) *
                (usdBalancePercentage - usdTargetPercentage);
            emit myVaultLog("amountToBuy", amountToBuy);
            require(amountToBuy > 0, "Nothing To Buy");
            buyWeth(amountToBuy);
        }
    }

    // 10% annual dividend from strategy.
    function annualDividend() public {
        require(msg.sender == owner, "You are not the owner");
        require(block.timestamp > nextDividendTS, "Dividend is not yet due");
        uint256 balance = getDaiBalance();
        uint256 amount = (balance * usdDividentPercentage) / 100;
        daiToken.safeTransfer(owner, amount);
        nextDividendTS = block.timestamp + dividendFrequency;
    }

    function closeAccount() public {
        require(msg.sender == owner, "Only the owner can close thier account");
        uint256 daiBalance = getDaiBalance();
        if (daiBalance > 0) {
            daiToken.safeTransfer(owner, daiBalance);
        }
        uint256 wethBalance = getWethBalance();
        if (wethBalance > 0) {
            wethToken.safeTransfer(owner, wethBalance);
        }
    }

    receive() external payable {
        //allows the contract to recieve eth.
        //fallback
    }

    function wrapETH() public {
        require(msg.sender == owner, "Only the owner can conver ETH to WETH");
        uint256 ethBalance = address(this).balance;
        require(ethBalance > 0, "No ETH available to wrap");
        emit myVaultLog("WrapETH:", ethBalance);
        wethToken.deposit{value: ethBalance}();
    }
}
