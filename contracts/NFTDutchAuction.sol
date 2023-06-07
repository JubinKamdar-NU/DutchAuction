// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTDutchAuction {
    ERC721 public nftContract;
    uint256 public nftTokenId;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public auctionEndTime;

    constructor(
        address _erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        nftContract = ERC721(_erc721TokenAddress);
        nftTokenId = _nftTokenId;
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        auctionEndTime = 0;
    }

    function startAuction() external {
        require(auctionEndTime == 0, "Auction already started");
        auctionEndTime = block.number + numBlocksAuctionOpen;
    }

    function bid(uint256 _currentPrice) external {
        require(auctionEndTime > 0, "Auction not started");
        require(block.number < auctionEndTime, "Auction has ended");

        if (_currentPrice >= reservePrice && _currentPrice >= auctionEndTime - block.number) {
            
            nftContract.transferFrom(address(this), msg.sender, nftTokenId);
        }

        uint256 blocksRemaining = auctionEndTime - block.number;
        uint256 decrementAmount = offerPriceDecrement * blocksRemaining;
        uint256 updatedPrice = _currentPrice - decrementAmount;
        auctionEndTime -= offerPriceDecrement;

        
    }
}
