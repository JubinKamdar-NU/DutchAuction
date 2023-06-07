const { expect } = require("chai");

describe("NFTDutchAuction", function () {
  let nftDutchAuction;
  let nftContract;
  const ERC721TokenId = 1;
  const reservePrice = 100;
  const numBlocksAuctionOpen = 10;
  const offerPriceDecrement = 5;

  beforeEach(async function () {
    // Deploy the ERC721 token contract
    const MyToken = await ethers.getContractFactory("NFTContract");
    nftContract = await MyToken.deploy();

    // Deploy the NFTDutchAuction contract
    const NFTDutchAuction = await ethers.getContractFactory("NFTDutchAuction");
    nftDutchAuction = await NFTDutchAuction.deploy(
      nftContract.address,
      ERC721TokenId,
      reservePrice,
      numBlocksAuctionOpen,
      offerPriceDecrement
    );

    // Mint the ERC721 token to the auction contract
    await nftContract.mint(nftDutchAuction.address);
  });

  it("should start the auction", async function () {
    await nftDutchAuction.startAuction();
    const auctionEndTime = await nftDutchAuction.auctionEndTime();
    expect(auctionEndTime).to.be.above(0);
  });

  it("should transfer NFT when bid meets reserve price", async function () {
    await nftDutchAuction.startAuction();

    // Place a bid equal to the reserve price
    const bidAmount = reservePrice;
    await nftDutchAuction.bid(bidAmount);

    // Check if the NFT is transferred to the bidder
    const owner = await nftContract.ownerOf(ERC721TokenId);
    expect(owner).to.equal(await ethers.provider.getSigner().getAddress());
  });

  it("should allow a bid higher than the current highest bid", async function () {
    await nftDutchAuction.startAuction();

    // Convert reservePrice to BigNumber
    const reservePriceBN = ethers.utils.parseEther(reservePrice.toString());

    // Place a bid higher than the reserve price
    const bidAmount = reservePriceBN.add(ethers.utils.parseEther("0.5"));
    await nftDutchAuction.bid(bidAmount);
  });

  it("should not allow bidding before the auction starts", async function () {
    // Try to place a bid before starting the auction
    const bidAmount = 150;
    await expect(nftDutchAuction.bid(bidAmount)).to.be.revertedWith("Auction not started");
  });

  it("should not transfer NFT when bid is below the reserve price", async function () {
    await nftDutchAuction.startAuction();

    // Place a bid below the reserve price
    const bidAmount = reservePrice - 10;
    await nftDutchAuction.bid(bidAmount);


  });

  

  it("should revert if trying to start the auction again", async function () {
    await nftDutchAuction.startAuction();
    await expect(nftDutchAuction.startAuction()).to.be.revertedWith("Auction already started");
  });

  it("should allow a bid higher than the reserve price but below the time-based minimum price", async function () {
    await nftDutchAuction.startAuction();
  
    // Calculate the maximum bid amount below the time-based minimum price
    const maxBidAmount = reservePrice + (numBlocksAuctionOpen - 1) * offerPriceDecrement - 10;
  
    // Place a bid within the allowed range
    const bidAmount = maxBidAmount;
    await nftDutchAuction.bid(bidAmount);
  
    // Check if the NFT is transferred to the bidder
    const owner = await nftContract.ownerOf(ERC721TokenId);
    expect(owner).to.equal(await ethers.provider.getSigner().getAddress());
  });
  

  it("should not allow bidding after the auction ends", async function () {
    await nftDutchAuction.startAuction();
  
    // Fast-forward to the end of the auction
    const auctionEndTime = await nftDutchAuction.auctionEndTime();
    const currentBlock = await ethers.provider.getBlockNumber();
    const blocksRemaining = auctionEndTime - currentBlock;
  
    // Increase the block timestamp by advancing the blocks
    for (let i = 0; i < blocksRemaining; i++) {
      await ethers.provider.send("evm_mine");
    }
  
    // Try to place a bid after the auction has ended
    const bidAmount = 150;
  
    // Attempt to place the bid and expect a revert
    await expect(nftDutchAuction.bid(bidAmount)).to.be.revertedWith("Auction has ended");
  
    // Check if the NFT is still owned by the auction contract
    const owner = await nftContract.ownerOf(ERC721TokenId);
    expect(owner).to.equal(nftDutchAuction.address);
  });
  
  
  
  
});
