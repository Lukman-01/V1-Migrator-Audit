// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ERC721A.sol";
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

//@audit-issue owner is not set
contract ATLACRE is ERC721A, Ownable {
    //@audit-issue ownable is not set
    //@audit info contract does not follow solidity best practices. Suppose be state variable first, events, constructors then functions
    constructor(address paymentToken) ERC721A("ATL Acre", "aATL") {
        //@audit-issue no validation for paymentToken address in constructor
        _paymentToken = paymentToken;
        _feeCollector = msg.sender;
        _txFeeAmount = 0;
        _maxBuyAmount = 10;
    }

    struct Batch {
        uint256 quantity;
        uint256 price;
        bool active;
    }

    //@audit-issue public state variables with underscore prefix - incorrect naming convention
    address public _paymentToken;
    address public _feeCollector;
    Batch public _currentBatch;
    uint256 _txFeeAmount;
    uint256 _maxBuyAmount;//@audit-info info wasting storage, uint8 is okay
    string private baseUri = 'https://sidekickfinance.mypinata.cloud/ipfs/QmR3JYjc8bjvjpuwJhWN38DSKZSLA9ydU67CoddWuo89J8';
    mapping (address => bool) public freeParticipantControllers;
    mapping (address => bool) public freeParticipant;

    event NewBatchCreated(uint256 batchStartIndex);
    //@audit-issue missing events for critical parameter changes (setPaymentToken, setFeeCollector, etc.)

    function _baseURI() internal view virtual override returns (string memory) {
        //@audit-issue baseUri is private but has public setter - inconsistent visibility 
        return baseUri;
    }

    function setBaseURI (string memory newUri) public onlyOwner {
        //@audit-issue missing validation for empty string
        baseUri = newUri;
        //@audit-info missing event emission
    }

    function mint(uint256 quantity) public {
        //@audit-issue critical everybody can mint token
        require(_currentBatch.quantity > 0, "No more tokens left to mint");
        require(_currentBatch.active, "Current Batch is not active");
        //@audit-info tautology, quantity already been checked
        require(quantity > 0, "Quantity must be greater than zero");
        //@audit-issue The condition quantity <= _maxBuyAmount || msg.sender == owner() does not correctly enforce the buy limit since the owner can mint unlimited tokens.
        require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

        if (!freeParticipant[msg.sender]) {
            //require msg.sender is passed into _pay
            require(_pay(msg.sender, quantity), "Must pay minting fee");
            //@audit-issue _pay does not have robust error handling, and its return value is blindly trusted.
        }

        // check enough left to mint
        _currentBatch.quantity = (_currentBatch.quantity - quantity);
        _safeMint(msg.sender, quantity);

        //@audit-info Gas optimization use custom error instead of require 
    }

    function _pay(address payee, uint256 quantity)
        internal
        virtual
        returns (bool)
    {
        //@audit-issue no check for zero address
        //@audit-issue no check for value of quantity greater than expected or zero 
        IERC20 token = IERC20(_paymentToken);
        //@audit-issue does not check if the payee is a smart contract which may cause Dos attack
        token.transferFrom(
            payee,
            _feeCollector,//@audit-issue address not payable
            _currentBatch.price * quantity
            //@audit-issue may leads to overflow
            //@audit-issue return value not checked
        );
        return true;
    }

    //@audit-info no use of this function
    function _tax(address payee) internal virtual returns (bool) {
        //@audit-issue missing zero address check for payee
        //@audit-issue no check for token contract existence
        IERC20 token = IERC20(_paymentToken);
        token.transferFrom(payee, _feeCollector, _txFeeAmount);
        //@audit-issue return value of transferFrom not checked
        return true;
    }

    function setCurrentBatch(
        uint256 quantity,
        uint256 price,
        bool active
    ) public onlyOwner {
        require(_currentBatch.quantity == 0, 'Current batch not finished.');

        _currentBatch.quantity = quantity;
        _currentBatch.active = active;
        _currentBatch.price = price;

        emit NewBatchCreated(_currentIndex);
        //@audit-info Gas optimization use custom error instead of require
    }

    function setCurrentBatchActive(bool active) public onlyOwner {
        _currentBatch.active = active;
    }

    function setTxFee(uint256 amount) public onlyOwner {
        //@audit-issue no check for amount greater than expected or zero 
        _txFeeAmount = amount;
    }

    function setPaymentToken(address token) public onlyOwner {
        //@audit-issue no check for address zero
        _paymentToken = token;
    }

    function setFeeCollector(address collector) public onlyOwner {
        //@audit-issue no check for address zero
        _feeCollector = collector;
    }
    
    function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner
    {
        freeParticipantControllers[freeParticipantController] = allow;
    }

    function setFreeParticipant(address participant, bool free) public onlyOwner
    {
        freeParticipant[participant] = free;
    }

}