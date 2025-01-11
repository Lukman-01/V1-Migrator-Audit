// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BUSD is ERC20 {
    //@audit-issue Missing access control - mint function is public and can be called by anyone
    //@audit-note Should add onlyOwner or similar access control modifier
    constructor() ERC20("Busd", "BUSD") {}

    //@audit-issue No access control on mint function - allows unlimited minting by any address
    //@audit-issue No maximum supply cap - could lead to token value dilution
    //@audit-issue Missing zero address check for _to parameter
    //@audit-issue Missing input validation for _amount parameter
    function mint(address _to, uint _amount) external {
        _mint(_to, _amount);
    }
}
