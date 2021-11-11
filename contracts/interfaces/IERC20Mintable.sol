// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
}
