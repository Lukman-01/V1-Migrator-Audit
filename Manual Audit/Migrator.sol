// SPDX-License-Identifier: MIT
//@audit-info floating pragma is not adviseable, use specifc version
pragma solidity ^0.8.4;

//@audit-issue No storage gap for upgradeable contract, could cause storage collision in future upgrades
//@audit-issue Missing access control documentation and roles description
 
//@audit-issue most dependencies are deprecated or have known bug, use latest version
import "./dependencies/access/AccessControlUpgradeable.sol";
import "./dependencies/proxy/utils/Initializable.sol";
import "./dependencies/utils/math/SafeMathUpgradeable.sol";
import "./dependencies/token/ERC20/IERC20Upgradeable.sol";
import "./interfaces/IERC721Receiver.sol";
import "./interfaces/ICollectible.sol";

//@audit-info one custom error is not advisable because of ambiguity, easy identification of error
error TransactionMessage(string message);
//@audit-info solidity best practice not followed


contract Migrator is Initializable, AccessControlUpgradeable, IERC721Receiver {
    //@audit-info anything safeMath is not usefull at solidity version 0.8.0+
    using SafeMathUpgradeable for uint;

    //@audit-issue Struct not packed efficiently, could optimize gas usage by reordering fields
    //@audit-issue No validation for token decimals compatibility in struct
    struct Requirement {
        address acre;
        address plot;
        address yard;
        address acreV2;
        address plotV2;
        address yardV2;
        address tokenV1;
        address tokenV2;
        uint price;
    }

    Requirement public Requirements;
    mapping(address => uint) public lastAssetIdMinted;
    mapping(address => uint) public tokensMigrated;
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    
    //@audit-issue These state variables are never updated despite their names
    uint public totalAcreMigrated;
    uint public totalPlotMigrated;
    uint public totalYardMigrated;

    //@audit-issue Block.timestamp used in events could be manipulated by miners
    event TokenMigrationCompleted(
        address indexed user,
        address indexed token1,
        address indexed token2,
        uint amount1,
        uint amount2,
        uint date
    );

    event NFTMigrationCompleted(
        address indexed user,
        address indexed nft1,
        address indexed nft2,
        uint oldId,
        uint newId,
        uint date
    );

    event MigrationTokenSet(
        address indexed token1,
        address indexed token2,
        uint indexed price,
        uint date
    );

    //@audit-issue Initialize function can be frontrun
    //@audit-issue Missing initializationnext of crucial state variables
    function initialize() external virtual initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        Requirements.price = 1;
    }

    function _onlySigner() private view {
        if (!hasRole(SIGNER_ROLE, _msgSender())) {
            revert TransactionMessage("UnAuthorized");
        }
    }

    //@audit-issue No validation for zero address in _nft1 parameter
    //@audit-issue Missing check if NFT actually exists before transfer
    function _withdrawOldNFT(
        address _nft1,
        uint256 _tokenId
    ) private returns (bool) {
        address isSenderNftOwner = ICollectible(_nft1).ownerOf(_tokenId);
        if (isSenderNftOwner != _msgSender()) {
            revert TransactionMessage("Invalid nft owner");
        }
        bool isApproved = ICollectible(_nft1).isApprovedForAll(
            _msgSender(),
            address(this)
        );
        if (!isApproved) {
            revert TransactionMessage("Migrator doesn't have approval");
        }
        
        //@audit-issue No safeTransferFrom usage for NFT transfer
        ICollectible(_nft1).transferFrom(_msgSender(), address(this), _tokenId);
        //@audit-issue lack of transferFrom return value check, it can cause DOS attack

        return true;
    }

    //@audit-issue Unbounded loop could cause out of gas
    //@audit-issue No validation of input array length matching _quantity
    //@audit-issue Missing zero address checks for _nft1, _nft2, and _user
    function _mintNewNFT(
        address _nft1,
        address _nft2,
        address _user,
        uint _quantity,
        uint[] memory _nfts
    ) internal returns (bool result) {
        ICollectible nftObj = ICollectible(_nft2);
        //@audit-issue No check if mintAsFreeMinter succeeded
        
        nftObj.mintAsFreeMinter(_quantity);
        uint totalSupply = nftObj.totalSupply();
        uint quantityMinted;
        uint lastId = lastAssetIdMinted[_nft2];
        uint newLastMintedID;
        uint counter;
        
        //@audit-issue Potential infinite loop if totalSupply is manipulated
        for (uint index = lastId; index < totalSupply; index++) {
            if (nftObj.ownerOf(index) == address(this)) {
                quantityMinted = quantityMinted + 1;
                //@audit-issue No safeTransferFrom usage for NFT transfer
                nftObj.transferFrom(address(this), _user, index);
                //@audit-issue lack of transferFrom return value check, it can cause DOS attack
               //@audit-issue CEI pattern not followed (checks-effects-interactions), reentracy vulnerability
                newLastMintedID = index;
                emit NFTMigrationCompleted(
                    _user,
                    _nft1,
                    _nft2,
                    _nfts[counter],
                    index,
                    block.timestamp
                );
                if (quantityMinted >= _quantity) {
                    break;
                }
                counter++;
            }
        }
        lastAssetIdMinted[_nft2] = newLastMintedID;
        result = true;
    }

    //@audit-issue No reentrancy guard on token transfers
    //@audit-issue CEI pattern not followed (checks-effects-interactions)
    function migrateERC20Token(
        uint256 _amount,
        address _token1,
        address _token2
    ) external returns (bool result) {
        if (_amount == 0) {
            revert TransactionMessage("Amount is zero");
        }

        //@audit-issue Potential read-only reentrancy vulnerability in token checks
        if (Requirements.tokenV1 != _token1) {
            revert TransactionMessage("Invalid token1 address");
        }

        if (Requirements.tokenV2 != _token2) {
            revert TransactionMessage("Invalid token2 address");
        }

        if (Requirements.price == 0) {
            revert TransactionMessage("Invalid price set");
        }

        uint allowance = IERC20Upgradeable(_token1).allowance(
            _msgSender(),
            address(this)
        );

        if (_amount > allowance) {
            revert TransactionMessage("Insufficient allowance");
        }

        uint balance = IERC20Upgradeable(Requirements.tokenV1).balanceOf(
            _msgSender()
        );
        if (_amount > balance) {
            revert TransactionMessage("Insufficient balance");
        }

        //@audit-issue Possible overflow in price calculation despite SafeMath
        uint tokenBToRecieve = Requirements.price.mul(_amount);

        //@audit-issue variable reassignment not use properly and can be dangerous
        balance = IERC20Upgradeable(Requirements.tokenV2).balanceOf(
            address(this)
        );

        if (tokenBToRecieve > balance) {
            revert TransactionMessage("Insufficient token balance on migrator");
        }

        //@audit-issue No check for token blacklisting/blocking functionality
        bool success = IERC20Upgradeable(Requirements.tokenV1).transferFrom(
            _msgSender(),
            address(this),
            _amount
        );

        //Good practice by checking return value of transferFrom
        if (!success) {
            revert TransactionMessage("Transaction failed");
        }

        //@audit-issue variable reassignment not use properly and can be dangerous
        success = IERC20Upgradeable(Requirements.tokenV2).transfer(
            _msgSender(),
            _amount
        );
        if (!success) {
            revert TransactionMessage("Transaction failed");
        }
        
        //@audit-issue State changes after external calls (violates CEI)
        tokensMigrated[_token1] += _amount;
        tokensMigrated[_token2] += tokenBToRecieve;
        emit TokenMigrationCompleted(
            _msgSender(),
            Requirements.tokenV1,
            Requirements.tokenV2,
            _amount,
            tokenBToRecieve,
            block.timestamp
        );
        result = true;
    }

    //@audit-issue No maximum limit on array sizes could lead to DOS
    //@audit-issue Missing validation that arrays don't contain duplicate IDs
    function migrateAllAsset(
        uint[] memory _acre,
        uint[] memory _plot,
        uint[] memory _yard
    ) external returns (bool success) {
        uint migrateable = _acre.length + _plot.length + _yard.length;
        if (migrateable == 0) {
            revert TransactionMessage("Not enough nft to migrate");
        }

        //@audit-issue Potential DOS through large array processing
        if (_acre.length > 0) {
            for (uint i = 0; i < _acre.length; i++) {
                _withdrawOldNFT(Requirements.acre, _acre[i]);
            }
            _mintNewNFT(
                Requirements.acre,
                Requirements.acreV2,
                _msgSender(),
                _acre.length,
                _acre
            );
        }

        if (_plot.length > 0) {
            for (uint i = 0; i < _plot.length; i++) {
                _withdrawOldNFT(Requirements.plot, _plot[i]);
            }
            _mintNewNFT(
                Requirements.plot,
                Requirements.plotV2,
                _msgSender(),
                _plot.length,
                _plot
            );
        }

        if (_yard.length > 0) {
            for (uint i = 0; i < _yard.length; i++) {
                _withdrawOldNFT(Requirements.yard, _yard[i]);
            }
            _mintNewNFT(
                Requirements.yard,
                Requirements.yardV2,
                _msgSender(),
                _yard.length,
                _yard
            );
        }

        success = true;
    }

    //@audit-issue Implementation accepts any calldata without validation
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return
            bytes4(
                keccak256("onERC721Received(address,address,uint256,bytes)")
            );
    }


    //@audit-issue No timelock for critical parameter changes
    function setERC721Requirements(
        address _acre,
        address _yard,
        address _plot,
        address _acreV2,
        address _yardV2,
        address _plotV2
    ) external returns (bool success) {
        _onlySigner();
        if (_acre != address(0)) {
            Requirements.acre = _acre;
        }

        if (_yard != address(0)) {
            Requirements.yard = _yard;
        }

        if (_plot != address(0)) {
            Requirements.plot = _plot;
        }

        if (_acreV2 != address(0)) {
            Requirements.acreV2 = _acreV2;
        }

        if (_yardV2 != address(0)) {
            Requirements.yardV2 = _yardV2;
        }

        if (_plotV2 != address(0)) {
            Requirements.plotV2 = _plotV2;
        }

        success = true;

        //@audit-issue no event emmited for requirement changes
    }

    //@audit-issue Centralization risk: single signer can change critical parameters
    //@audit-issue No validation of token contract code/existence
    function setTokenInfo(
        address _tokenV1,
        address _tokenV2,
        uint _price
    ) external {
        _onlySigner();
        if (_tokenV1 != address(0)) {
            Requirements.tokenV1 = _tokenV1;
        }

        if (_tokenV2 != address(0)) {
            Requirements.tokenV2 = _tokenV2;
        }

        if (_price == 0) {
            revert TransactionMessage("Price must be above zero");
        }
        Requirements.price = _price;

        emit MigrationTokenSet(_tokenV1, _tokenV2, _price, block.timestamp);
    }
}