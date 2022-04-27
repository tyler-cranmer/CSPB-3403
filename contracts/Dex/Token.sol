// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../TokenExtensions/ERC20.sol";

contract Token is ERC20 {
    constructor() ERC20("Tyler Token", "Fixed"){
        _mint(msg.sender, 100000);
    }
}