const { expect } = require("chai");

describe("DutchAuction", function () {
  let dutchAuction;
  let seller;
  let bidder1;
  let bidder2;

  beforeEach(async function () {
    const DutchAuction = await ethers.getContractFactory("DutchAuction");
    [seller, bidder1, bidder2] = await ethers.getSigners();

    dutchAuction = await DutchAuction.deploy(1000, 10, 50);
    await dutchAuction.deployed();
  });

  it("Initialization of DUtchAuction Contract with parameters", async function () {
    expect(await dutchAuction.reservePrice()).to.equal(1000);
    expect(await dutchAuction.numBlocksAuctionOpen()).to.equal(10);
    expect(await dutchAuction.offerPriceDecrement()).to.equal(50);
    expect(await dutchAuction.initialPrice()).to.equal(1000 + 10 * 50);
    expect(await dutchAuction.auctionEnded()).to.equal(false);
    expect(await dutchAuction.highestBidder()).to.equal("0x0000000000000000000000000000000000000000");
    expect(await dutchAuction.highestBid()).to.equal(0);
  });

  it("Transfer bid to seller when bidded correctly", async function () {
    const initialPrice = await dutchAuction.initialPrice();

    await dutchAuction.connect(bidder1).bid({ value: initialPrice });
    expect(await dutchAuction.highestBidder()).to.equal(bidder1.address);
    expect(await dutchAuction.highestBid()).to.equal(initialPrice);

    expect(await dutchAuction.highestBidder()).to.equal(bidder1.address);
    expect(await dutchAuction.highestBid()).to.equal(initialPrice);

    
  });

  it("Bid too low test", async function () {
    const initialPrice = await dutchAuction.initialPrice();

    await expect(
      dutchAuction.connect(bidder1).bid({ value: initialPrice - 1 })
    ).to.be.revertedWith("Bid doesn't match requirement.");
  });

  it("Bidder2 trying to bid after the auction ended", async function () {
    const initialPrice = await dutchAuction.initialPrice();

    await dutchAuction.connect(bidder1).bid({ value: initialPrice });

    await expect(
      dutchAuction.connect(bidder2).bid({ value: initialPrice + 100 })
    ).to.be.revertedWith("Auction closed. Sorry try in the next");
  });
});
