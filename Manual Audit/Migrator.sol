// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./dependencies/access/AccessControlUpgradeable.sol";
import "./dependencies/proxy/utils/Initializable.sol";
import "./dependencies/utils/math/SafeMathUpgradeable.sol";
import "./dependencies/token/ERC20/IERC20Upgradeable.sol";
import "./interfaces/IERC721Receiver.sol";
import "./interfaces/ICollectible.sol";
// import "hardhat/console.sol";

error TransactionMessage(string message);

contract Migrator is Initializable, AccessControlUpgradeable, IERC721Receiver {
    using SafeMathUpgradeable for uint;
    
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
    uint public totalAcreMigrated;
    uint public totalPlotMigrated;
    uint public totalYardMigrated;
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

    function initialize() external virtual initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        Requirements.price = 1;
    }

    /**
     * @dev validates signer
     */
    function _onlySigner() private view {
        if (!hasRole(SIGNER_ROLE, _msgSender())) {
            revert TransactionMessage("UnAuthorized");
        }
    }

    /**
     * @dev this does a single migration
     */
    function _withdrawOldNFT(
        address _nft1,
        uint256 _tokenId
    ) private returns (bool) {
        //@audit-issue Lack of reentrancy guard may allow malicious calls during NFT transfer.
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
        ICollectible(_nft1).transferFrom(_msgSender(), address(this), _tokenId);

        return true;
    }

    /**
     * @dev This supports migration of data for  ERC20 Token
     */
    function _mintNewNFT(
        address _nft1,
        address _nft2,
        address _user,
        uint _quantity,
        uint[] memory _nfts
    ) internal returns (bool result) {
        ICollectible nftObj = ICollectible(_nft2);
        nftObj.mintAsFreeMinter(_quantity);
        uint totalSupply = nftObj.totalSupply();
        uint quantityMinted;
        uint lastId = lastAssetIdMinted[_nft2];
        uint newLastMintedID;
        uint counter;
        for (uint index = lastId; index < totalSupply; index++) {
            if (nftObj.ownerOf(index) == address(this)) {
                //@audit-issue Integer overflow risk when incrementing `quantityMinted`.
                quantityMinted = quantityMinted + 1;
                nftObj.transferFrom(address(this), _user, index);
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
                //@audit-issue Out-of-bounds error risk in `_nfts[counter]`.
                counter++;
            }
        }
        lastAssetIdMinted[_nft2] = newLastMintedID;
        result = true;
    }

    /**
     * @dev This supports migration of data for  ERC20 Token
     */
    function migrateERC20Token(
        uint256 _amount,
        address _token1,
        address _token2
    ) external returns (bool result) {
        //@audit-issue No check to prevent front-running in token approvals.
        if (_amount == 0) {
            revert TransactionMessage("Amount is zero");
        }

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

        //@audit-issue Incorrect calculation of `tokenBToRecieve` if `price` is not set properly.
        uint tokenBToRecieve = Requirements.price.mul(_amount);

        balance = IERC20Upgradeable(Requirements.tokenV2).balanceOf(
            address(this)
        );

        if (tokenBToRecieve > balance) {
            revert TransactionMessage("Insufficient token balance on migrator");
        }

        bool success = IERC20Upgradeable(Requirements.tokenV1).transferFrom(
            _msgSender(),
            address(this),
            _amount
        );
        if (!success) {
            revert TransactionMessage("Transaction failed");
        }
        //@audit-issue Missing reentrancy guard on token transfer back to the user, use low level call instead.
        success = IERC20Upgradeable(Requirements.tokenV2).transfer(
            _msgSender(),
            _amount
        );
        if (!success) {
            revert TransactionMessage("Transaction failed");
        }
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

    /**
     * @dev Batch Migration
     */
    function migrateAllAsset(
        uint[] memory _acre,
        uint[] memory _plot,
        uint[] memory _yard
    ) external returns (bool success) {
        //@audit-issue Lack of reentrancy protection may allow malicious nested calls.
        uint migrateable = _acre.length + _plot.length + _yard.length;
        if (migrateable == 0) {
            revert TransactionMessage("Not enough nft to migrate");
        }

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

    /**
     * @dev confirm if contract can recieve NFT
     */
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

    /**
     * @dev set the neccessary requirements
     */
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
    }

    /**
     * @dev set the neccessary erc20 requirements
     */
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
