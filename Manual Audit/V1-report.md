# Report


## Gas Optimizations


| |Issue|Instances|
|-|:-|:-:|
| [GAS-1](#GAS-1) | Using bools for storage incurs overhead | 6 |
| [GAS-2](#GAS-2) | Use calldata instead of memory for function arguments that do not get mutated | 2 |
| [GAS-3](#GAS-3) | For Operations that will not overflow, you could use unchecked | 20 |
| [GAS-4](#GAS-4) | Use Custom Errors instead of Revert Strings to save Gas | 15 |
| [GAS-5](#GAS-5) | State variables only set in the constructor should be declared `immutable` | 3 |
| [GAS-6](#GAS-6) | Functions guaranteed to revert when called by normal users can be marked `payable` | 20 |
| [GAS-7](#GAS-7) | Use != 0 instead of > 0 for unsigned integer comparison | 6 |
### <a name="GAS-1"></a>[GAS-1] Using bools for storage incurs overhead
Use uint256(1) and uint256(2) for true/false to avoid a Gwarmaccess (100 gas), and to avoid Gsset (20000 gas) when changing from ‘false’ to ‘true’, after having been ‘true’ in the past. See [source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/58f635312aa21f947cae5f8578638a85aa2519f5/contracts/security/ReentrancyGuard.sol#L23-L27).

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

31:     mapping (address => bool) public freeParticipantControllers;

32:     mapping (address => bool) public freeParticipant;

```

```solidity
File: land-nfts/PLOT.sol

27:     mapping (address => bool) public freeParticipantControllers;

28:     mapping (address => bool) public freeParticipant;

```

```solidity
File: land-nfts/YARD.sol

28:     mapping (address => bool) public freeParticipantControllers;

29:     mapping (address => bool) public freeParticipant;

```

### <a name="GAS-2"></a>[GAS-2] Use calldata instead of memory for function arguments that do not get mutated
When a function with a `memory` array is called externally, the `abi.decode()` step has to use a for-loop to copy each index of the `calldata` to the `memory` index. Each iteration of this for-loop costs at least 60 gas (i.e. `60 * <mem_array>.length`). Using `calldata` directly bypasses this loop. 

If the array is passed to an `internal` function which passes the array to another internal function where the array is modified and therefore `memory` is used in the `external` call, it's still more gas-efficient to use `calldata` when the `external` function uses modifiers, since the modifiers may prevent the internal functions from being called. Structs have the same overhead as an array of length one. 

 *Saves 60 gas per instance*

*Instances (2)*:
```solidity
File: land-nfts/ACRE.sol

40:     function setBaseURI (string memory newUri) public onlyOwner {

```

```solidity
File: land-nfts/YARD.sol

37:     function setBaseURI (string memory newUri) public onlyOwner {

```

### <a name="GAS-3"></a>[GAS-3] For Operations that will not overflow, you could use unchecked

*Instances (20)*:
```solidity
File: land-nfts/ACRE.sol

4: import "../../src/ERC721/ERC721A.sol";

5: import '@openzeppelin/contracts/access/Ownable.sol';

6: import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

29:     uint256 _maxBuyAmount;//@audit-info info wasting memory uint8 is okay

30:     string private baseUri = 'https://sidekickfinance.mypinata.cloud/ipfs/QmR3JYjc8bjvjpuwJhWN38DSKZSLA9ydU67CoddWuo89J8';

60:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

75:             _feeCollector,//@audit-issue address not payable

76:             _currentBatch.price * quantity

```

```solidity
File: land-nfts/PLOT.sol

4: import "../../src/ERC721/ERC721A.sol";

5: import '@openzeppelin/contracts/access/Ownable.sol';

6: import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

33:         return 'https://sidekickfinance.mypinata.cloud/ipfs/QmSG7SsDgMkXRA8ySWxder9tQYRKgXvT1Dmh9sStqM1huG';

48:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

61:             _currentBatch.price * quantity

```

```solidity
File: land-nfts/YARD.sol

4: import "../../src/ERC721/ERC721A.sol";

5: import '@openzeppelin/contracts/access/Ownable.sol';

6: import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

27:     string private baseUri = 'https://sidekickfinance.mypinata.cloud/ipfs/QmVRVjmmK5bDJdpSXAyZ4iqQsR5q7w4tyDPTqhV21UiYTM';

53:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

66:             _currentBatch.price * quantity

```

### <a name="GAS-4"></a>[GAS-4] Use Custom Errors instead of Revert Strings to save Gas
Custom errors are available from solidity version 0.8.4. Custom errors save [**~50 gas**](https://gist.github.com/IllIllI000/ad1bd0d29a0101b25e57c293b4b0c746) each time they're hit by [avoiding having to allocate and store the revert string](https://blog.soliditylang.org/2021/04/21/custom-errors/#errors-in-depth). Not defining the strings also save deployment gas

Additionally, custom errors can be used inside and outside of contracts (including interfaces and libraries).

Source: <https://blog.soliditylang.org/2021/04/21/custom-errors/>:

> Starting from [Solidity v0.8.4](https://github.com/ethereum/solidity/releases/tag/v0.8.4), there is a convenient and gas-efficient way to explain to users why an operation failed through the use of custom errors. Until now, you could already use strings to give more information about failures (e.g., `revert("Insufficient funds.");`), but they are rather expensive, especially when it comes to deploy cost, and it is difficult to use dynamic information in them.

Consider replacing **all revert strings** with custom errors in the solution, and particularly those that have multiple occurrences:

*Instances (15)*:
```solidity
File: land-nfts/ACRE.sol

46:         require(_currentBatch.quantity > 0, "No more tokens left to mint");

47:         require(_currentBatch.active, "Current Batch is not active");

49:         require(quantity > 0, "Quantity must be greater than zero");

51:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

56:             require(_pay(msg.sender, quantity), "Must pay minting fee");

```

```solidity
File: land-nfts/PLOT.sol

37:         require(_currentBatch.quantity > 0, "No more tokens left to mint");

38:         require(_currentBatch.active, "Current Batch is not active");

39:         require(quantity > 0, "Quantity must be greater than zero");

40:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

44:             require(_pay(msg.sender, quantity), "Must pay minting fee");

```

```solidity
File: land-nfts/YARD.sol

42:         require(_currentBatch.quantity > 0, "No more tokens left to mint");

43:         require(_currentBatch.active, "Current Batch is not active");

44:         require(quantity > 0, "Quantity must be greater than zero");

45:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

49:             require(_pay(msg.sender, quantity), "Must pay minting fee");

```

### <a name="GAS-5"></a>[GAS-5] State variables only set in the constructor should be declared `immutable`
Variables only set in the constructor and never edited afterwards should be marked as immutable, as it would avoid the expensive storage-writing operation in the constructor (around **20 000 gas** per variable) and replace the expensive storage-reading operations (around **2100 gas** per reading) to a less expensive value reading (**3 gas**)

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

16:         _maxBuyAmount = 10;

```

```solidity
File: land-nfts/PLOT.sol

13:         _maxBuyAmount = 10;

```

```solidity
File: land-nfts/YARD.sol

13:         _maxBuyAmount = 10;

```

### <a name="GAS-6"></a>[GAS-6] Functions guaranteed to revert when called by normal users can be marked `payable`
If a function modifier such as `onlyOwner` is used, the function will revert if a normal user tries to pay the function. Marking the function as `payable` will lower the gas cost for legitimate callers because the compiler will not include checks for whether a payment was provided.

*Instances (20)*:
```solidity
File: land-nfts/ACRE.sol

40:     function setBaseURI (string memory newUri) public onlyOwner {

104:     function setCurrentBatchActive(bool active) public onlyOwner {

108:     function setTxFee(uint256 amount) public onlyOwner {

113:     function setPaymentToken(address token) public onlyOwner {

118:     function setFeeCollector(address collector) public onlyOwner {

123:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

128:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

```solidity
File: land-nfts/PLOT.sol

86:     function setCurrentBatchActive(bool active) public onlyOwner {

90:     function setTxFee(uint256 amount) public onlyOwner {

94:     function setPaymentToken(address token) public onlyOwner {

98:     function setFeeCollector(address collector) public onlyOwner {

102:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

107:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

```solidity
File: land-nfts/YARD.sol

37:     function setBaseURI (string memory newUri) public onlyOwner {

91:     function setCurrentBatchActive(bool active) public onlyOwner {

95:     function setTxFee(uint256 amount) public onlyOwner {

99:     function setPaymentToken(address token) public onlyOwner {

103:     function setFeeCollector(address collector) public onlyOwner {

107:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

112:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

### <a name="GAS-7"></a>[GAS-7] Use != 0 instead of > 0 for unsigned integer comparison

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

46:         require(_currentBatch.quantity > 0, "No more tokens left to mint");

49:         require(quantity > 0, "Quantity must be greater than zero");

```

```solidity
File: land-nfts/PLOT.sol

37:         require(_currentBatch.quantity > 0, "No more tokens left to mint");

39:         require(quantity > 0, "Quantity must be greater than zero");

```

```solidity
File: land-nfts/YARD.sol

42:         require(_currentBatch.quantity > 0, "No more tokens left to mint");

44:         require(quantity > 0, "Quantity must be greater than zero");

```


## Non Critical Issues


| |Issue|Instances|
|-|:-|:-:|
| [NC-1](#NC-1) | Missing checks for `address(0)` when assigning values to address state variables | 9 |
| [NC-2](#NC-2) | `constant`s should be defined rather than using magic numbers | 3 |
| [NC-3](#NC-3) | Consider disabling `renounceOwnership()` | 3 |
| [NC-4](#NC-4) | Function ordering does not follow the Solidity style guide | 3 |
| [NC-5](#NC-5) | Functions should not be longer than 50 lines | 26 |
| [NC-6](#NC-6) | Lack of checks in setters | 20 |
| [NC-7](#NC-7) | `mapping` definitions do not follow the Solidity Style Guide | 6 |
| [NC-8](#NC-8) | Missing Event for critical parameters change | 23 |
| [NC-9](#NC-9) | NatSpec is completely non-existent on functions that should have them | 26 |
| [NC-10](#NC-10) | Use a `modifier` instead of a `require/if` statement for a special `msg.sender` actor | 9 |
| [NC-11](#NC-11) | Strings should use double quotes rather than single quotes | 6 |
| [NC-12](#NC-12) | Contract does not follow the Solidity style guide's suggested layout ordering | 3 |
| [NC-13](#NC-13) | Internal and private variables and functions names should begin with an underscore | 2 |
| [NC-14](#NC-14) | `public` functions not called by the contract should be declared `external` instead | 26 |
### <a name="NC-1"></a>[NC-1] Missing checks for `address(0)` when assigning values to address state variables

*Instances (9)*:
```solidity
File: land-nfts/ACRE.sol

13:         _paymentToken = paymentToken;

115:         _paymentToken = token;

120:         _feeCollector = collector;

```

```solidity
File: land-nfts/PLOT.sol

10:         _paymentToken = paymentToken;

95:         _paymentToken = token;

99:         _feeCollector = collector;

```

```solidity
File: land-nfts/YARD.sol

10:         _paymentToken = paymentToken;

100:         _paymentToken = token;

104:         _feeCollector = collector;

```

### <a name="NC-2"></a>[NC-2] `constant`s should be defined rather than using magic numbers
Even [assembly](https://github.com/code-423n4/2022-05-opensea-seaport/blob/9d7ce4d08bf3c3010304a0476a785c70c0e90ae7/contracts/lib/TokenTransferrer.sol#L35-L39) can benefit from using readable constants instead of hex/numeric literals

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

16:         _maxBuyAmount = 10;

```

```solidity
File: land-nfts/PLOT.sol

13:         _maxBuyAmount = 10;

```

```solidity
File: land-nfts/YARD.sol

13:         _maxBuyAmount = 10;

```

### <a name="NC-3"></a>[NC-3] Consider disabling `renounceOwnership()`
If the plan for your project does not include eventually giving up all ownership control, consider overwriting OpenZeppelin's `Ownable`'s `renounceOwnership()` function in order to disable it.

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

9: contract ATLACRE is ERC721A, Ownable(msg.sender) {

```

```solidity
File: land-nfts/PLOT.sol

8: contract ATLPLOT is ERC721A, Ownable(msg.sender) {

```

```solidity
File: land-nfts/YARD.sol

8: contract ATLYARD is ERC721A, Ownable(msg.sender) {

```

### <a name="NC-4"></a>[NC-4] Function ordering does not follow the Solidity style guide
According to the [Solidity style guide](https://docs.soliditylang.org/en/v0.8.17/style-guide.html#order-of-functions), functions should be laid out in the following order :`constructor()`, `receive()`, `fallback()`, `external`, `public`, `internal`, `private`, but the cases below do not follow this pattern

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

1: 
   Current order:
   internal _baseURI
   public setBaseURI
   public mint
   internal _pay
   internal _tax
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   
   Suggested order:
   public setBaseURI
   public mint
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   internal _baseURI
   internal _pay
   internal _tax

```

```solidity
File: land-nfts/PLOT.sol

1: 
   Current order:
   internal _baseURI
   public mint
   internal _pay
   internal _tax
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   
   Suggested order:
   public mint
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   internal _baseURI
   internal _pay
   internal _tax

```

```solidity
File: land-nfts/YARD.sol

1: 
   Current order:
   internal _baseURI
   public setBaseURI
   public mint
   internal _pay
   internal _tax
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   
   Suggested order:
   public setBaseURI
   public mint
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   internal _baseURI
   internal _pay
   internal _tax

```

### <a name="NC-5"></a>[NC-5] Functions should not be longer than 50 lines
Overly complex code can make understanding functionality more difficult, try to further modularize your code to ensure readability 

*Instances (26)*:
```solidity
File: land-nfts/ACRE.sol

36:     function _baseURI() internal view virtual override returns (string memory) { 

40:     function setBaseURI (string memory newUri) public onlyOwner {

82:     function _tax(address payee) internal virtual returns (bool) {

104:     function setCurrentBatchActive(bool active) public onlyOwner {

108:     function setTxFee(uint256 amount) public onlyOwner {

113:     function setPaymentToken(address token) public onlyOwner {

118:     function setFeeCollector(address collector) public onlyOwner {

123:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

128:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

```solidity
File: land-nfts/PLOT.sol

32:     function _baseURI() internal view virtual override returns (string memory) { 

66:     function _tax(address payee) internal virtual returns (bool) {

86:     function setCurrentBatchActive(bool active) public onlyOwner {

90:     function setTxFee(uint256 amount) public onlyOwner {

94:     function setPaymentToken(address token) public onlyOwner {

98:     function setFeeCollector(address collector) public onlyOwner {

102:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

107:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

```solidity
File: land-nfts/YARD.sol

33:     function _baseURI() internal view virtual override returns (string memory) { 

37:     function setBaseURI (string memory newUri) public onlyOwner {

71:     function _tax(address payee) internal virtual returns (bool) {

91:     function setCurrentBatchActive(bool active) public onlyOwner {

95:     function setTxFee(uint256 amount) public onlyOwner {

99:     function setPaymentToken(address token) public onlyOwner {

103:     function setFeeCollector(address collector) public onlyOwner {

107:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

112:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

### <a name="NC-6"></a>[NC-6] Lack of checks in setters
Be it sanity checks (like checks against `0`-values) or initial setting checks: it's best for Setter functions to have them

*Instances (20)*:
```solidity
File: land-nfts/ACRE.sol

40:     function setBaseURI (string memory newUri) public onlyOwner {
            baseUri = newUri;

104:     function setCurrentBatchActive(bool active) public onlyOwner {
             _currentBatch.active = active;

108:     function setTxFee(uint256 amount) public onlyOwner {
             //@audit-issue no check for amount greater than expected or zero 
             _txFeeAmount = amount;

113:     function setPaymentToken(address token) public onlyOwner {
             //@audit-issue no check for address zero
             _paymentToken = token;

118:     function setFeeCollector(address collector) public onlyOwner {
             //@audit-issue no check for address zero
             _feeCollector = collector;

123:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner
         {
             freeParticipantControllers[freeParticipantController] = allow;

128:     function setFreeParticipant(address participant, bool free) public onlyOwner
         {
             freeParticipant[participant] = free;

```

```solidity
File: land-nfts/PLOT.sol

86:     function setCurrentBatchActive(bool active) public onlyOwner {
            _currentBatch.active = active;

90:     function setTxFee(uint256 amount) public onlyOwner {
            _txFeeAmount = amount;

94:     function setPaymentToken(address token) public onlyOwner {
            _paymentToken = token;

98:     function setFeeCollector(address collector) public onlyOwner {
            _feeCollector = collector;

102:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner
         {
             freeParticipantControllers[freeParticipantController] = allow;

107:     function setFreeParticipant(address participant, bool free) public onlyOwner
         {
             freeParticipant[participant] = free;

```

```solidity
File: land-nfts/YARD.sol

37:     function setBaseURI (string memory newUri) public onlyOwner {
            baseUri = newUri;

91:     function setCurrentBatchActive(bool active) public onlyOwner {
            _currentBatch.active = active;

95:     function setTxFee(uint256 amount) public onlyOwner {
            _txFeeAmount = amount;

99:     function setPaymentToken(address token) public onlyOwner {
            _paymentToken = token;

103:     function setFeeCollector(address collector) public onlyOwner {
             _feeCollector = collector;

107:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner
         {
             freeParticipantControllers[freeParticipantController] = allow;

112:     function setFreeParticipant(address participant, bool free) public onlyOwner
         {
             freeParticipant[participant] = free;

```

### <a name="NC-7"></a>[NC-7] `mapping` definitions do not follow the Solidity Style Guide
See the [mappings](https://docs.soliditylang.org/en/latest/style-guide.html#mappings) section of the Solidity Style Guide

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

31:     mapping (address => bool) public freeParticipantControllers;

32:     mapping (address => bool) public freeParticipant;

```

```solidity
File: land-nfts/PLOT.sol

27:     mapping (address => bool) public freeParticipantControllers;

28:     mapping (address => bool) public freeParticipant;

```

```solidity
File: land-nfts/YARD.sol

28:     mapping (address => bool) public freeParticipantControllers;

29:     mapping (address => bool) public freeParticipant;

```

### <a name="NC-8"></a>[NC-8] Missing Event for critical parameters change
Events help non-contract tools to track changes, and events prevent users from being surprised by changes.

*Instances (23)*:
```solidity
File: land-nfts/ACRE.sol

40:     function setBaseURI (string memory newUri) public onlyOwner {
            baseUri = newUri;

89:     function setCurrentBatch(
            uint256 quantity,
            uint256 price,
            bool active
        ) public onlyOwner {
            require(_currentBatch.quantity == 0, 'Current batch not finished.');
    
            _currentBatch.quantity = quantity;
            _currentBatch.active = active;
            _currentBatch.price = price;

104:     function setCurrentBatchActive(bool active) public onlyOwner {
             _currentBatch.active = active;

108:     function setTxFee(uint256 amount) public onlyOwner {
             //@audit-issue no check for amount greater than expected or zero 
             _txFeeAmount = amount;

113:     function setPaymentToken(address token) public onlyOwner {
             //@audit-issue no check for address zero
             _paymentToken = token;

118:     function setFeeCollector(address collector) public onlyOwner {
             //@audit-issue no check for address zero
             _feeCollector = collector;

123:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner
         {
             freeParticipantControllers[freeParticipantController] = allow;

128:     function setFreeParticipant(address participant, bool free) public onlyOwner
         {
             freeParticipant[participant] = free;

```

```solidity
File: land-nfts/PLOT.sol

72:     function setCurrentBatch(
            uint256 quantity,
            uint256 price,
            bool active
        ) public onlyOwner {
            require(_currentBatch.quantity == 0, 'Current batch not finished.');
    
            _currentBatch.quantity = quantity;
            _currentBatch.active = active;
            _currentBatch.price = price;

86:     function setCurrentBatchActive(bool active) public onlyOwner {
            _currentBatch.active = active;

90:     function setTxFee(uint256 amount) public onlyOwner {
            _txFeeAmount = amount;

94:     function setPaymentToken(address token) public onlyOwner {
            _paymentToken = token;

98:     function setFeeCollector(address collector) public onlyOwner {
            _feeCollector = collector;

102:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner
         {
             freeParticipantControllers[freeParticipantController] = allow;

107:     function setFreeParticipant(address participant, bool free) public onlyOwner
         {
             freeParticipant[participant] = free;

```

```solidity
File: land-nfts/YARD.sol

37:     function setBaseURI (string memory newUri) public onlyOwner {
            baseUri = newUri;

77:     function setCurrentBatch(
            uint256 quantity,
            uint256 price,
            bool active
        ) public onlyOwner {
            require(_currentBatch.quantity == 0, 'Current batch not finished.');
    
            _currentBatch.quantity = quantity;
            _currentBatch.active = active;
            _currentBatch.price = price;

91:     function setCurrentBatchActive(bool active) public onlyOwner {
            _currentBatch.active = active;

95:     function setTxFee(uint256 amount) public onlyOwner {
            _txFeeAmount = amount;

99:     function setPaymentToken(address token) public onlyOwner {
            _paymentToken = token;

103:     function setFeeCollector(address collector) public onlyOwner {
             _feeCollector = collector;

107:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner
         {
             freeParticipantControllers[freeParticipantController] = allow;

112:     function setFreeParticipant(address participant, bool free) public onlyOwner
         {
             freeParticipant[participant] = free;

```

### <a name="NC-9"></a>[NC-9] NatSpec is completely non-existent on functions that should have them
Public and external functions that aren't view or pure should have NatSpec comments

*Instances (26)*:
```solidity
File: land-nfts/ACRE.sol

40:     function setBaseURI (string memory newUri) public onlyOwner {

44:     function mint(uint256 quantity) public {

89:     function setCurrentBatch(

104:     function setCurrentBatchActive(bool active) public onlyOwner {

108:     function setTxFee(uint256 amount) public onlyOwner {

113:     function setPaymentToken(address token) public onlyOwner {

118:     function setFeeCollector(address collector) public onlyOwner {

123:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

128:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

```solidity
File: land-nfts/PLOT.sol

36:     function mint(uint256 quantity) public {

72:     function setCurrentBatch(

86:     function setCurrentBatchActive(bool active) public onlyOwner {

90:     function setTxFee(uint256 amount) public onlyOwner {

94:     function setPaymentToken(address token) public onlyOwner {

98:     function setFeeCollector(address collector) public onlyOwner {

102:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

107:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

```solidity
File: land-nfts/YARD.sol

37:     function setBaseURI (string memory newUri) public onlyOwner {

41:     function mint(uint256 quantity) public {

77:     function setCurrentBatch(

91:     function setCurrentBatchActive(bool active) public onlyOwner {

95:     function setTxFee(uint256 amount) public onlyOwner {

99:     function setPaymentToken(address token) public onlyOwner {

103:     function setFeeCollector(address collector) public onlyOwner {

107:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

112:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

### <a name="NC-10"></a>[NC-10] Use a `modifier` instead of a `require/if` statement for a special `msg.sender` actor
If a function is supposed to be access-controlled, a `modifier` should be used instead of a `require/if` statement for more readability.

*Instances (9)*:
```solidity
File: land-nfts/ACRE.sol

51:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

53:         if (!freeParticipant[msg.sender]) {

56:             require(_pay(msg.sender, quantity), "Must pay minting fee");

```

```solidity
File: land-nfts/PLOT.sol

40:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

42:         if (!freeParticipant[msg.sender]) {

44:             require(_pay(msg.sender, quantity), "Must pay minting fee");

```

```solidity
File: land-nfts/YARD.sol

45:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

47:         if (!freeParticipant[msg.sender]) {

49:             require(_pay(msg.sender, quantity), "Must pay minting fee");

```

### <a name="NC-11"></a>[NC-11] Strings should use double quotes rather than single quotes
See the Solidity Style Guide: https://docs.soliditylang.org/en/v0.8.20/style-guide.html#other-recommendations

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

30:     string private baseUri = 'https://sidekickfinance.mypinata.cloud/ipfs/QmR3JYjc8bjvjpuwJhWN38DSKZSLA9ydU67CoddWuo89J8';

94:         require(_currentBatch.quantity == 0, 'Current batch not finished.');

```

```solidity
File: land-nfts/PLOT.sol

33:         return 'https://sidekickfinance.mypinata.cloud/ipfs/QmSG7SsDgMkXRA8ySWxder9tQYRKgXvT1Dmh9sStqM1huG';

77:         require(_currentBatch.quantity == 0, 'Current batch not finished.');

```

```solidity
File: land-nfts/YARD.sol

27:     string private baseUri = 'https://sidekickfinance.mypinata.cloud/ipfs/QmVRVjmmK5bDJdpSXAyZ4iqQsR5q7w4tyDPTqhV21UiYTM';

82:         require(_currentBatch.quantity == 0, 'Current batch not finished.');

```

### <a name="NC-12"></a>[NC-12] Contract does not follow the Solidity style guide's suggested layout ordering
The [style guide](https://docs.soliditylang.org/en/v0.8.16/style-guide.html#order-of-layout) says that, within a contract, the ordering should be:

1) Type declarations
2) State variables
3) Events
4) Modifiers
5) Functions

However, the contract(s) below do not follow this ordering

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

1: 
   Current order:
   FunctionDefinition.constructor
   StructDefinition.Batch
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.mint
   FunctionDefinition._pay
   FunctionDefinition._tax
   FunctionDefinition.setCurrentBatch
   FunctionDefinition.setCurrentBatchActive
   FunctionDefinition.setTxFee
   FunctionDefinition.setPaymentToken
   FunctionDefinition.setFeeCollector
   FunctionDefinition.setFreeParticipantController
   FunctionDefinition.setFreeParticipant
   
   Suggested order:
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   StructDefinition.Batch
   FunctionDefinition.constructor
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.mint
   FunctionDefinition._pay
   FunctionDefinition._tax
   FunctionDefinition.setCurrentBatch
   FunctionDefinition.setCurrentBatchActive
   FunctionDefinition.setTxFee
   FunctionDefinition.setPaymentToken
   FunctionDefinition.setFeeCollector
   FunctionDefinition.setFreeParticipantController
   FunctionDefinition.setFreeParticipant

```

```solidity
File: land-nfts/PLOT.sol

1: 
   Current order:
   FunctionDefinition.constructor
   StructDefinition.Batch
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   FunctionDefinition._baseURI
   FunctionDefinition.mint
   FunctionDefinition._pay
   FunctionDefinition._tax
   FunctionDefinition.setCurrentBatch
   FunctionDefinition.setCurrentBatchActive
   FunctionDefinition.setTxFee
   FunctionDefinition.setPaymentToken
   FunctionDefinition.setFeeCollector
   FunctionDefinition.setFreeParticipantController
   FunctionDefinition.setFreeParticipant
   
   Suggested order:
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   StructDefinition.Batch
   FunctionDefinition.constructor
   FunctionDefinition._baseURI
   FunctionDefinition.mint
   FunctionDefinition._pay
   FunctionDefinition._tax
   FunctionDefinition.setCurrentBatch
   FunctionDefinition.setCurrentBatchActive
   FunctionDefinition.setTxFee
   FunctionDefinition.setPaymentToken
   FunctionDefinition.setFeeCollector
   FunctionDefinition.setFreeParticipantController
   FunctionDefinition.setFreeParticipant

```

```solidity
File: land-nfts/YARD.sol

1: 
   Current order:
   FunctionDefinition.constructor
   StructDefinition.Batch
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.mint
   FunctionDefinition._pay
   FunctionDefinition._tax
   FunctionDefinition.setCurrentBatch
   FunctionDefinition.setCurrentBatchActive
   FunctionDefinition.setTxFee
   FunctionDefinition.setPaymentToken
   FunctionDefinition.setFeeCollector
   FunctionDefinition.setFreeParticipantController
   FunctionDefinition.setFreeParticipant
   
   Suggested order:
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   StructDefinition.Batch
   FunctionDefinition.constructor
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.mint
   FunctionDefinition._pay
   FunctionDefinition._tax
   FunctionDefinition.setCurrentBatch
   FunctionDefinition.setCurrentBatchActive
   FunctionDefinition.setTxFee
   FunctionDefinition.setPaymentToken
   FunctionDefinition.setFeeCollector
   FunctionDefinition.setFreeParticipantController
   FunctionDefinition.setFreeParticipant

```

### <a name="NC-13"></a>[NC-13] Internal and private variables and functions names should begin with an underscore
According to the Solidity Style Guide, Non-`external` variable and function names should begin with an [underscore](https://docs.soliditylang.org/en/latest/style-guide.html#underscore-prefix-for-non-external-functions-and-variables)

*Instances (2)*:
```solidity
File: land-nfts/ACRE.sol

30:     string private baseUri = 'https://sidekickfinance.mypinata.cloud/ipfs/QmR3JYjc8bjvjpuwJhWN38DSKZSLA9ydU67CoddWuo89J8';

```

```solidity
File: land-nfts/YARD.sol

27:     string private baseUri = 'https://sidekickfinance.mypinata.cloud/ipfs/QmVRVjmmK5bDJdpSXAyZ4iqQsR5q7w4tyDPTqhV21UiYTM';

```

### <a name="NC-14"></a>[NC-14] `public` functions not called by the contract should be declared `external` instead

*Instances (26)*:
```solidity
File: land-nfts/ACRE.sol

40:     function setBaseURI (string memory newUri) public onlyOwner {

44:     function mint(uint256 quantity) public {

89:     function setCurrentBatch(

104:     function setCurrentBatchActive(bool active) public onlyOwner {

108:     function setTxFee(uint256 amount) public onlyOwner {

113:     function setPaymentToken(address token) public onlyOwner {

118:     function setFeeCollector(address collector) public onlyOwner {

123:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

128:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

```solidity
File: land-nfts/PLOT.sol

36:     function mint(uint256 quantity) public {

72:     function setCurrentBatch(

86:     function setCurrentBatchActive(bool active) public onlyOwner {

90:     function setTxFee(uint256 amount) public onlyOwner {

94:     function setPaymentToken(address token) public onlyOwner {

98:     function setFeeCollector(address collector) public onlyOwner {

102:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

107:     function setFreeParticipant(address participant, bool free) public onlyOwner

```

```solidity
File: land-nfts/YARD.sol

37:     function setBaseURI (string memory newUri) public onlyOwner {

41:     function mint(uint256 quantity) public {

77:     function setCurrentBatch(

91:     function setCurrentBatchActive(bool active) public onlyOwner {

95:     function setTxFee(uint256 amount) public onlyOwner {

99:     function setPaymentToken(address token) public onlyOwner {

103:     function setFeeCollector(address collector) public onlyOwner {

107:     function setFreeParticipantController(address freeParticipantController, bool allow) public onlyOwner

112:     function setFreeParticipant(address participant, bool free) public onlyOwner

```


## Low Issues


| |Issue|Instances|
|-|:-|:-:| 
| [L-2](#L-2) | Some tokens may revert when zero value transfers are made | 6 |
| [L-3](#L-3) | Missing checks for `address(0)` when assigning values to address state variables | 9 |
| [L-4](#L-4) | Solidity version 0.8.20+ may not work on other chains due to `PUSH0` | 3 |
| [L-5](#L-5) | Use `Ownable2Step.transferOwnership` instead of `Ownable.transferOwnership` | 3 |
| [L-6](#L-6) | File allows a version of solidity that is susceptible to an assembly optimizer bug | 3 |

### <a name="L-2"></a>[L-2] Some tokens may revert when zero value transfers are made
Example: https://github.com/d-xo/weird-erc20#revert-on-zero-value-transfers.

In spite of the fact that EIP-20 [states](https://github.com/ethereum/EIPs/blob/46b9b698815abbfa628cd1097311deee77dd45c5/EIPS/eip-20.md?plain=1#L116) that zero-valued transfers must be accepted, some tokens, such as LEND will revert if this is attempted, which may cause transactions that involve other tokens (such as batch operations) to fully revert. Consider skipping the transfer if the amount is zero, which will also save gas.

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

73:         token.transferFrom(

85:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts/PLOT.sol

58:         token.transferFrom(

68:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts/YARD.sol

63:         token.transferFrom(

73:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

### <a name="L-3"></a>[L-3] Missing checks for `address(0)` when assigning values to address state variables

*Instances (9)*:
```solidity
File: land-nfts/ACRE.sol

13:         _paymentToken = paymentToken;

115:         _paymentToken = token;

120:         _feeCollector = collector;

```

```solidity
File: land-nfts/PLOT.sol

10:         _paymentToken = paymentToken;

95:         _paymentToken = token;

99:         _feeCollector = collector;

```

```solidity
File: land-nfts/YARD.sol

10:         _paymentToken = paymentToken;

100:         _paymentToken = token;

104:         _feeCollector = collector;

```

### <a name="L-4"></a>[L-4] Solidity version 0.8.20+ may not work on other chains due to `PUSH0`
The compiler for Solidity 0.8.20 switches the default target EVM version to [Shanghai](https://blog.soliditylang.org/2023/05/10/solidity-0.8.20-release-announcement/#important-note), which includes the new `PUSH0` op code. This op code may not yet be implemented on all L2s, so deployment on these chains will fail. To work around this issue, use an earlier [EVM](https://docs.soliditylang.org/en/v0.8.20/using-the-compiler.html?ref=zaryabs.com#setting-the-evm-version-to-target) [version](https://book.getfoundry.sh/reference/config/solidity-compiler#evm_version). While the project itself may or may not compile with 0.8.20, other projects with which it integrates, or which extend this project may, and those projects will have problems deploying these contracts/libraries.

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

2: pragma solidity ^0.8.4;

```

```solidity
File: land-nfts/PLOT.sol

2: pragma solidity ^0.8.4;

```

```solidity
File: land-nfts/YARD.sol

2: pragma solidity ^0.8.4;

```

### <a name="L-5"></a>[L-5] Use `Ownable2Step.transferOwnership` instead of `Ownable.transferOwnership`
Use [Ownable2Step.transferOwnership](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable2Step.sol) which is safer. Use it as it is more secure due to 2-stage ownership transfer.

**Recommended Mitigation Steps**

Use <a href="https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable2Step.sol">Ownable2Step.sol</a>
  
  ```solidity
      function acceptOwnership() external {
          address sender = _msgSender();
          require(pendingOwner() == sender, "Ownable2Step: caller is not the new owner");
          _transferOwnership(sender);
      }
```

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

5: import '@openzeppelin/contracts/access/Ownable.sol';

```

```solidity
File: land-nfts/PLOT.sol

5: import '@openzeppelin/contracts/access/Ownable.sol';

```

```solidity
File: land-nfts/YARD.sol

5: import '@openzeppelin/contracts/access/Ownable.sol';

```

### <a name="L-6"></a>[L-6] File allows a version of solidity that is susceptible to an assembly optimizer bug
In solidity versions 0.8.13 and 0.8.14, there is an [optimizer bug](https://github.com/ethereum/solidity-blog/blob/499ab8abc19391be7b7b34f88953a067029a5b45/_posts/2022-06-15-inline-assembly-memory-side-effects-bug.md) where, if the use of a variable is in a separate `assembly` block from the block in which it was stored, the `mstore` operation is optimized out, leading to uninitialized memory. The code currently does not have such a pattern of execution, but it does use `mstore`s in `assembly` blocks, so it is a risk for future changes. The affected solidity versions should be avoided if at all possible.

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

2: pragma solidity ^0.8.4;

```

```solidity
File: land-nfts/PLOT.sol

2: pragma solidity ^0.8.4;

```

```solidity
File: land-nfts/YARD.sol

2: pragma solidity ^0.8.4;

```


## Medium Issues


| |Issue|Instances|
|-|:-|:-:|
| [M-1](#M-1) | Centralization Risk for trusted owners | 20 |
| [M-2](#M-2) | Fees can be set to be greater than 100%. | 6 |
| [M-3](#M-3) | Return values of `transfer()`/`transferFrom()` not checked | 6 |
| [M-4](#M-4) | Unsafe use of `transfer()`/`transferFrom()` with `IERC20` | 6 |
### <a name="M-1"></a>[M-1] Centralization Risk for trusted owners

#### Impact:
Contracts have owners with privileged rights to perform admin tasks and need to be trusted to not perform malicious updates or drain funds.

*Instances (20)*:
```solidity
File: land-nfts/ACRE.sol

9: contract ATLACRE is ERC721A, Ownable {

40:     function setBaseURI (string memory newUri) public onlyOwner {

93:     ) public onlyOwner {

104:     function setCurrentBatchActive(bool active) public onlyOwner {

108:     function setTxFee(uint256 amount) public onlyOwner {

113:     function setPaymentToken(address token) public onlyOwner {

118:     function setFeeCollector(address collector) public onlyOwner {

```

```solidity
File: land-nfts/PLOT.sol

8: contract ATLPLOT is ERC721A, Ownable {

76:     ) public onlyOwner {

86:     function setCurrentBatchActive(bool active) public onlyOwner {

90:     function setTxFee(uint256 amount) public onlyOwner {

94:     function setPaymentToken(address token) public onlyOwner {

98:     function setFeeCollector(address collector) public onlyOwner {

```

```solidity
File: land-nfts/YARD.sol

8: contract ATLYARD is ERC721A, Ownable{

37:     function setBaseURI (string memory newUri) public onlyOwner {

81:     ) public onlyOwner {

91:     function setCurrentBatchActive(bool active) public onlyOwner {

95:     function setTxFee(uint256 amount) public onlyOwner {

99:     function setPaymentToken(address token) public onlyOwner {

103:     function setFeeCollector(address collector) public onlyOwner {

```

### <a name="M-2"></a>[M-2] Fees can be set to be greater than 100%.
There should be an upper limit to reasonable fees.
A malicious owner can keep the fee rate at zero, but if a large value transfer enters the mempool, the owner can jack the rate up to the maximum and sandwich attack a user.

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

108:     function setTxFee(uint256 amount) public onlyOwner {
             //@audit-issue no check for amount greater than expected or zero 
             _txFeeAmount = amount;

118:     function setFeeCollector(address collector) public onlyOwner {
             //@audit-issue no check for address zero
             _feeCollector = collector;

```

```solidity
File: land-nfts/PLOT.sol

90:     function setTxFee(uint256 amount) public onlyOwner {
            _txFeeAmount = amount;

98:     function setFeeCollector(address collector) public onlyOwner {
            _feeCollector = collector;

```

```solidity
File: land-nfts/YARD.sol

95:     function setTxFee(uint256 amount) public onlyOwner {
            _txFeeAmount = amount;

103:     function setFeeCollector(address collector) public onlyOwner {
             _feeCollector = collector;

```

### <a name="M-3"></a>[M-3] Return values of `transfer()`/`transferFrom()` not checked
Not all `IERC20` implementations `revert()` when there's a failure in `transfer()`/`transferFrom()`. The function signature has a `boolean` return value and they indicate errors that way instead. By not checking the return value, operations that should have marked as failed, may potentially go through without actually making a payment

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

73:         token.transferFrom(

85:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts/PLOT.sol

58:         token.transferFrom(

68:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts/YARD.sol

63:         token.transferFrom(

73:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

### <a name="M-4"></a>[M-4] Unsafe use of `transfer()`/`transferFrom()` with `IERC20`
Some tokens do not implement the ERC20 standard properly but are still accepted by most code that accepts ERC20 tokens.  For example Tether (USDT)'s `transfer()` and `transferFrom()` functions on L1 do not return booleans as the specification requires, and instead have no return value. When these sorts of tokens are cast to `IERC20`, their [function signatures](https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca) do not match and therefore the calls made, revert (see [this](https://gist.github.com/IllIllI000/2b00a32e8f0559e8f386ea4f1800abc5) link for a test case). Use OpenZeppelin's `SafeERC20`'s `safeTransfer()`/`safeTransferFrom()` instead

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

73:         token.transferFrom(

85:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts/PLOT.sol

58:         token.transferFrom(

68:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts/YARD.sol

63:         token.transferFrom(

73:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

## High Issues

| |Issue|Instances|
|-|:-|:-:|
| [H-1](#H-1) | Potential DOS attack in _pay function | 3 |
| [H-2](#H-2) | Unchecked return values from ERC20 transfers | 6 |
| [H-3](#H-3) | Owner can bypass maximum buy limit | 3 |

### <a name="H-1"></a>[H-1] Potential DOS attack in _pay function

#### Impact:
The `_pay` function in all three contracts fails to verify if the payee is a smart contract, potentially allowing DOS attacks through malicious contract interactions.

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

63:     function _pay(address payee, uint256 quantity)

File: land-nfts/PLOT.sol

48:     function _pay(address payee, uint256 quantity)

File: land-nfts/YARD.sol

57:     function _pay(address payee, uint256 quantity)
```

### <a name="H-2"></a>[H-2] Unchecked return values from ERC20 transfers

#### Impact:
All contracts fail to check return values from `transferFrom` calls in both `_pay` and `_tax` functions.

*Instances (6)*:
```solidity
File: land-nfts/ACRE.sol

73:         token.transferFrom(
85:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

File: land-nfts/PLOT.sol

58:         token.transferFrom(
68:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

File: land-nfts/YARD.sol

63:         token.transferFrom(
73:         token.transferFrom(payee, _feeCollector, _txFeeAmount);
```

### <a name="H-3"></a>[H-3] Owner can bypass maximum buy limit

#### Impact:
All contracts allow the owner to bypass the maximum buy limit without restriction.

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

47:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

File: land-nfts/PLOT.sol

36:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");

File: land-nfts/YARD.sol

45:         require(quantity <= _maxBuyAmount || msg.sender == owner(), "Max buy amount limit hit");
```

## Critical Issues

| |Issue|Instances|
|-|:-|:-:|
| [C-1](#C-1) | Unrestricted minting allows anyone to mint tokens times without number| 3 |
| [C-2](#C-2) | Potential reentrancy vulnerability in mint function | 3 |
| [C-3](#C-3) | Missing zero address validation in critical functions | 15 |
| [C-4](#C-4) | Arithmetic overflow risk in payment calculation | 3 |
| [C-5](#C-5) | Immutable baseURI in PLOT contract with no update mechanism | 1 |

### <a name="C-1"></a>[C-1] Unrestricted minting allows anyone to mint tokens times without number

#### Impact:
All three contracts (ACRE, PLOT, and YARD) have unrestricted `mint` functions that allow any address to mint tokens if they pay the required fee. This could lead to malicious actors minting large quantities of tokens, potentially devaluing the NFT collections or causing market manipulation.

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

43:     function mint(uint256 quantity) public {

File: land-nfts/PLOT.sol

32:     function mint(uint256 quantity) public {

File: land-nfts/YARD.sol

41:     function mint(uint256 quantity) public {
```

### <a name="C-2"></a>[C-2] Potential reentrancy vulnerability in mint function

#### Impact:
All contracts update state variables after making external calls in the `mint` function, creating a potential reentrancy vulnerability. The pattern is identical across all contracts:
1. External call through `_pay`
2. Update of `_currentBatch.quantity`
3. Call to `_safeMint`

This order of operations could allow an attacker to reenter the mint function before state updates are complete.

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

51:         if (!freeParticipant[msg.sender]) {
52:             require(_pay(msg.sender, quantity), "Must pay minting fee");
53:         }
54:         _currentBatch.quantity = (_currentBatch.quantity - quantity);
55:         _safeMint(msg.sender, quantity);

File: land-nfts/PLOT.sol

40:         if (!freeParticipant[msg.sender]) {
41:             require(_pay(msg.sender, quantity), "Must pay minting fee");
42:         }
43:         _currentBatch.quantity = (_currentBatch.quantity - quantity);
44:         _safeMint(msg.sender, quantity);

File: land-nfts/YARD.sol

49:         if (!freeParticipant[msg.sender]) {
50:             require(_pay(msg.sender, quantity), "Must pay minting fee");
51:         }
52:         _currentBatch.quantity = (_currentBatch.quantity - quantity);
53:         _safeMint(msg.sender, quantity);
```

### <a name="C-3"></a>[C-3] Missing zero address validation in critical functions

#### Impact:
Critical address parameters are set without validation across all contracts. A zero address could be set for `_paymentToken`, `_feeCollector`, or other critical addresses, potentially bricking contract functionality.

*Instances (15)*:
```solidity
File: land-nfts/ACRE.sol

12:     constructor(address paymentToken)
113:     function setPaymentToken(address token)
118:     function setFeeCollector(address collector)

File: land-nfts/PLOT.sol

10:     constructor(address paymentToken)
94:     function setPaymentToken(address token)
98:     function setFeeCollector(address collector)

File: land-nfts/YARD.sol

9:      constructor(address paymentToken)
99:     function setPaymentToken(address token)
103:    function setFeeCollector(address collector)
```

### <a name="C-4"></a>[C-4] Arithmetic overflow risk in payment calculation

#### Impact:
All contracts contain potential overflow risk in the price calculation within the `_pay` function. While Solidity 0.8.x includes overflow checks, extremely large values could still cause issues.

*Instances (3)*:
```solidity
File: land-nfts/ACRE.sol

72:             _currentBatch.price * quantity

File: land-nfts/PLOT.sol

60:             _currentBatch.price * quantity

File: land-nfts/YARD.sol

66:             _currentBatch.price * quantity
```

### <a name="C-5"></a>[C-5] Immutable baseURI in PLOT contract with no update mechanism

#### Impact:
Unlike ACRE and YARD contracts which have updateable baseURIs, PLOT contract has a hardcoded baseURI with no mechanism to update it. This could be critical if the IPFS gateway changes or if metadata needs to be updated.

*Instances (1)*:
```solidity
File: land-nfts/PLOT.sol

32:     function _baseURI() internal view virtual override returns (string memory) { 
33:         return 'https://sidekickfinance.mypinata.cloud/ipfs/QmSG7SsDgMkXRA8ySWxder9tQYRKgXvT1Dmh9sStqM1huG';
34:     }
```

