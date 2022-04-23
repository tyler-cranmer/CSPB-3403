const credentials = require("../credentials.js");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("MyVault Contract", () => {
  let myVault;
  let owner;

  beforeEach(async () => {
    const contractName = "Vault";
    await hre.run("compile");
    [owner] = await ethers.getSigners();
    const smartContract = await ethers.getContractFactory(contractName);
    myVault = await smartContract.deploy(owner.address, 1);
    await myVault.deployed();
    console.log(`${contractName} deployed to: ${myVault.address}`);
    console.log(`Owner = ${await myVault.owner()}`);
  });

  describe("On Deployment", () => {
    it("Should return the correct constructor arguments", async () => {
      const dia = await myVault.daiAddress();
      const weth = await myVault.wethAddress();
      const quoter = await myVault.uniswapV3QuoterAddress();
      const router = await myVault.uniswapV3RouterAddress();
      const ethusd = await myVault.chainLinkETHUSDAddress();
      assert.equal(dia, credentials.daiAddress);
      assert.equal(weth, credentials.wethAddress);
      assert.equal(quoter, credentials.uinswapV3QuoterAddress);
      assert.equal(router, credentials.uinswapV3RouterAddress);
      assert.equal(ethusd, credentials.chainLinkETHUSDAddress);
    });

    it("Should return the correct version", async () => {
      const version = await myVault.version();
      assert.equal(version, 1);
    });
  });

  describe("External Functions", () => {
    it("Should return zero DAI balance", async () => {
      const daiBalance = await myVault.getDaiBalance();
      assert.equal(daiBalance, 0);
    });

    it("Should Rebalance The Portfolio", async () => {
      const accounts = await hre.ethers.getSigners();
      const owner = accounts[0];
      console.log("Transfering ET from Owner Address", owner.address);
      await owner.sendTransaction({
        to: myVault.address,
        value: ethers.utils.parseEther("0.1"),
      });
      await myVault.wrapETH();
      await myVault.updateEthPriceUniswap();
      await myVault.rebalance();

      const daiBalance = await myVault.getDaiBalance();
      console.log("Rebalanced DAI Balance", daiBalance);
      assert.isAbove(daiBalance, 0);
    });

    it("Should Rebalance The Portfolio using chainlink", async () => {
      const accounts = await hre.ethers.getSigners();
      const owner = accounts[0];
      console.log("Transfering ET from Owner Address", owner.address);
      await owner.sendTransaction({
        to: myVault.address,
        value: ethers.utils.parseEther("0.1"),
      });
      await myVault.wrapETH();
      await myVault.updteEthPriceChainlink();
      await myVault.rebalance();

      const daiBalance = await myVault.getDaiBalance();
      console.log("Rebalanced DAI Balance", daiBalance);
      assert.isAbove(daiBalance, 0);
    });
  });
});
