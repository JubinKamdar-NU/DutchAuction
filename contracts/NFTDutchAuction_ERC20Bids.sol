// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NFTDutchAuction_ERC20Bids {
    ERC721 public nftContract;
    uint256 public nftTokenId;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public auctionEndTime;

    IERC20 public erc20Token;

    constructor(
        address _erc20TokenAddress,
        address _erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) {
        erc20Token = IERC20(_erc20TokenAddress);
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

    if (_currentPrice >= reservePrice && block.number >= auctionEndTime) {
    nftContract.transferFrom(address(this), msg.sender, nftTokenId);
}

    uint256 blocksRemaining = auctionEndTime - block.number - 1; // Subtract 1 to account for the current block
    uint256 decrementAmount = (offerPriceDecrement * blocksRemaining) / 1e18;
    uint256 updatedPrice = _currentPrice - decrementAmount;
    auctionEndTime = block.number + blocksRemaining;

    erc20Token.transferFrom(msg.sender, address(this), updatedPrice);
}

}
