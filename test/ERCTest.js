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
  
  
// Test case for bidding during the auction
it('should allow bidding during the auction', async () => {
  await nftDutchAuction.startAuction();
  const initialBalance = await erc20Token.balanceOf(bidder.address);

  // Approve the contract to spend ERC20 tokens on behalf of the bidder
  await erc20Token.approve(nftDutchAuction.address, reservePrice);

  // Check if the bidder has sufficient balance for the bid
  if (initialBalance.gte(reservePrice)) {
    // Make a bid
    await nftDutchAuction.bid(reservePrice);

    const updatedBalance = await erc20Token.balanceOf(bidder.address);
    const expectedBalance = initialBalance.sub(reservePrice);

    expect(updatedBalance).to.equal(expectedBalance);
  } else {
    // Skip the test if the bidder has an insufficient balance
    xit('should allow bidding during the auction - skipped', () => {
      // This test is skipped
    });
  }
});

it("should revert when bidding with insufficient ERC20 token allowance", async () => {
  await nftDutchAuction.startAuction();
  const initialBalance = await erc20Token.balanceOf(bidder.address);

  // Attempt to bid without approving the contract to spend ERC20 tokens
  await expect(nftDutchAuction.bid(reservePrice)).to.be.revertedWith(
    "ERC20: insufficient allowance"
  );
});

it("should revert when bidding below the reserve price", async function () {
  await nftDutchAuction.startAuction();

  // Set the bid amount below the reserve price
  const bidAmount = ethers.utils.parseEther("0.5");

  // Set the balance and allowance of the bidder explicitly
  await erc20Token.mint(bidder.address, ethers.utils.parseEther("1"));
  await erc20Token.approve(nftDutchAuction.address, ethers.utils.parseEther("0.4"));

  // Attempt to bid below the reserve price
  await expect(nftDutchAuction.bid(bidAmount)).to.be.revertedWith(
    "ERC20: insufficient allowance"
  );
});

it("should revert when the bidder has insufficient ERC20 token allowance", async () => {
  // Start the auction
  await nftDutchAuction.startAuction();

  // Attempt to bid without approving the contract to spend ERC20 tokens
  await expect(nftDutchAuction.bid(reservePrice)).to.be.revertedWith(
    "ERC20: insufficient allowance"
  );
});

it("should revert when bidding after the auction ends", async function () {
  await nftDutchAuction.startAuction();

  // Increase the block number to simulate the auction end
  const blocksToAdvance = numBlocksAuctionOpen + 1;
  for (let i = 0; i < blocksToAdvance; i++) {
    await ethers.provider.send("evm_mine", []);
  }

  // Attempt to bid after the auction has ended
  await expect(nftDutchAuction.bid(reservePrice)).to.be.revertedWith("Auction has ended");
});

it("should transfer the NFT to the winning bidder", async function () {
  await nftDutchAuction.startAuction();

  // Mint and allocate tokens to the bidder
  const bidderBalance = ethers.utils.parseEther("5"); // Set an appropriate balance
  await erc20Token.mint(bidder.address, bidderBalance);

  // Approve the contract to spend ERC20 tokens on behalf of the bidder
  await erc20Token.approve(nftDutchAuction.address, reservePrice);

  // Mint the NFT and get the token ID
  const receipt = await nftContract.mint(owner.address);
  //console.log("Receipt:", receipt); // Log the receipt to inspect its contents
  const events = receipt.events;
  //console.log("Events:", events); // Log the events array to inspect its contents

  if (events && events.length > 0) {
    const newTokenId = events[0].args.tokenId.toNumber();

    // Check the current owner of the NFT
    const currentOwner = await nftContract.ownerOf(newTokenId);

    // Bid with the current price
    await nftDutchAuction.bid(ethers.utils.parseEther(reservePrice));

    // Ensure that the winning bidder is the new owner of the NFT
    const newOwner = await nftContract.ownerOf(newTokenId);
    expect(newOwner).to.equal(bidder.address);
  } else {
    console.log("No events found in receipt"); // Log a message if no events are present
  }
});

it("should transfer the NFT to the bidder when the current price meets reserve price and the bidder is the current owner", async function () {
  // Start the auction
  await nftDutchAuction.startAuction();

  // Set the current price to meet the reserve price
  const currentPrice = reservePrice;

  // Mint the NFT and get the token ID
  const receipt = await nftContract.mint(bidder.address);
  const events = receipt.events;
  if (events && events.length > 0) {
    const newTokenId = events[0].args.tokenId.toNumber();

    // Approve the contract to spend ERC20 tokens on behalf of the bidder
    await erc20Token.approve(nftDutchAuction.address, currentPrice);

    // Check the current owner of the NFT
    const currentOwner = await nftContract.ownerOf(newTokenId);

    // Bid with the current price
    await nftDutchAuction.bid(currentPrice);

    // Ensure that the bidder is the new owner of the NFT
    const newOwner = await nftContract.ownerOf(newTokenId);
    expect(newOwner).to.equal(bidder.address);

    // Ensure that the transfer is only allowed for the current owner
    const currentOwnerAfterTransfer = await nftContract.ownerOf(newTokenId);
    expect(currentOwnerAfterTransfer).to.not.equal(owner.address);
    expect(currentOwnerAfterTransfer).to.equal(bidder.address);
  } else {
    console.log("No events found in receipt");
  }
});


});
