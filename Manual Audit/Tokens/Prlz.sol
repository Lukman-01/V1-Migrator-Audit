// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PRLZ is ERC20 {
    //@audit-issue Token symbol (BUSD) doesn't match contract name (PRLZ) - potentially misleading
    //@audit-issue Token name "Busd" doesn't match contract name - possible impersonation risk
    constructor() ERC20("Busd", "BUSD") {}

    //@audit-issue No access control on mint function - allows unlimited minting by any address
    //@audit-issue No maximum supply cap implementation
    //@audit-issue Missing zero address validation for _to parameter
    //@audit-issue Missing input validation for _amount
    //@audit-issue No events emitted for tracking minting operations
    function mint(address _to, uint _amount) external {
        _mint(_to, _amount);
    }
}
