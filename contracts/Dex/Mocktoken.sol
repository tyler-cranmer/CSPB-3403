// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Token.sol";

contract MockToken is Token {
    function echidna_balance_under_1000() public view returns (bool) {
        return balanceOf(msg.sender) <= 1000;
    }
}
