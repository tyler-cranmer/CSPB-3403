const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("Factory Vault", () => {
  let vaultFactory;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  before(async () => {
    const contractName = "VaultFactory";
    await hre.run("compile");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    const sc = await ethers.getContractFactory(contractName);
    vaultFactory = await sc.deploy();
    console.log(`${contractName} deployed to: ${vaultFactory.address}`);
  });

  it("Should create two new contracts and return vault count of 2", async () => {
    const firstContract = await vaultFactory.create();
    const secondContract = await vaultFactory.create();
    let vaultNumber = await vaultFactory.vaultNumber();
    assert.equal(vaultNumber, 2);
  });
});
