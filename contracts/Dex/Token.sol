// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../TokenExtensions/ERC20.sol";

contract Token is ERC20 {
    constructor() ERC20("TeeWhy Token", "ty") {
        _mint(msg.sender, 100000);
    }
}
