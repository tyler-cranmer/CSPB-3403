const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");

describe("Exchange Contract", () => {
  let exchange;
  let owner;
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

  it("Should envoke Fallback function", async () => {
    const tx = {
      to: exchange.address,
      value: ethers.utils.parseUnits("1", "ether"),
    };
    await expect(owner.sendTransaction(tx)).to.be.revertedWith(
      "Use Deposit Ether Function"
    );
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
});

describe("depositToken Function", () => {
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
    const tx = await exchange.connect(owner).depositToken(token.address, value);
    const balance = await exchange.tokens(token.address, owner.address);
    await expect(tx)
      .to.emit(exchange, "Deposit")
      .withArgs(token.address, owner.address, value, balance);
  });

  it("Should return correct balance using balanceOf function", async () => {
    const value = 1000;
    await token.connect(owner).approve(exchange.address, value);
    await exchange.connect(owner).depositToken(token.address, value);
    const balance = exchange
      .connect(owner)
      .balanceOf(token.address, owner.address);
    assert(balance, value);
  });
});

describe("withdrawToken Function", () => {
  let token;
  let exchange;
  let owner;
  let addr1;
  let addr2;
  let value = 1000;

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
    await token.connect(owner).approve(exchange.address, value);
    await exchange.connect(owner).depositToken(token.address, value);
  });

  it("Should withdraw ERC20 tokens", async () => {
    await exchange.connect(owner).withdrawToken(token.address, value);
    const balance = exchange.tokens(token.address, owner.address);
    assert(balance, 0);
  });

  it("Should throw error when trying to withdraw Ether", async () => {
    const ETHER = "0x0000000000000000000000000000000000000000";
    await expect(
      exchange.connect(owner).withdrawToken(ETHER, owner.address)
    ).to.be.revertedWith("cannot withdraw ETHER");
  });

  it("Should emmit Withdraw event", async () => {
    const tx = await exchange
      .connect(owner)
      .withdrawToken(token.address, value);
    await expect(tx)
      .to.emit(exchange, "Withdraw")
      .withArgs(token.address, owner.address, value, 0);
  });
});

describe("Order functions", () => {
  let token;
  let exchange;
  let owner;
  let addr1;
  let value = 10000;
  let ETHER = "0x0000000000000000000000000000000000000000";
  before(async () => {
    await hre.run("compile");
  });

  beforeEach(async () => {
    const params = {
      value: ethers.utils.parseUnits("10", "ether"),
    };
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
    await token.connect(owner).approve(exchange.address, value);
    await exchange.connect(owner).depositToken(token.address, value);
    await exchange.connect(addr1).depositEther(params);
  });

  it("Should make an Order, orderCount = 1, emit Order event", async () => {
    const tokenGet = ETHER;
    const amountGet = ethers.utils.parseUnits("1", "ether");
    const tokenGive = token.address;
    const amountGive = 1000;
    const tx = await exchange
      .connect(owner)
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive);
    const orderCount = await exchange.orderCount();
    const Order = await exchange.orders(orderCount);
    assert(Order.user, owner.address, "Order.user should equal owners address");
    assert(Order.tokenGet, ETHER, "Token get should equal ETH address");
    assert(
      Order.amountGet,
      ethers.utils.parseUnits("1", "ether"),
      "amount get should be 1 ether"
    );
    assert(
      Order.tokenGive,
      token.address,
      "TokenGive should equal token.address"
    );
    assert(Order.amountGive, 1000, "Amount give should equal 1000");
    assert(orderCount, 1, "orderCount should equal 1");

    await expect(tx)
      .to.emit(exchange, "Order")
      .withArgs(
        1,
        owner.address,
        ETHER,
        ethers.utils.parseUnits("1", "ether"),
        token.address,
        1000,
        Order.timestamp
      );
  });

  it("Should cancel order", async () => {
    const tokenGet = ETHER;
    const amountGet = ethers.utils.parseUnits("1", "ether");
    const tokenGive = token.address;
    const amountGive = 1000;
    const makeOrder = await exchange
      .connect(owner)
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive);
    const orderCount = await exchange.orderCount();
    const Order = await exchange.orders(orderCount);

    const cancelOrder = await exchange.connect(owner).cancelOrder(orderCount);
    const orderCancelled = await exchange.orderCancelled(orderCount);
    const cancelTX = await cancelOrder.wait();
    assert(orderCancelled, true, "Should return true for cancelled order");

    await expect(cancelOrder).to.emit(exchange, "Cancel").withArgs(
      1,
      owner.address,
      ETHER,
      ethers.utils.parseUnits("1", "ether"),
      token.address,
      1000,
      cancelTX.events[0].args.timestamp.toString() // should be cancelOrder block.timestap, but dont know how to get it.
    );
  });
});

