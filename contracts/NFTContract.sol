// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTContract is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    constructor() ERC721("NFTContract", "MET") {}

    function mint(address recipient) external returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
         _mint(recipient, newTokenId);
        return newTokenId;
    }
}