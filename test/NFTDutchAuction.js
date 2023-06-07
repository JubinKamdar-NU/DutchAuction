const { expect } = require("chai");

describe("NFTDutchAuction", function () {
  let nftDutchAuction;
  let nftContract;
  const ERC721TokenId = 1;
  const reservePrice = 100;
  const numBlocksAuctionOpen = 10;
  const offerPriceDecrement = 5;

  beforeEach(async function () {
    
    const MyToken = await ethers.getContractFactory("NFTContract");
    nftContract = await MyToken.deploy();

    
    const NFTDutchAuction = await ethers.getContractFactory("NFTDutchAuction");
    nftDutchAuction = await NFTDutchAuction.deploy(
      nftContract.address,
      ERC721TokenId,
      reservePrice,
      numBlocksAuctionOpen,
      offerPriceDecrement
    );

    
    await nftContract.mint(nftDutchAuction.address);
  });

  it("should start the auction", async function () {
    await nftDutchAuction.startAuction();
    const auctionEndTime = await nftDutchAuction.auctionEndTime();
    expect(auctionEndTime).to.be.above(0);
  });

  it("should transfer NFT when bid meets reserve price", async function () {
    await nftDutchAuction.startAuction();

    
    const bidAmount = reservePrice;
    await nftDutchAuction.bid(bidAmount);

   
    const owner = await nftContract.ownerOf(ERC721TokenId);
    expect(owner).to.equal(await ethers.provider.getSigner().getAddress());
  });

  it("should allow a bid higher than the current highest bid", async function () {
    await nftDutchAuction.startAuction();

    
    const reservePriceBN = ethers.utils.parseEther(reservePrice.toString());

    
    const bidAmount = reservePriceBN.add(ethers.utils.parseEther("0.5"));
    await nftDutchAuction.bid(bidAmount);
  });

  it("should not allow bidding before the auction starts", async function () {
    
    const bidAmount = 150;
    await expect(nftDutchAuction.bid(bidAmount)).to.be.revertedWith("Auction not started");
  });

  it("should not transfer NFT when bid is below the reserve price", async function () {
    await nftDutchAuction.startAuction();

    
    const bidAmount = reservePrice - 10;
    await nftDutchAuction.bid(bidAmount);


  });

  

  it("should revert if trying to start the auction again", async function () {
    await nftDutchAuction.startAuction();
    await expect(nftDutchAuction.startAuction()).to.be.revertedWith("Auction already started");
  });

  it("should allow a bid higher than the reserve price but below the time-based minimum price", async function () {
    await nftDutchAuction.startAuction();
  
    
    const maxBidAmount = reservePrice + (numBlocksAuctionOpen - 1) * offerPriceDecrement - 10;
  
   
    const bidAmount = maxBidAmount;
    await nftDutchAuction.bid(bidAmount);
  
    
    const owner = await nftContract.ownerOf(ERC721TokenId);
    expect(owner).to.equal(await ethers.provider.getSigner().getAddress());
  });
  

  it("should not allow bidding after the auction ends", async function () {
    await nftDutchAuction.startAuction();
  
   
    const auctionEndTime = await nftDutchAuction.auctionEndTime();
    const currentBlock = await ethers.provider.getBlockNumber();
    const blocksRemaining = auctionEndTime - currentBlock;
  
   
    for (let i = 0; i < blocksRemaining; i++) {
      await ethers.provider.send("evm_mine");
    }
  
    
    const bidAmount = 150;
  
    
    await expect(nftDutchAuction.bid(bidAmount)).to.be.revertedWith("Auction has ended");
  
    
    const owner = await nftContract.ownerOf(ERC721TokenId);
    expect(owner).to.equal(nftDutchAuction.address);
  });
  
  
  
  
});
