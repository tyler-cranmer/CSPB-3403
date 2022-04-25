const { expect, assert } = require("chai");
const { providers } = require("ethers");
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");
const {
  experimentalAddHardhatNetworkMessageTraceHook,
} = require("hardhat/config");

describe("MultiSig Contract", () => {
  let wallet;
  let owner;
  let addr1;
  let addr2;
  before(async () => {
    await hre.run("compile");
  });
  describe("Constructor", () => {
    beforeEach(async () => {
      const contractName = "MultiSigWallet";
      [owner, addr1, addr2] = await ethers.getSigners();
      const factoryContract = await ethers.getContractFactory(contractName);
      const walletOwners = [owner.address, addr1.address, addr2.address];
      wallet = await factoryContract.deploy(walletOwners, 3);
      await wallet.deployed();
    });
    it("Should set the owners of the correct wallet owners", async () => {
      const owner1 = await wallet.owners(0);
      const owner2 = await wallet.owners(1);
      const owner3 = await wallet.owners(2);
      assert.equal(owner1, owner.address);
      assert.equal(owner2, addr1.address);
      assert.equal(owner3, addr2.address);
    });

    it("Should return the correct numConfirmationRequired to approve a transaction", async () => {
      const numConfirmationRequired = await wallet.numConfirmationRequired();
      assert.equal(numConfirmationRequired, 3);
    });

    it("Should set isOwner[owner] true for all constructor wallet owners", async () => {
      const owner1 = await wallet.isOwner(owner.address);
      const owner2 = await wallet.isOwner(addr1.address);
      const owner3 = await wallet.isOwner(addr2.address);

      assert.equal(owner1, true);
      assert.equal(owner2, true);
      assert.equal(owner3, true);
    });
  });

  describe("Contructor errors", () => {
    it("Should revert with error: owners required", async () => {
      const contractName = "MultiSigWallet";
      const factoryContract = await ethers.getContractFactory(contractName);
      const emptyWalletOwners = [];
      await expect(
        factoryContract.deploy(emptyWalletOwners, 3)
      ).to.be.revertedWith("owners required");
    });

    // _numConfirmationRequired argument set to 0;
    it("Should revert with error: invalid numConfirmationRequired for amount of owners | when _numConfirmationRequired set to 0", async () => {
      const contractName = "MultiSigWallet";
      [owner, addr1, addr2] = await ethers.getSigners();
      const factoryContract = await ethers.getContractFactory(contractName);
      const walletOwners = [owner.address, owner.address, addr2.address];
      await expect(factoryContract.deploy(walletOwners, 0)).to.be.revertedWith(
        "invalid numConfirmationRequired for amount of owners"
      );
    });
    // _numconfirmationRequired > the number of owners.
    it("Should revert with error: invalid numConfirmationRequired for amount of owners | when _numconfirmationRequired > the number of owners", async () => {
      const contractName = "MultiSigWallet";
      [owner, addr1, addr2] = await ethers.getSigners();
      const factoryContract = await ethers.getContractFactory(contractName);
      const walletOwners = [owner.address, owner.address, addr2.address];
      await expect(factoryContract.deploy(walletOwners, 4)).to.be.revertedWith(
        "invalid numConfirmationRequired for amount of owners"
      );
    });

    it("Should revert with error: owner not unique", async () => {
      const contractName = "MultiSigWallet";
      [owner, addr1, addr2] = await ethers.getSigners();
      const factoryContract = await ethers.getContractFactory(contractName);
      const walletOwners = [owner.address, owner.address, addr2.address];
      await expect(factoryContract.deploy(walletOwners, 3)).to.be.revertedWith(
        "owner not unique"
      );
    });

    it("Should revert with error: invalid owner", async () => {
      const contractName = "MultiSigWallet";
      [owner, addr1, addr2] = await ethers.getSigners();
      const badAddress = "0x0000000000000000000000000000000000000000";
      const factoryContract = await ethers.getContractFactory(contractName);
      const walletOwners = [owner.address, badAddress, addr2.address];
      await expect(factoryContract.deploy(walletOwners, 3)).to.be.revertedWith(
        "invalid owner"
      );
    });
  });

  describe("Functions", () => {
    beforeEach(async () => {
      const contractName = "MultiSigWallet";
      [owner, addr1, addr2] = await ethers.getSigners();
      const factoryContract = await ethers.getContractFactory(contractName);
      const walletOwners = [owner.address, addr1.address, addr2.address];
      wallet = await factoryContract.deploy(walletOwners, 3);
      await wallet.deployed();
    });

    //  // need to test fallback function
    // it("Should recieve ETH from sender and emit Deposit event", async () => {
    //   let tx = {
    //     from: owner.address,
    //     to: contract.address,
    //     value: ethers.utils.parseEther("1", "ether"),
    //   };
    //   const transaction = await ethers.send("ether tx", tx);
    //     await expect(transaction)
    //       .to.emit(contract, "event data")
    //       .withArgs(
    //         owner.address,
    //         ethers.utils.parseEther("1", "ether"),
    //         ethers.utils.parseEther("1", "ether")
    //       );
    //   console.log(transaction);
    
    // });
      
      it("Should create new Transaction struct once submitTransaction called", async () => {
          const to = addr1.address;
          const value = ethers.utils.parseEther("1", "ether");
          
          const submitTransaction = wallet.submitTransaction()
    })
  });
});
