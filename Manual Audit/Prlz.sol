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


// // SPDX-License-Identifier: MIT

// pragma solidity ^0.8.4;

// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

// contract PRLZ is ERC20, Ownable, Pausable {
//     uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    
//     event TokensMinted(address indexed to, uint256 amount);

//     constructor() ERC20("PRLZ Token", "PRLZ") {}

//     function mint(address _to, uint256 _amount) external onlyOwner whenNotPaused {
//         require(_to != address(0), "Cannot mint to zero address");
//         require(_amount > 0, "Amount must be greater than zero");
//         require(totalSupply() + _amount <= MAX_SUPPLY, "Would exceed max supply");
        
//         _mint(_to, _amount);
//         emit TokensMinted(_to, _amount);
//     }
// }