describe("FulFilling Orders", () => {
  let token;
  let exchange;
  let owner;
  let addr1;
  let addr2;
  let value = 10000;
  let makeOrder;
  let tokenGet;
  let amountGet;
  let tokenGive;
  let amountGive;
  let ETHER = "0x0000000000000000000000000000000000000000";

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

    const params = {
      value: ethers.utils.parseUnits("2", "ether"),
    };

    const factoryContract = await ethers.getContractFactory(contractName);
    token = await tokenFactoryContract.deploy();
    exchange = await factoryContract.deploy(addr2.address, 10);
    await token.deployed();
    await exchange.deployed();
    await token.connect(owner).approve(exchange.address, value);
    await exchange.connect(owner).depositToken(token.address, value);
    await exchange.connect(addr1).depositEther(params);

    tokenGet = ETHER;
    amountGet = ethers.utils.parseUnits("1", "ether");
    tokenGive = token.address;
    amountGive = 1000;

    makeOrder = await exchange
      .connect(owner)
      .makeOrder(tokenGet, amountGet, tokenGive, amountGive);

    // console.log(
    //   "owners ETH Balance Before Order: ",
    //   await exchange.tokens(tokenGet, owner.address)
    // );
    // console.log(
    //   "owners ERC20 Balance Before Order: ",
    //   await exchange.tokens(tokenGive, owner.address)
    // );
    // console.log(
    //   "addr1 ETH Balance Before Order: ",
    //   await exchange.tokens(tokenGet, addr1.address)
    // );
    // console.log(
    //   "addr1 ERC20 Balance Before Order: ",
    //   await exchange.tokens(tokenGive, addr1.address)
    // );

    // console.log("---------------------------------- \n");
  });

  it("Should fillOrder, set orderFilled = true, emit trade event, properly swap tokens", async () => {
    const orderCount = await exchange.orderCount();
    const Order = await exchange.orders(orderCount);
    const fillOrder = await exchange.connect(addr1).fillOrder(orderCount);
    orderedFilledBool = await exchange.orderFilled(orderCount);
    const txReceipt = await fillOrder.wait();
    const fee = (amountGet * 10) / 100;
    const ownerBalance = await exchange.tokens(tokenGet, owner.address);
    const addr1Balance = await exchange.tokens(tokenGive, addr1.address);
    const feeAccountBalance = await exchange.tokens(tokenGet, addr2.address);
    assert(orderedFilledBool, true, "The order should have been filled");
    await expect(fillOrder).to.emit(exchange, "Trade").withArgs(
      1,
      owner.address,
      tokenGet,
      amountGet,
      tokenGive,
      amountGive,
      txReceipt.events[0].args.timestamp.toString() // should be cancelOrder block.timestap, but dont know how to get it.
    );

    assert(ownerBalance, amountGet - fee, "Should have .9 Ether");
    assert(addr1Balance, amountGive, "address1 should have 1,000 erc20 tokens");
    assert(
      feeAccountBalance,
      fee,
      "fee account balance should equal fee for trade"
    );
    console.log(txReceipt.events[0].args.timestamp.toString());
  });

  it("Should revert with error Not a valid order", async () => {
    const orderId = 3;
    await expect(exchange.connect(owner).fillOrder(orderId)).to.be.revertedWith(
      "Not a valid order"
    );
  });

  it("Should revert with error Order has already been filled", async () => {
    const orderCount = await exchange.orderCount();
    const fillOrder = await exchange.connect(addr1).fillOrder(orderCount);

    await expect(
      exchange.connect(owner).fillOrder(orderCount)
    ).to.be.revertedWith("Order has already been filled");
  });

  it("Should revert with error Order has already been canceled", async () => {
    const orderCount = await exchange.orderCount();
    const cancelOrder = await exchange.connect(owner).cancelOrder(orderCount);

    await expect(
      exchange.connect(owner).fillOrder(orderCount)
    ).to.be.revertedWith("Order has already been cancelled");
  });
});

// console.log(
//   "owners Balance After filled order: ",
//   await exchange.tokens(tokenGet, owner.address)
// );
// console.log(
//   "addr1 Balance after filled order: ",
//   await exchange.tokens(tokenGive, addr1.address)
// );
