const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTDutchAuction_ERC20Bids", function () {
  let NFTDutchAuction_ERC20Bids;
  let NFTContract;
  let ERC20Mock;
  let nftDutchAuction;
  let nftContract;
  let erc20Token;
  let owner;
  let bidder;

  const ERC721TokenId = 1;
  const reservePrice = ethers.utils.parseEther("1"); // Convert to BigNumber
  const numBlocksAuctionOpen = 5;
  const offerPriceDecrement = ethers.utils.parseEther("0.1"); // Convert to BigNumber

  beforeEach(async function () {
    [owner, bidder] = await ethers.getSigners();

    const ERC721Mock = await ethers.getContractFactory("NFTContract");
    nftContract = await ERC721Mock.deploy();
    await nftContract.deployed();

    ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    erc20Token = await ERC20Mock.deploy("MockToken", "MOCK");
    await erc20Token.deployed();

    const NFTDutchAuction = await ethers.getContractFactory(
      "NFTDutchAuction_ERC20Bids"
    );
    nftDutchAuction = await NFTDutchAuction.deploy(
      erc20Token.address,
      nftContract.address,
      ERC721TokenId,
      reservePrice,
      numBlocksAuctionOpen,
      offerPriceDecrement
    );
    await nftDutchAuction.deployed();
  });

  it("should start the auction", async function () {
    await nftDutchAuction.startAuction();
    const auctionEndTime = await nftDutchAuction.auctionEndTime();
    expect(auctionEndTime).to.be.above(0);
  });

  it("should not allow starting the auction multiple times", async function () {
    await nftDutchAuction.startAuction();
    await expect(nftDutchAuction.startAuction()).to.be.revertedWith("Auction already started");
  });
  
  it("should not allow bidding before the auction starts", async function () {
    await expect(nftDutchAuction.bid(reservePrice)).to.be.revertedWith("Auction not started");
  });
  
  
  
});
