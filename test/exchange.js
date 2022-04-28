const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");

describe("Exchange Contract", () => {
  let exchange;
  let owner;
  let addr1;
  let addr2;
  before(async () => {
    await hre.run("compile");
  });

  beforeEach(async () => {
    const contractName = "Exchange";
    [owner, addr1, addr2] = await ethers.getSigners();
    const factoryContract = await ethers.getContractFactory(contractName);
    exchange = await factoryContract.deploy(owner.address, 10);
    await exchange.deployed();
  });

  it("Should set contructor arguments.", async () => {
    const feeAccount = await exchange.feeAccount();
    const feePercent = await exchange.feePercent();
    assert(feeAccount, owner.address);
    assert(feePercent, 10);
  });

  it("Should Deposit Ether into Ethers token mapping", async () => {
    const params = {
      value: ethers.utils.parseUnits("1", "ether"),
    };
    const ETHER = "0x0000000000000000000000000000000000000000";
    await exchange.connect(owner).depositEther(params);
    const balance = await exchange.tokens(ETHER, owner.address);
    assert(balance, params.value);
  });

  it("Should emit Deposit Event when depositing Ether", async () => {
    const params = {
      value: ethers.utils.parseUnits("1", "ether"),
    };
    const ETHER = "0x0000000000000000000000000000000000000000";

    const tx = await exchange.connect(owner).depositEther(params);
    const balance = await exchange.tokens(ETHER, owner.address);
    await expect(tx)
      .to.emit(exchange, "Deposit")
      .withArgs(
        ETHER,
        owner.address,
        ethers.utils.parseUnits("1", "ether"),
        balance
      );
  });
});

/******************************/
/** WithdrawEther function **/
/******************************/
describe("WithdrawEther Function", () => {
  let exchange;
  let owner;
  let addr1;
  before(async () => {
    await hre.run("compile");
  });

  beforeEach(async () => {
    const contractName = "Exchange";
    [owner, addr1, addr2] = await ethers.getSigners();
    const factoryContract = await ethers.getContractFactory(contractName);
    exchange = await factoryContract.deploy(owner.address, 10);
    await exchange.deployed();
    const params = {
      value: ethers.utils.parseUnits("1", "ether"),
    };
    await exchange.connect(addr1).depositEther(params);
  });

  it("Should withdraw Ether from contract", async () => {
    const ETHER = "0x0000000000000000000000000000000000000000";
    const params = {
      value: ethers.utils.parseUnits("1", "ether"),
    };
    await exchange.connect(addr1).withdrawEther(params.value);
    const balance = await exchange.connect(addr1).tokens(ETHER, addr1.address);
    assert(balance, 0);
  });

  it("Should revert with message not enough tokens", async () => {
    const ETHER = "0x0000000000000000000000000000000000000000";
    const params = {
      value: ethers.utils.parseUnits("2", "ether"),
    };

    await expect(
      exchange.connect(addr1).withdrawEther(params.value)
    ).to.be.revertedWith("Not enough tokens");
  });

  it("Should emit Withdraw event", async () => {
    const ETHER = "0x0000000000000000000000000000000000000000";
    const params = {
      value: ethers.utils.parseUnits("1", "ether"),
    };
    const tx = await exchange.connect(addr1).withdrawEther(params.value);
    const balance = await exchange.tokens(ETHER, addr1.address);
    await expect(tx)
      .to.emit(exchange, "Withdraw")
      .withArgs(
        ETHER,
        addr1.address,
        ethers.utils.parseUnits("1", "ether"),
        balance
      );
  });

  describe("depositToken", () => {
    let token;
    let exchange;
    let owner;
    let addr1;
    let addr2;
    before(async () => {
      await hre.run("compile");
    });

    beforeEach(async () => {
      const contractName = "Exchange";
      const tokenContractName = "Token";
      [owner, addr1, addr2] = await ethers.getSigners();
      const tokenFactoryContract = await ethers.getContractFactory(
        tokenContractName
      );
      const factoryContract = await ethers.getContractFactory(contractName);
      token = await tokenFactoryContract.deploy();
      exchange = await factoryContract.deploy(owner.address, 10);
      await token.deployed();
      await exchange.deployed();
    });

    it("Should deposit ERC20 tokens", async () => {
      const value = 1000;
      await token.connect(owner).approve(exchange.address, value);
      await exchange.connect(owner).depositToken(token.address, value);
      const balance = await exchange.tokens(token.address, owner.address);
      assert(balance, value);
    });

    it("Should throw error when trying to depsoit ETHER", async () => {
      const ETHER = "0x0000000000000000000000000000000000000000";
      const params = {
        value: ethers.utils.parseUnits("1", "ether"),
      };

      await expect(exchange.connect(owner).depositToken(ETHER, params.value)).to
        .be.reverted;
    });

    it("Should revert when transferFrom function is not approved", async () => {
      const tokenAddress = token.address;
      const value = 1000;

      await expect(exchange.connect(owner).depositToken(tokenAddress, value)).to
        .be.reverted;
    });

    it("Should emit Deposit Event", async () => {
      const value = 1000;
      await token.connect(owner).approve(exchange.address, value);
      const tx = await exchange
        .connect(owner)
        .depositToken(token.address, value);
      const balance = await exchange.tokens(token.address, owner.address);
      await expect(tx)
        .to.emit(exchange, "Deposit")
        .withArgs(token.address, owner.address, value, balance);
    });
  });
});
