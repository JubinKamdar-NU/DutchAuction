// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DutchAuction {
    address payable public seller;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public initialPrice;
    bool public auctionEnded;
    address public highestBidder;
    uint256 public highestBid;

    constructor(
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        seller = payable(msg.sender);
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        initialPrice = reservePrice + numBlocksAuctionOpen * offerPriceDecrement;
        auctionEnded = false;
        highestBidder = address(0);
        highestBid = 0;
    }

    function bid() public payable {
        require(!auctionEnded, "Auction closed. Sorry try in the next");
        require(msg.value >= initialPrice, "Bid doesn't match requirement.");

        auctionEnded = true;
        highestBidder = msg.sender;
        highestBid = msg.value;
        seller.transfer(highestBid);
    }
}
