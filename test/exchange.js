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

    it("Should deposit teewhy token", async () => {
      
    });
  });
});
