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



// // SPDX-License-Identifier: MIT

// pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

// contract BUSD is ERC20, Ownable {
//     uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens

//     constructor() ERC20("Busd", "BUSD") {}

//     function mint(address _to, uint256 _amount) external onlyOwner {
//         require(_to != address(0), "Cannot mint to zero address");
//         require(_amount > 0, "Amount must be greater than zero");
//         require(totalSupply() + _amount <= MAX_SUPPLY, "Would exceed max supply");
//         _mint(_to, _amount);
//     }
// }