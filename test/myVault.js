const credentials = require("../credentials.js");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
// const assert = require("chai").assert;

describe("MyVault Contract", () => {
  let myVault;

  beforeEach(async () => {
    const contractName = "myVault";
    await hre.run("compile");
    const smartContract = await ethers.getContractFactory(contractName);
    myVault = await smartContract.deploy([
      credentials.daiAddress,
      credentials.wethAddress,
      credentials.uinswapV3QuoterAddress,
      credentials.uinswapV3RouterAddress,
      credentials.chainLinkETHUSDAddress,
    ]);
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
  });
});
