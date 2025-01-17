# README: Smart Contract Audit Report

## Overview
This repository contains a comprehensive audit of smart contracts, including manual audit reports, tool-based analysis (using Slither), unit tests, risk analysis, and recommendations for improvements. Additionally, a recorded video of the audit process is available for reference.

### Contents
The repository is organized into the following folders:
- **Audit Report**: Contains the full manual audit report detailing identified vulnerabilities and recommendations.
- **Audit Tool (Slither)**: Includes the results of the Slither static analysis tool used to scan the contracts for security issues.
- **Unit Tests**: Contains unit test scripts that validate the functionality and security of the contracts.
- **Risk Analysis & Recommendations**: Provides an in-depth risk analysis and a list of recommendations for improving the contract design and mitigating vulnerabilities.
- **Audit PPT**: Contains a PowerPoint presentation summarizing the audit findings, risk distribution, and recommendations.
- **Audit Video**: A screen recording uploaded on YouTube that documents the audit process.

## Tools and Frameworks Used
1. **Manual Audit**: A thorough review of the smart contracts was conducted manually to identify security risks, inefficiencies, and potential vulnerabilities.
2. **Slither**: A static analysis tool used to automatically detect common vulnerabilities in Solidity code.
3. **Solidity Unit Tests**: Unit tests written in Solidity to ensure the correctness of the contract logic and identify potential issues.
4. **PowerPoint**: For presenting the audit findings, risk assessments, and recommendations.
5. **Video Recording**: A screen recording of the audit process has been uploaded to YouTube for transparency and reference.

## How to Run Tests
To run the unit tests for the smart contracts, follow the steps below:

1. **Install Dependencies**:
   First, ensure that you have [Node.js](https://nodejs.org/) and [Truffle](https://www.trufflesuite.com/truffle) installed. Install the necessary dependencies:
   ```bash
   npm install
   ```

2. **Run Unit Tests**:
   Use the Truffle testing framework to run the tests:
   ```bash
   npx hardhat test
   ```

3. **Slither Static Analysis**:
   To run Slither for additional static analysis, install Slither following the [official installation guide](https://github.com/trailofbits/slither). After installation, run:
   ```bash
   slither <path-to-your-contracts-directory>

   Or

   slither . <at v1-migrator root folder to run all the contracts>
   ```

## Assumptions Made
- The contracts are written in Solidity and deployable on Ethereum or compatible chains (e.g., Binance Smart Chain, Polygon).
- The code is expected to interact with ERC20 tokens and other commonly used Ethereum standards.
- The audit assumes a production deployment scenario, so security risks related to potential attacks, performance optimizations, and gas consumption have been evaluated.

## Audit Video
The video documenting the entire audit process has been uploaded to YouTube. You can view the video via the following link:
[Audit Process Video](https://youtu.be/oyDUckd_EyA)

[Migrator Audit Video](https://youtu.be/qFxqrmh3zNE)


### Very Important Recomendation.

**Optimize all three contracts(Acre, Plot and Yard) by creating a common abstract base contract for shared functionality. This reduces redundancy, improves maintainability, and centralizes the shared logic.**

---

### **1. Abstract Base Contract**
Create an abstract contract that includes common functionality and storage variables. All three contracts can inherit this base contract and add any specific features they need.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract BaseATL is ERC721A, Ownable {
    struct Batch {
        uint256 quantity;
        uint256 price;
        bool active;
    }

    address public paymentToken;
    address public feeCollector;
    Batch public currentBatch;
    uint256 public txFeeAmount;
    uint256 public maxBuyAmount = 10;

    mapping(address => bool) public freeParticipantControllers;
    mapping(address => bool) public freeParticipant;

    event NewBatchCreated(uint256 batchStartIndex);

    constructor(string memory name, string memory symbol, address _paymentToken) ERC721A(name, symbol) {
        paymentToken = _paymentToken;
        feeCollector = msg.sender;
    }

    function _baseURI() internal view virtual override returns (string memory);

    function setBaseURI(string memory newUri) public virtual onlyOwner {
        // Implement in child contract
    }

    function mint(uint256 quantity) public virtual {
        require(currentBatch.quantity > 0, "No more tokens left to mint");
        require(currentBatch.active, "Current Batch is not active");
        require(quantity > 0, "Quantity must be greater than zero");
        require(quantity <= maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

        if (!freeParticipant[msg.sender]) {
            require(_pay(msg.sender, quantity), "Must pay minting fee");
        }

        currentBatch.quantity -= quantity;
        _safeMint(msg.sender, quantity);
    }

    function _pay(address payee, uint256 quantity) internal virtual returns (bool) {
        IERC20 token = IERC20(paymentToken);
        token.transferFrom(payee, feeCollector, currentBatch.price * quantity);
        return true;
    }

    function setCurrentBatch(uint256 quantity, uint256 price, bool active) public onlyOwner {
        require(currentBatch.quantity == 0, "Current batch not finished.");
        currentBatch = Batch(quantity, price, active);
        emit NewBatchCreated(_currentIndex);
    }

    function setCurrentBatchActive(bool active) public onlyOwner {
        currentBatch.active = active;
    }

    function setTxFee(uint256 amount) public onlyOwner {
        txFeeAmount = amount;
    }

    function setPaymentToken(address _token) public onlyOwner {
        paymentToken = _token;
    }

    function setFeeCollector(address collector) public onlyOwner {
        feeCollector = collector;
    }

    function setFreeParticipantController(address controller, bool allow) public onlyOwner {
        freeParticipantControllers[controller] = allow;
    }

    function setFreeParticipant(address participant, bool free) public onlyOwner {
        freeParticipant[participant] = free;
    }
}
```

---

### **2. Child Contracts**
Now, each child contract will inherit from `BaseATL` and implement any unique features or overrides.

#### **ATLYARD**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BaseATL.sol";

contract ATLYARD is BaseATL {
    string private baseUri = "https://sidekickfinance.mypinata.cloud/ipfs/...";

    constructor(address paymentToken) BaseATL("ATL Yard", "yATL", paymentToken) {}

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    function setBaseURI(string memory newUri) public override onlyOwner {
        baseUri = newUri;
    }
}
```

---

#### **ATLPLOT**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BaseATL.sol";

contract ATLPLOT is BaseATL {
    string private baseUri = "https://sidekickfinance.mypinata.cloud/ipfs/...";

    constructor(address paymentToken) BaseATL("ATL Plot", "pATL", paymentToken) {}

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    function setBaseURI(string memory newUri) public override onlyOwner {
        baseUri = newUri;
    }
}
```

---

#### **ATLACRE**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BaseATL.sol";

contract ATLACRE is BaseATL {
    string private baseUri = "https://sidekickfinance.mypinata.cloud/ipfs/...";
    uint256 public batchStartTokenId;

    constructor(address paymentToken) BaseATL("ATL Acre", "aATL", paymentToken) {}

    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }

    function setBaseURI(string memory newUri) public override onlyOwner {
        baseUri = newUri;
    }

    function setBatchStartTokenId(uint256 startId) public onlyOwner {
        batchStartTokenId = startId;
    }
}
```

### **3. Use Diamond Contract for Shared Logic and Customization**
---

## Conclusion
This repository provides a thorough audit of the provided smart contracts, with detailed insights into vulnerabilities and recommendations for mitigation. The tools and frameworks used ensure a high level of accuracy, while the documentation is intended to provide clear guidance on addressing the identified issues.