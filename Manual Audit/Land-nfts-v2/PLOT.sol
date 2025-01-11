// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ERC721A.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

error UnAuthorized();
error InvalidParameter();
error NoMoreTokensLeft();
error CurrentBatchNotActive();
error QuantityMustBeAboveZero();
error MaxBuyAmountLimitReached();
error MustPayBeforeMinting();
error CurrentBactchNotFinished();

error TransactionFailed(string message);

contract PLOT is ERC721A, AccessControlUpgradeable {
    struct Batch {
        uint256 quantity;
        uint256 price;
        bool active;
        uint256 batch;
        uint256 startIndex;
    }

    //@audit public state variables with underscore prefix - incorrect naming convention
    address public _paymentToken;
    address public _feeCollector;
    Batch public _currentBatch;
    uint256 _txFeeAmount;
    uint256 _maxBuyAmount;
    uint public nextBatchId;
    string private baseUri;
    mapping(address => bool) public freeParticipantControllers;
    mapping(address => bool) public freeParticipant;
    mapping(uint256 => Batch) public allBatches;
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    event NewBatchCreated(uint256 batchStartIndex);
    //@audit-issue missing events for critical parameter changes (setPaymentToken, setFeeCollector, etc.)

    function initialize(address paymentToken) public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        ERC721A.ERC721A_Initialize("EVT Plot", "pEVT");
        _paymentToken = paymentToken;
        //@audit missing zero-address check for `paymentToken`
        _feeCollector = msg.sender;
        _txFeeAmount = 0;
        _maxBuyAmount = 10;
    }

    /**
     * @dev validates signer
     */
    function _onlySigner() private view {
        if (!hasRole(SIGNER_ROLE, _msgSender())) {
            revert UnAuthorized();
            //@audit-info Role verification does not handle timelocks or multisig scenarios
        }
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseUri;
    }

    function setBaseURI(string memory newUri) public {
        _onlySigner();
        //@audit-issue missing validation for empty string
        baseUri = newUri; 
        //@audit-info no event emitted for URI updates
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721A, AccessControlUpgradeable) returns (bool) {
        return ERC721A.supportsInterface(interfaceId);
    }

    function mint(uint256 quantity) public {
        if (_currentBatch.quantity <= 0) {
            revert NoMoreTokensLeft();
        }
        if (!_currentBatch.active) {
            revert CurrentBatchNotActive();
        }
        //@audit-info tautology, quantity already been checked
        if (quantity <= 0) {
            revert QuantityMustBeAboveZero();
        }

        if (quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())) {
            revert MaxBuyAmountLimitReached();
        }

        if (!freeParticipant[msg.sender]) {
            if (!_pay(msg.sender, quantity)) {
                revert MustPayBeforeMinting(); 
                //@audit payment verification relies solely on `_pay` returning `true`
            }
        }

        // Check enough tokens are available to mint
        _currentBatch.quantity = (_currentBatch.quantity - quantity); 
        //@audit unchecked subtraction might lead to underflow
        _safeMint(msg.sender, quantity);
    }

    function _pay(
        address payee,
        uint256 quantity
    ) internal virtual returns (bool) {
        //@audit missing zero-address check for `payee`
        IERC20Upgradeable token = IERC20Upgradeable(_paymentToken);
        token.transferFrom(
            payee,
            _feeCollector,
            _currentBatch.price * quantity 
            //@audit multiplication of `price` and `quantity` can overflow
        ); 
        //@audit return value of `transferFrom` is not checked
        return true; 
        //@audit function always returns `true`, even if transfer fails
    }

    //@audit-info no use of this function
    function _tax(address payee) internal virtual returns (bool) {
        IERC20Upgradeable token = IERC20Upgradeable(_paymentToken);
        token.transferFrom(payee, _feeCollector, _txFeeAmount); 
        //@audit return value of `transferFrom` is not checked
        return true;
    }

    function setCurrentBatch(
        uint256 quantity,
        uint256 price,
        bool active
    ) public {
        _onlySigner();
        if (_currentBatch.quantity > 0) {
            revert CurrentBactchNotFinished();
        }
        _currentBatch.quantity = quantity;
        _currentBatch.active = active;
        _currentBatch.price = price;
        _currentBatch.batch = nextBatchId;
        _currentBatch.startIndex = _currentIndex;
        allBatches[nextBatchId] = _currentBatch;
        nextBatchId += 1; 
        //@audit unchecked increment of `nextBatchId`
        emit NewBatchCreated(_currentIndex); 
        //@audit event does not log critical batch parameters
    }

    function setCurrentBatchActive(bool active) public {
        _onlySigner();
        _currentBatch.active = active;
    }

    function setTxFee(uint256 amount) public {
        _onlySigner();
        _txFeeAmount = amount; 
        //@audit no event emitted for fee updates
    }

    function setPaymentToken(address token) public {
        _onlySigner();
        _paymentToken = token; 
        //@audit missing zero-address check
    }

    function setFeeCollector(address collector) public {
        _onlySigner();
        _feeCollector = collector; 
        //@audit missing zero-address check
    }

    function setFreeParticipantController(
        address freeParticipantController,
        bool allow
    ) public {
        _onlySigner();
        freeParticipantControllers[freeParticipantController] = allow; 
        //@audit no event emitted for updates to controllers
    }

    function setFreeParticipant(address participant, bool free) public {
        _onlySigner();
        freeParticipant[participant] = free; 
        //@audit no event emitted for updates to participants
    }

    function mintAsFreeMinter(uint256 quantity) public {
        if (_currentBatch.quantity <= 0) {
            revert TransactionFailed("NoMoreTokensLeft");
        }
        if (!_currentBatch.active) {
            revert TransactionFailed("CurrentBatchNotActive");
        }
        if (quantity <= 0) {
            revert TransactionFailed("QuantityMustBeAboveZero");
        }

        if (quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())) {
            revert TransactionFailed("MaxBuyAmountLimitReached");
        }

        if (!freeParticipant[_msgSender()]) {
            revert TransactionFailed("MustBeAFreeMinter");
        }

        _currentBatch.quantity = (_currentBatch.quantity - quantity); 
        //@audit unchecked subtraction might lead to underflow
        _safeMint(_msgSender(), quantity);
    }
}
