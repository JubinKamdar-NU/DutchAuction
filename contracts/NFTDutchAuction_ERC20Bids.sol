// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract NFTDutchAuction_ERC20BidsUpgrade is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC721Upgradeable
{
    ERC721Upgradeable public nftContract;
    uint256 public nftTokenId;
    uint256 public reservePrice;
    uint256 public numBlocksAuctionOpen;
    uint256 public offerPriceDecrement;
    uint256 public auctionEndTime;

    IERC20Upgradeable public erc20Token;

    function initialize(
        address _erc20TokenAddress,
        address _erc721TokenAddress,
        uint256 _nftTokenId,
        uint256 _reservePrice,
        uint256 _numBlocksAuctionOpen,
        uint256 _offerPriceDecrement
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        erc20Token = IERC20Upgradeable(_erc20TokenAddress);
        nftContract = ERC721Upgradeable(_erc721TokenAddress);
        nftTokenId = _nftTokenId;
        reservePrice = _reservePrice;
        numBlocksAuctionOpen = _numBlocksAuctionOpen;
        offerPriceDecrement = _offerPriceDecrement;
        auctionEndTime = 0;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    


    function startAuction() external {
        require(auctionEndTime == 0, "Auction already started");
        auctionEndTime = block.number + numBlocksAuctionOpen;
    }

    function bid(uint256 currentPrice) external {
        require(auctionEndTime > 0, "Auction not started");
        require(block.number < auctionEndTime, "Auction has ended");

        uint256 blocksRemaining = auctionEndTime - block.number - 1; // Subtract 1 to account
        uint256 decrementAmount = (offerPriceDecrement * blocksRemaining) /
            1e18;
        uint256 updatedPrice = currentPrice - decrementAmount;
        auctionEndTime = block.number + blocksRemaining;

        erc20Token.transferFrom(msg.sender, address(this), updatedPrice);
    }
}
