# Report


## Gas Optimizations


| |Issue|Instances|
|-|:-|:-:|
| [GAS-1](#GAS-1) | Don't use `_msgSender()` if not supporting EIP-2771 | 18 |
| [GAS-2](#GAS-2) | `a = a + b` is more gas effective than `a += b` for state variables (excluding arrays and mappings) | 3 |
| [GAS-3](#GAS-3) | Using bools for storage incurs overhead | 6 |
| [GAS-4](#GAS-4) | Use calldata instead of memory for function arguments that do not get mutated | 3 |
| [GAS-5](#GAS-5) | For Operations that will not overflow, you could use unchecked | 21 |
| [GAS-6](#GAS-6) | Functions guaranteed to revert when called by normal users can be marked `payable` | 3 |
| [GAS-7](#GAS-7) | Using `private` rather than `public` for constants, saves gas | 3 |
| [GAS-8](#GAS-8) | Use != 0 instead of > 0 for unsigned integer comparison | 3 |
### <a name="GAS-1"></a>[GAS-1] Don't use `_msgSender()` if not supporting EIP-2771
Use `msg.sender` if the code does not implement [EIP-2771 trusted forwarder](https://eips.ethereum.org/EIPS/eip-2771) support

*Instances (18)*:
```solidity
File: land-nfts2/ACRE.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

55:         if (!hasRole(SIGNER_ROLE, _msgSender())) {

86:         if (quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())) {

191:         if (quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())) {

195:         if (!freeParticipant[_msgSender()]) {

201:         _safeMint(_msgSender(), quantity);

```

```solidity
File: land-nfts2/PLOT.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

55:         if (!hasRole(SIGNER_ROLE, _msgSender())) {

86:         if (quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())) {

184:         if (quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())) {

188:         if (!freeParticipant[_msgSender()]) {

194:         _safeMint(_msgSender(), quantity);

```

```solidity
File: land-nfts2/YARD.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

55:         if (!hasRole(SIGNER_ROLE, _msgSender())) {

89:         if(quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())){

189:         if (quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())) {

193:         if (!freeParticipant[_msgSender()]) {

199:         _safeMint(_msgSender(), quantity);

```

### <a name="GAS-2"></a>[GAS-2] `a = a + b` is more gas effective than `a += b` for state variables (excluding arrays and mappings)
This saves **16 gas per instance.**

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

141:         nextBatchId += 1;

```

```solidity
File: land-nfts2/PLOT.sol

136:         nextBatchId += 1;

```

```solidity
File: land-nfts2/YARD.sol

141:         nextBatchId += 1; 

```

### <a name="GAS-3"></a>[GAS-3] Using bools for storage incurs overhead
Use uint256(1) and uint256(2) for true/false to avoid a Gwarmaccess (100 gas), and to avoid Gsset (20000 gas) when changing from ‘false’ to ‘true’, after having been ‘true’ in the past. See [source](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/58f635312aa21f947cae5f8578638a85aa2519f5/contracts/security/ReentrancyGuard.sol#L23-L27).

*Instances (6)*:
```solidity
File: land-nfts2/ACRE.sol

35:     mapping(address => bool) public freeParticipantControllers;

36:     mapping(address => bool) public freeParticipant;

```

```solidity
File: land-nfts2/PLOT.sol

35:     mapping(address => bool) public freeParticipantControllers;

36:     mapping(address => bool) public freeParticipant;

```

```solidity
File: land-nfts2/YARD.sol

35:     mapping(address => bool) public freeParticipantControllers;

36:     mapping(address => bool) public freeParticipant;

```

### <a name="GAS-4"></a>[GAS-4] Use calldata instead of memory for function arguments that do not get mutated
When a function with a `memory` array is called externally, the `abi.decode()` step has to use a for-loop to copy each index of the `calldata` to the `memory` index. Each iteration of this for-loop costs at least 60 gas (i.e. `60 * <mem_array>.length`). Using `calldata` directly bypasses this loop. 

If the array is passed to an `internal` function which passes the array to another internal function where the array is modified and therefore `memory` is used in the `external` call, it's still more gas-efficient to use `calldata` when the `external` function uses modifiers, since the modifiers may prevent the internal functions from being called. Structs have the same overhead as an array of length one. 

 *Saves 60 gas per instance*

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

64:     function setBaseURI(string memory newUri) public {

```

```solidity
File: land-nfts2/PLOT.sol

64:     function setBaseURI(string memory newUri) public {

```

```solidity
File: land-nfts2/YARD.sol

64:     function setBaseURI(string memory newUri) public {

```

### <a name="GAS-5"></a>[GAS-5] For Operations that will not overflow, you could use unchecked

*Instances (21)*:
```solidity
File: land-nfts2/ACRE.sol

4: import "../../src/ERC721/ERC721A.sol";

5: import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

6: import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

98:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

112:             _currentBatch.price * quantity

141:         nextBatchId += 1;

200:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

```

```solidity
File: land-nfts2/PLOT.sol

4: import "../../src/ERC721/ERC721A.sol";

5: import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

6: import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

98:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

110:             _currentBatch.price * quantity

136:         nextBatchId += 1;

193:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

```

```solidity
File: land-nfts2/YARD.sol

4: import "../../src/ERC721/ERC721A.sol";

5: import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

6: import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

101:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

114:             _currentBatch.price * quantity

141:         nextBatchId += 1; 

198:         _currentBatch.quantity = (_currentBatch.quantity - quantity);

```

### <a name="GAS-6"></a>[GAS-6] Functions guaranteed to revert when called by normal users can be marked `payable`
If a function modifier such as `onlyOwner` is used, the function will revert if a normal user tries to pay the function. Marking the function as `payable` will lower the gas cost for legitimate callers because the compiler will not include checks for whether a payment was provided.

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

54:     function _onlySigner() private view {

```

```solidity
File: land-nfts2/PLOT.sol

54:     function _onlySigner() private view {

```

```solidity
File: land-nfts2/YARD.sol

54:     function _onlySigner() private view {

```

### <a name="GAS-7"></a>[GAS-7] Using `private` rather than `public` for constants, saves gas
If needed, the values can be read from the verified contract source code, or if there are multiple values there can be a single getter function that [returns a tuple](https://github.com/code-423n4/2022-08-frax/blob/90f55a9ce4e25bceed3a74290b854341d8de6afa/src/contracts/FraxlendPair.sol#L156-L178) of the values of all currently-public constants. Saves **3406-3606 gas** in deployment gas due to the compiler not having to create non-payable getter functions for deployment calldata, not having to store the bytes of the value outside of where it's used, and not adding another entry to the method ID table

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

38:     bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

```

```solidity
File: land-nfts2/PLOT.sol

38:     bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

```

```solidity
File: land-nfts2/YARD.sol

38:     bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

```

### <a name="GAS-8"></a>[GAS-8] Use != 0 instead of > 0 for unsigned integer comparison

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

132:         if (_currentBatch.quantity > 0) {

```

```solidity
File: land-nfts2/PLOT.sol

127:         if (_currentBatch.quantity > 0) {

```

```solidity
File: land-nfts2/YARD.sol

132:         if(_currentBatch.quantity > 0){

```


## Non Critical Issues


| |Issue|Instances|
|-|:-|:-:|
| [NC-1](#NC-1) | Missing checks for `address(0)` when assigning values to address state variables | 9 |
| [NC-2](#NC-2) | `constant`s should be defined rather than using magic numbers | 3 |
| [NC-3](#NC-3) | Control structures do not follow the Solidity Style Guide | 6 |
| [NC-4](#NC-4) | Event missing indexed field | 3 |
| [NC-5](#NC-5) | Events that mark critical parameter changes should contain both the old and the new value | 3 |
| [NC-6](#NC-6) | Function ordering does not follow the Solidity style guide | 3 |
| [NC-7](#NC-7) | Functions should not be longer than 50 lines | 24 |
| [NC-8](#NC-8) | Change uint to uint256 | 3 |
| [NC-9](#NC-9) | Lack of checks in setters | 21 |
| [NC-10](#NC-10) | Missing Event for critical parameters change | 21 |
| [NC-11](#NC-11) | NatSpec is completely non-existent on functions that should have them | 33 |
| [NC-12](#NC-12) | Use a `modifier` instead of a `require/if` statement for a special `msg.sender` actor | 6 |
| [NC-13](#NC-13) | Constant state variables defined more than once | 3 |
| [NC-14](#NC-14) | Consider using named mappings | 9 |
| [NC-15](#NC-15) | Take advantage of Custom Error's return value property | 21 |
| [NC-16](#NC-16) | Contract does not follow the Solidity style guide's suggested layout ordering | 3 |
| [NC-17](#NC-17) | Internal and private variables and functions names should begin with an underscore | 3 |
| [NC-18](#NC-18) | Event is missing `indexed` fields | 3 |
| [NC-19](#NC-19) | `public` functions not called by the contract should be declared `external` instead | 33 |
### <a name="NC-1"></a>[NC-1] Missing checks for `address(0)` when assigning values to address state variables

*Instances (9)*:
```solidity
File: land-nfts2/ACRE.sol

45:         _paymentToken = paymentToken;

157:         _paymentToken = token;

162:         _feeCollector = collector;

```

```solidity
File: land-nfts2/PLOT.sol

45:         _paymentToken = paymentToken;

152:         _paymentToken = token;

157:         _feeCollector = collector;

```

```solidity
File: land-nfts2/YARD.sol

45:         _paymentToken = paymentToken;

157:         _paymentToken = token;

162:         _feeCollector = collector;

```

### <a name="NC-2"></a>[NC-2] `constant`s should be defined rather than using magic numbers
Even [assembly](https://github.com/code-423n4/2022-05-opensea-seaport/blob/9d7ce4d08bf3c3010304a0476a785c70c0e90ae7/contracts/lib/TokenTransferrer.sol#L35-L39) can benefit from using readable constants instead of hex/numeric literals

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

48:         _maxBuyAmount = 10;

```

```solidity
File: land-nfts2/PLOT.sol

48:         _maxBuyAmount = 10;

```

```solidity
File: land-nfts2/YARD.sol

48:         _maxBuyAmount = 10;

```

### <a name="NC-3"></a>[NC-3] Control structures do not follow the Solidity Style Guide
See the [control structures](https://docs.soliditylang.org/en/latest/style-guide.html#control-structures) section of the Solidity Style Guide

*Instances (6)*:
```solidity
File: land-nfts2/YARD.sol

79:         if(_currentBatch.quantity <= 0){

82:         if(!_currentBatch.active){

85:         if(quantity <= 0){

89:         if(quantity >= _maxBuyAmount && !hasRole(SIGNER_ROLE, _msgSender())){

95:             if(!_pay(msg.sender, quantity)){

132:         if(_currentBatch.quantity > 0){

```

### <a name="NC-4"></a>[NC-4] Event missing indexed field
Index event fields make the field more quickly accessible [to off-chain tools](https://ethereum.stackexchange.com/questions/40396/can-somebody-please-explain-the-concept-of-event-indexing) that parse events. This is especially useful when it comes to filtering based on an address. However, note that each index field costs extra gas during emission, so it's not necessarily best to index the maximum allowed per event (three fields). Where applicable, each `event` should use three `indexed` fields if there are three or more fields, and gas usage is not particularly of concern for the events in question. If there are fewer than three applicable fields, all of the applicable fields should be indexed.

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

40:     event NewBatchCreated(uint256 batchStartIndex);

```

```solidity
File: land-nfts2/PLOT.sol

40:     event NewBatchCreated(uint256 batchStartIndex);

```

```solidity
File: land-nfts2/YARD.sol

40:     event NewBatchCreated(uint256 batchStartIndex);

```

### <a name="NC-5"></a>[NC-5] Events that mark critical parameter changes should contain both the old and the new value
This should especially be done if the new value is not required to be different from the old value

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

126:     function setCurrentBatch(
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
             emit NewBatchCreated(_currentIndex);

```

```solidity
File: land-nfts2/PLOT.sol

121:     function setCurrentBatch(
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
             emit NewBatchCreated(_currentIndex);

```

```solidity
File: land-nfts2/YARD.sol

125:     function setCurrentBatch(
             uint256 quantity,
             uint256 price,
             bool active
         ) public  {
     
             _onlySigner();
             if(_currentBatch.quantity > 0){
                 revert CurrentBactchNotFinished();
             }
             _currentBatch.quantity = quantity;
             _currentBatch.active = active;
             _currentBatch.price = price;
             _currentBatch.batch = nextBatchId;
             _currentBatch.startIndex = _currentIndex;
             allBatches[nextBatchId] = _currentBatch;
             nextBatchId += 1; 
             emit NewBatchCreated(_currentIndex);

```

### <a name="NC-6"></a>[NC-6] Function ordering does not follow the Solidity style guide
According to the [Solidity style guide](https://docs.soliditylang.org/en/v0.8.17/style-guide.html#order-of-functions), functions should be laid out in the following order :`constructor()`, `receive()`, `fallback()`, `external`, `public`, `internal`, `private`, but the cases below do not follow this pattern

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

1: 
   Current order:
   public initialize
   private _onlySigner
   internal _baseURI
   public setBaseURI
   public supportsInterface
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
   public mintAsFreeMinter
   
   Suggested order:
   public initialize
   public setBaseURI
   public supportsInterface
   public mint
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   public mintAsFreeMinter
   internal _baseURI
   internal _pay
   internal _tax
   private _onlySigner

```

```solidity
File: land-nfts2/PLOT.sol

1: 
   Current order:
   public initialize
   private _onlySigner
   internal _baseURI
   public setBaseURI
   public supportsInterface
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
   public mintAsFreeMinter
   
   Suggested order:
   public initialize
   public setBaseURI
   public supportsInterface
   public mint
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   public mintAsFreeMinter
   internal _baseURI
   internal _pay
   internal _tax
   private _onlySigner

```

```solidity
File: land-nfts2/YARD.sol

1: 
   Current order:
   public initialize
   private _onlySigner
   internal _baseURI
   public setBaseURI
   public supportsInterface
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
   public mintAsFreeMinter
   
   Suggested order:
   public initialize
   public setBaseURI
   public supportsInterface
   public mint
   public setCurrentBatch
   public setCurrentBatchActive
   public setTxFee
   public setPaymentToken
   public setFeeCollector
   public setFreeParticipantController
   public setFreeParticipant
   public mintAsFreeMinter
   internal _baseURI
   internal _pay
   internal _tax
   private _onlySigner

```

### <a name="NC-7"></a>[NC-7] Functions should not be longer than 50 lines
Overly complex code can make understanding functionality more difficult, try to further modularize your code to ensure readability 

*Instances (24)*:
```solidity
File: land-nfts2/ACRE.sol

42:     function initialize(address paymentToken) public initializer {

60:     function _baseURI() internal view virtual override returns (string memory) {

64:     function setBaseURI(string memory newUri) public {

120:     function _tax(address payee) internal virtual returns (bool) {

145:     function setCurrentBatchActive(bool active) public {

160:     function setFeeCollector(address collector) public {

173:     function setFreeParticipant(address participant, bool free) public {

178:     function mintAsFreeMinter(uint256 quantity) public {

```

```solidity
File: land-nfts2/PLOT.sol

42:     function initialize(address paymentToken) public initializer {

60:     function _baseURI() internal view virtual override returns (string memory) {

64:     function setBaseURI(string memory newUri) public {

115:     function _tax(address payee) internal virtual returns (bool) {

140:     function setCurrentBatchActive(bool active) public {

155:     function setFeeCollector(address collector) public {

168:     function setFreeParticipant(address participant, bool free) public {

173:     function mintAsFreeMinter(uint256 quantity) public {

```

```solidity
File: land-nfts2/YARD.sol

42:     function initialize(address paymentToken) public initializer {

60:     function _baseURI() internal view virtual override returns (string memory) {

64:     function setBaseURI(string memory newUri) public {

119:     function _tax(address payee) internal virtual returns (bool) {

145:     function setCurrentBatchActive(bool active) public {

160:     function setFeeCollector(address collector) public {

173:     function setFreeParticipant(address participant, bool free) public {

178:     function mintAsFreeMinter(uint256 quantity) public {

```

### <a name="NC-8"></a>[NC-8] Change uint to uint256
Throughout the code base, some variables are declared as `uint`. To favor explicitness, consider changing all instances of `uint` to `uint256`

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

33:     uint public nextBatchId;

```

```solidity
File: land-nfts2/PLOT.sol

33:     uint public nextBatchId;

```

```solidity
File: land-nfts2/YARD.sol

33:     uint public nextBatchId;

```

### <a name="NC-9"></a>[NC-9] Lack of checks in setters
Be it sanity checks (like checks against `0`-values) or initial setting checks: it's best for Setter functions to have them

*Instances (21)*:
```solidity
File: land-nfts2/ACRE.sol

64:     function setBaseURI(string memory newUri) public {
            _onlySigner();
            baseUri = newUri;

145:     function setCurrentBatchActive(bool active) public {
             _onlySigner();
             _currentBatch.active = active;

150:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

155:     function setPaymentToken(address token) public {
             _onlySigner();
             _paymentToken = token;

160:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

165:     function setFreeParticipantController(
             address freeParticipantController,
             bool allow
         ) public {
             _onlySigner();
             freeParticipantControllers[freeParticipantController] = allow;

173:     function setFreeParticipant(address participant, bool free) public {
             _onlySigner();
             freeParticipant[participant] = free;

```

```solidity
File: land-nfts2/PLOT.sol

64:     function setBaseURI(string memory newUri) public {
            _onlySigner();
            baseUri = newUri;

140:     function setCurrentBatchActive(bool active) public {
             _onlySigner();
             _currentBatch.active = active;

145:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

150:     function setPaymentToken(address token) public {
             _onlySigner();
             _paymentToken = token;

155:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

160:     function setFreeParticipantController(
             address freeParticipantController,
             bool allow
         ) public {
             _onlySigner();
             freeParticipantControllers[freeParticipantController] = allow;

168:     function setFreeParticipant(address participant, bool free) public {
             _onlySigner();
             freeParticipant[participant] = free;

```

```solidity
File: land-nfts2/YARD.sol

64:     function setBaseURI(string memory newUri) public {
            _onlySigner();
            baseUri = newUri;

145:     function setCurrentBatchActive(bool active) public {
             _onlySigner();
             _currentBatch.active = active;

150:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

155:     function setPaymentToken(address token) public {
             _onlySigner();
             _paymentToken = token;

160:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

165:     function setFreeParticipantController(
             address freeParticipantController,
             bool allow
         ) public {
             _onlySigner();
             freeParticipantControllers[freeParticipantController] = allow;

173:     function setFreeParticipant(address participant, bool free) public {
             _onlySigner();
             freeParticipant[participant] = free;

```

### <a name="NC-10"></a>[NC-10] Missing Event for critical parameters change
Events help non-contract tools to track changes, and events prevent users from being surprised by changes.

*Instances (21)*:
```solidity
File: land-nfts2/ACRE.sol

64:     function setBaseURI(string memory newUri) public {
            _onlySigner();
            baseUri = newUri;

145:     function setCurrentBatchActive(bool active) public {
             _onlySigner();
             _currentBatch.active = active;

150:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

155:     function setPaymentToken(address token) public {
             _onlySigner();
             _paymentToken = token;

160:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

165:     function setFreeParticipantController(
             address freeParticipantController,
             bool allow
         ) public {
             _onlySigner();
             freeParticipantControllers[freeParticipantController] = allow;

173:     function setFreeParticipant(address participant, bool free) public {
             _onlySigner();
             freeParticipant[participant] = free;

```

```solidity
File: land-nfts2/PLOT.sol

64:     function setBaseURI(string memory newUri) public {
            _onlySigner();
            baseUri = newUri;

140:     function setCurrentBatchActive(bool active) public {
             _onlySigner();
             _currentBatch.active = active;

145:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

150:     function setPaymentToken(address token) public {
             _onlySigner();
             _paymentToken = token;

155:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

160:     function setFreeParticipantController(
             address freeParticipantController,
             bool allow
         ) public {
             _onlySigner();
             freeParticipantControllers[freeParticipantController] = allow;

168:     function setFreeParticipant(address participant, bool free) public {
             _onlySigner();
             freeParticipant[participant] = free;

```

```solidity
File: land-nfts2/YARD.sol

64:     function setBaseURI(string memory newUri) public {
            _onlySigner();
            baseUri = newUri;

145:     function setCurrentBatchActive(bool active) public {
             _onlySigner();
             _currentBatch.active = active;

150:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

155:     function setPaymentToken(address token) public {
             _onlySigner();
             _paymentToken = token;

160:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

165:     function setFreeParticipantController(
             address freeParticipantController,
             bool allow
         ) public {
             _onlySigner();
             freeParticipantControllers[freeParticipantController] = allow;

173:     function setFreeParticipant(address participant, bool free) public {
             _onlySigner();
             freeParticipant[participant] = free;

```

### <a name="NC-11"></a>[NC-11] NatSpec is completely non-existent on functions that should have them
Public and external functions that aren't view or pure should have NatSpec comments

*Instances (33)*:
```solidity
File: land-nfts2/ACRE.sol

42:     function initialize(address paymentToken) public initializer {

64:     function setBaseURI(string memory newUri) public {

75:     function mint(uint256 quantity) public {

126:     function setCurrentBatch(

145:     function setCurrentBatchActive(bool active) public {

150:     function setTxFee(uint256 amount) public {

155:     function setPaymentToken(address token) public {

160:     function setFeeCollector(address collector) public {

165:     function setFreeParticipantController(

173:     function setFreeParticipant(address participant, bool free) public {

178:     function mintAsFreeMinter(uint256 quantity) public {

```

```solidity
File: land-nfts2/PLOT.sol

42:     function initialize(address paymentToken) public initializer {

64:     function setBaseURI(string memory newUri) public {

75:     function mint(uint256 quantity) public {

121:     function setCurrentBatch(

140:     function setCurrentBatchActive(bool active) public {

145:     function setTxFee(uint256 amount) public {

150:     function setPaymentToken(address token) public {

155:     function setFeeCollector(address collector) public {

160:     function setFreeParticipantController(

168:     function setFreeParticipant(address participant, bool free) public {

173:     function mintAsFreeMinter(uint256 quantity) public {

```

```solidity
File: land-nfts2/YARD.sol

42:     function initialize(address paymentToken) public initializer {

64:     function setBaseURI(string memory newUri) public {

78:     function mint(uint256 quantity) public {

125:     function setCurrentBatch(

145:     function setCurrentBatchActive(bool active) public {

150:     function setTxFee(uint256 amount) public {

155:     function setPaymentToken(address token) public {

160:     function setFeeCollector(address collector) public {

165:     function setFreeParticipantController(

173:     function setFreeParticipant(address participant, bool free) public {

178:     function mintAsFreeMinter(uint256 quantity) public {

```

### <a name="NC-12"></a>[NC-12] Use a `modifier` instead of a `require/if` statement for a special `msg.sender` actor
If a function is supposed to be access-controlled, a `modifier` should be used instead of a `require/if` statement for more readability.

*Instances (6)*:
```solidity
File: land-nfts2/ACRE.sol

90:         if (!freeParticipant[msg.sender]) {

92:             if (!_pay(msg.sender, quantity)) {

```

```solidity
File: land-nfts2/PLOT.sol

90:         if (!freeParticipant[msg.sender]) {

92:             if (!_pay(msg.sender, quantity)) {

```

```solidity
File: land-nfts2/YARD.sol

93:         if (!freeParticipant[msg.sender]) {

95:             if(!_pay(msg.sender, quantity)){

```

### <a name="NC-13"></a>[NC-13] Constant state variables defined more than once
Rather than redefining state variable constant, consider using a library to store all constants as this will prevent data redundancy

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

38:     bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

```

```solidity
File: land-nfts2/PLOT.sol

38:     bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

```

```solidity
File: land-nfts2/YARD.sol

38:     bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

```

### <a name="NC-14"></a>[NC-14] Consider using named mappings
Consider moving to solidity version 0.8.18 or later, and using [named mappings](https://ethereum.stackexchange.com/questions/51629/how-to-name-the-arguments-in-mapping/145555#145555) to make it easier to understand the purpose of each mapping

*Instances (9)*:
```solidity
File: land-nfts2/ACRE.sol

35:     mapping(address => bool) public freeParticipantControllers;

36:     mapping(address => bool) public freeParticipant;

37:     mapping(uint256 => Batch) public allBatches;

```

```solidity
File: land-nfts2/PLOT.sol

35:     mapping(address => bool) public freeParticipantControllers;

36:     mapping(address => bool) public freeParticipant;

37:     mapping(uint256 => Batch) public allBatches;

```

```solidity
File: land-nfts2/YARD.sol

35:     mapping(address => bool) public freeParticipantControllers;

36:     mapping(address => bool) public freeParticipant;

37:     mapping(uint256 => Batch) public allBatches;

```

### <a name="NC-15"></a>[NC-15] Take advantage of Custom Error's return value property
An important feature of Custom Error is that values such as address, tokenID, msg.value can be written inside the () sign, this kind of approach provides a serious advantage in debugging and examining the revert details of dapps such as tenderly.

*Instances (21)*:
```solidity
File: land-nfts2/ACRE.sol

56:             revert UnAuthorized();

77:             revert NoMoreTokensLeft();

80:             revert CurrentBatchNotActive();

83:             revert QuantityMustBeAboveZero();

87:             revert MaxBuyAmountLimitReached();

93:                 revert MustPayBeforeMinting();

133:             revert CurrentBactchNotFinished();

```

```solidity
File: land-nfts2/PLOT.sol

56:             revert UnAuthorized();

77:             revert NoMoreTokensLeft();

80:             revert CurrentBatchNotActive();

83:             revert QuantityMustBeAboveZero();

87:             revert MaxBuyAmountLimitReached();

93:                 revert MustPayBeforeMinting();

128:             revert CurrentBactchNotFinished();

```

```solidity
File: land-nfts2/YARD.sol

56:             revert UnAuthorized();

80:             revert NoMoreTokensLeft();

83:             revert CurrentBatchNotActive();

86:           revert QuantityMustBeAboveZero();

90:             revert MaxBuyAmountLimitReached();

96:                 revert MustPayBeforeMinting();

133:             revert CurrentBactchNotFinished();

```

### <a name="NC-16"></a>[NC-16] Contract does not follow the Solidity style guide's suggested layout ordering
The [style guide](https://docs.soliditylang.org/en/v0.8.16/style-guide.html#order-of-layout) says that, within a contract, the ordering should be:

1) Type declarations
2) State variables
3) Events
4) Modifiers
5) Functions

However, the contract(s) below do not follow this ordering

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

1: 
   Current order:
   StructDefinition.Batch
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.nextBatchId
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   VariableDeclaration.allBatches
   VariableDeclaration.SIGNER_ROLE
   EventDefinition.NewBatchCreated
   FunctionDefinition.initialize
   FunctionDefinition._onlySigner
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.supportsInterface
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
   FunctionDefinition.mintAsFreeMinter
   
   Suggested order:
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.nextBatchId
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   VariableDeclaration.allBatches
   VariableDeclaration.SIGNER_ROLE
   StructDefinition.Batch
   EventDefinition.NewBatchCreated
   FunctionDefinition.initialize
   FunctionDefinition._onlySigner
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.supportsInterface
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
   FunctionDefinition.mintAsFreeMinter

```

```solidity
File: land-nfts2/PLOT.sol

1: 
   Current order:
   StructDefinition.Batch
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.nextBatchId
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   VariableDeclaration.allBatches
   VariableDeclaration.SIGNER_ROLE
   EventDefinition.NewBatchCreated
   FunctionDefinition.initialize
   FunctionDefinition._onlySigner
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.supportsInterface
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
   FunctionDefinition.mintAsFreeMinter
   
   Suggested order:
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.nextBatchId
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   VariableDeclaration.allBatches
   VariableDeclaration.SIGNER_ROLE
   StructDefinition.Batch
   EventDefinition.NewBatchCreated
   FunctionDefinition.initialize
   FunctionDefinition._onlySigner
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.supportsInterface
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
   FunctionDefinition.mintAsFreeMinter

```

```solidity
File: land-nfts2/YARD.sol

1: 
   Current order:
   StructDefinition.Batch
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.nextBatchId
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   VariableDeclaration.allBatches
   VariableDeclaration.SIGNER_ROLE
   EventDefinition.NewBatchCreated
   FunctionDefinition.initialize
   FunctionDefinition._onlySigner
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.supportsInterface
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
   FunctionDefinition.mintAsFreeMinter
   
   Suggested order:
   VariableDeclaration._paymentToken
   VariableDeclaration._feeCollector
   VariableDeclaration._currentBatch
   VariableDeclaration._txFeeAmount
   VariableDeclaration._maxBuyAmount
   VariableDeclaration.nextBatchId
   VariableDeclaration.baseUri
   VariableDeclaration.freeParticipantControllers
   VariableDeclaration.freeParticipant
   VariableDeclaration.allBatches
   VariableDeclaration.SIGNER_ROLE
   StructDefinition.Batch
   EventDefinition.NewBatchCreated
   FunctionDefinition.initialize
   FunctionDefinition._onlySigner
   FunctionDefinition._baseURI
   FunctionDefinition.setBaseURI
   FunctionDefinition.supportsInterface
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
   FunctionDefinition.mintAsFreeMinter

```

### <a name="NC-17"></a>[NC-17] Internal and private variables and functions names should begin with an underscore
According to the Solidity Style Guide, Non-`external` variable and function names should begin with an [underscore](https://docs.soliditylang.org/en/latest/style-guide.html#underscore-prefix-for-non-external-functions-and-variables)

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

34:     string private baseUri;

```

```solidity
File: land-nfts2/PLOT.sol

34:     string private baseUri;

```

```solidity
File: land-nfts2/YARD.sol

34:     string private baseUri;

```

### <a name="NC-18"></a>[NC-18] Event is missing `indexed` fields
Index event fields make the field more quickly accessible to off-chain tools that parse events. However, note that each index field costs extra gas during emission, so it's not necessarily best to index the maximum allowed per event (three fields). Each event should use three indexed fields if there are three or more fields, and gas usage is not particularly of concern for the events in question. If there are fewer than three fields, all of the fields should be indexed.

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

40:     event NewBatchCreated(uint256 batchStartIndex);

```

```solidity
File: land-nfts2/PLOT.sol

40:     event NewBatchCreated(uint256 batchStartIndex);

```

```solidity
File: land-nfts2/YARD.sol

40:     event NewBatchCreated(uint256 batchStartIndex);

```

### <a name="NC-19"></a>[NC-19] `public` functions not called by the contract should be declared `external` instead

*Instances (33)*:
```solidity
File: land-nfts2/ACRE.sol

42:     function initialize(address paymentToken) public initializer {

64:     function setBaseURI(string memory newUri) public {

75:     function mint(uint256 quantity) public {

126:     function setCurrentBatch(

145:     function setCurrentBatchActive(bool active) public {

150:     function setTxFee(uint256 amount) public {

155:     function setPaymentToken(address token) public {

160:     function setFeeCollector(address collector) public {

165:     function setFreeParticipantController(

173:     function setFreeParticipant(address participant, bool free) public {

178:     function mintAsFreeMinter(uint256 quantity) public {

```

```solidity
File: land-nfts2/PLOT.sol

42:     function initialize(address paymentToken) public initializer {

64:     function setBaseURI(string memory newUri) public {

75:     function mint(uint256 quantity) public {

121:     function setCurrentBatch(

140:     function setCurrentBatchActive(bool active) public {

145:     function setTxFee(uint256 amount) public {

150:     function setPaymentToken(address token) public {

155:     function setFeeCollector(address collector) public {

160:     function setFreeParticipantController(

168:     function setFreeParticipant(address participant, bool free) public {

173:     function mintAsFreeMinter(uint256 quantity) public {

```

```solidity
File: land-nfts2/YARD.sol

42:     function initialize(address paymentToken) public initializer {

64:     function setBaseURI(string memory newUri) public {

78:     function mint(uint256 quantity) public {

125:     function setCurrentBatch(

145:     function setCurrentBatchActive(bool active) public {

150:     function setTxFee(uint256 amount) public {

155:     function setPaymentToken(address token) public {

160:     function setFeeCollector(address collector) public {

165:     function setFreeParticipantController(

173:     function setFreeParticipant(address participant, bool free) public {

178:     function mintAsFreeMinter(uint256 quantity) public {

```


## Low Issues


| |Issue|Instances|
|-|:-|:-:|
| [L-1](#L-1) | Some tokens may revert when zero value transfers are made | 6 |
| [L-2](#L-2) | Missing checks for `address(0)` when assigning values to address state variables | 9 |
| [L-3](#L-3) | Do not use deprecated library functions | 3 |
| [L-4](#L-4) | Deprecated _setupRole() function | 3 |
| [L-5](#L-5) | Initializers could be front-run | 3 |
| [L-6](#L-6) | Solidity version 0.8.20+ may not work on other chains due to `PUSH0` | 3 |
| [L-7](#L-7) | File allows a version of solidity that is susceptible to an assembly optimizer bug | 3 |
| [L-8](#L-8) | Unsafe ERC20 operation(s) | 6 |
| [L-9](#L-9) | Upgradeable contract is missing a `__gap[50]` storage variable to allow for new storage variables in later versions | 18 |
### <a name="L-1"></a>[L-1] Some tokens may revert when zero value transfers are made
Example: https://github.com/d-xo/weird-erc20#revert-on-zero-value-transfers.

In spite of the fact that EIP-20 [states](https://github.com/ethereum/EIPs/blob/46b9b698815abbfa628cd1097311deee77dd45c5/EIPS/eip-20.md?plain=1#L116) that zero-valued transfers must be accepted, some tokens, such as LEND will revert if this is attempted, which may cause transactions that involve other tokens (such as batch operations) to fully revert. Consider skipping the transfer if the amount is zero, which will also save gas.

*Instances (6)*:
```solidity
File: land-nfts2/ACRE.sol

109:         token.transferFrom(

122:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts2/PLOT.sol

107:         token.transferFrom(

117:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts2/YARD.sol

111:         token.transferFrom(

121:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

### <a name="L-2"></a>[L-2] Missing checks for `address(0)` when assigning values to address state variables

*Instances (9)*:
```solidity
File: land-nfts2/ACRE.sol

45:         _paymentToken = paymentToken;

157:         _paymentToken = token;

162:         _feeCollector = collector;

```

```solidity
File: land-nfts2/PLOT.sol

45:         _paymentToken = paymentToken;

152:         _paymentToken = token;

157:         _feeCollector = collector;

```

```solidity
File: land-nfts2/YARD.sol

45:         _paymentToken = paymentToken;

157:         _paymentToken = token;

162:         _feeCollector = collector;

```

### <a name="L-3"></a>[L-3] Do not use deprecated library functions

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

```

```solidity
File: land-nfts2/PLOT.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

```

```solidity
File: land-nfts2/YARD.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

```

### <a name="L-4"></a>[L-4] Deprecated _setupRole() function

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

```

```solidity
File: land-nfts2/PLOT.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

```

```solidity
File: land-nfts2/YARD.sol

43:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

```

### <a name="L-5"></a>[L-5] Initializers could be front-run
Initializers could be front-run, allowing an attacker to either set their own values, take ownership of the contract, and in the best case forcing a re-deployment

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

42:     function initialize(address paymentToken) public initializer {

```

```solidity
File: land-nfts2/PLOT.sol

42:     function initialize(address paymentToken) public initializer {

```

```solidity
File: land-nfts2/YARD.sol

42:     function initialize(address paymentToken) public initializer {

```

### <a name="L-6"></a>[L-6] Solidity version 0.8.20+ may not work on other chains due to `PUSH0`
The compiler for Solidity 0.8.20 switches the default target EVM version to [Shanghai](https://blog.soliditylang.org/2023/05/10/solidity-0.8.20-release-announcement/#important-note), which includes the new `PUSH0` op code. This op code may not yet be implemented on all L2s, so deployment on these chains will fail. To work around this issue, use an earlier [EVM](https://docs.soliditylang.org/en/v0.8.20/using-the-compiler.html?ref=zaryabs.com#setting-the-evm-version-to-target) [version](https://book.getfoundry.sh/reference/config/solidity-compiler#evm_version). While the project itself may or may not compile with 0.8.20, other projects with which it integrates, or which extend this project may, and those projects will have problems deploying these contracts/libraries.

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

2: pragma solidity ^0.8.4;

```

```solidity
File: land-nfts2/PLOT.sol

2: pragma solidity ^0.8.4;

```

```solidity
File: land-nfts2/YARD.sol

2: pragma solidity ^0.8.4;

```

### <a name="L-7"></a>[L-7] File allows a version of solidity that is susceptible to an assembly optimizer bug
In solidity versions 0.8.13 and 0.8.14, there is an [optimizer bug](https://github.com/ethereum/solidity-blog/blob/499ab8abc19391be7b7b34f88953a067029a5b45/_posts/2022-06-15-inline-assembly-memory-side-effects-bug.md) where, if the use of a variable is in a separate `assembly` block from the block in which it was stored, the `mstore` operation is optimized out, leading to uninitialized memory. The code currently does not have such a pattern of execution, but it does use `mstore`s in `assembly` blocks, so it is a risk for future changes. The affected solidity versions should be avoided if at all possible.

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

2: pragma solidity ^0.8.4;

```

```solidity
File: land-nfts2/PLOT.sol

2: pragma solidity ^0.8.4;

```

```solidity
File: land-nfts2/YARD.sol

2: pragma solidity ^0.8.4;

```

### <a name="L-8"></a>[L-8] Unsafe ERC20 operation(s)

*Instances (6)*:
```solidity
File: land-nfts2/ACRE.sol

109:         token.transferFrom(

122:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts2/PLOT.sol

107:         token.transferFrom(

117:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts2/YARD.sol

111:         token.transferFrom(

121:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

### <a name="L-9"></a>[L-9] Upgradeable contract is missing a `__gap[50]` storage variable to allow for new storage variables in later versions
See [this](https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps) link for a description of this storage variable. While some contracts may not currently be sub-classed, adding the variable now protects against forgetting to add it in the future.

*Instances (18)*:
```solidity
File: land-nfts2/ACRE.sol

5: import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

6: import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

18: contract ACRE is ERC721A, AccessControlUpgradeable {

71:     ) public view override(ERC721A, AccessControlUpgradeable) returns (bool) {

108:         IERC20Upgradeable token = IERC20Upgradeable(_paymentToken);

121:         IERC20Upgradeable token = IERC20Upgradeable(_paymentToken);

```

```solidity
File: land-nfts2/PLOT.sol

5: import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

6: import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

19: contract PLOT is ERC721A, AccessControlUpgradeable {

71:     ) public view override(ERC721A, AccessControlUpgradeable) returns (bool) {

106:         IERC20Upgradeable token = IERC20Upgradeable(_paymentToken);

116:         IERC20Upgradeable token = IERC20Upgradeable(_paymentToken);

```

```solidity
File: land-nfts2/YARD.sol

5: import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

6: import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

19: contract YARD is ERC721A, AccessControlUpgradeable {

72:         override(ERC721A, AccessControlUpgradeable)

110:         IERC20Upgradeable token = IERC20Upgradeable(_paymentToken);

120:         IERC20Upgradeable token = IERC20Upgradeable(_paymentToken);

```


## Medium Issues


| |Issue|Instances|
|-|:-|:-:|
| [M-1](#M-1) | Fees can be set to be greater than 100%. | 6 |
| [M-2](#M-2) | Direct `supportsInterface()` calls may cause caller to revert | 3 |
| [M-3](#M-3) | Return values of `transfer()`/`transferFrom()` not checked | 6 |
| [M-4](#M-4) | Unsafe use of `transfer()`/`transferFrom()` with `IERC20` | 6 |
| [M-5](#M-5) | Potential integer overflow in price calculations |6|
| [M-6](#M-6) | Incorrect access control pattern |9| 
| [M-7](#M-7) | Lack of input validation |15|
### <a name="M-1"></a>[M-1] Fees can be set to be greater than 100%.
There should be an upper limit to reasonable fees.
A malicious owner can keep the fee rate at zero, but if a large value transfer enters the mempool, the owner can jack the rate up to the maximum and sandwich attack a user.

*Instances (6)*:
```solidity
File: land-nfts2/ACRE.sol

150:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

160:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

```

```solidity
File: land-nfts2/PLOT.sol

145:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

155:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

```

```solidity
File: land-nfts2/YARD.sol

150:     function setTxFee(uint256 amount) public {
             _onlySigner();
             _txFeeAmount = amount;

160:     function setFeeCollector(address collector) public {
             _onlySigner();
             _feeCollector = collector;

```

### <a name="M-2"></a>[M-2] Direct `supportsInterface()` calls may cause caller to revert
Calling `supportsInterface()` on a contract that doesn't implement the ERC-165 standard will result in the call reverting. Even if the caller does support the function, the contract may be malicious and consume all of the transaction's available gas. Call it via a low-level [staticcall()](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/f959d7e4e6ee0b022b41e5b644c79369869d8411/contracts/utils/introspection/ERC165Checker.sol#L119), with a fixed amount of gas, and check the return code, or use OpenZeppelin's [`ERC165Checker.supportsInterface()`](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/f959d7e4e6ee0b022b41e5b644c79369869d8411/contracts/utils/introspection/ERC165Checker.sol#L36-L39).

*Instances (3)*:
```solidity
File: land-nfts2/ACRE.sol

72:         return ERC721A.supportsInterface(interfaceId);

```

```solidity
File: land-nfts2/PLOT.sol

72:         return ERC721A.supportsInterface(interfaceId);

```

```solidity
File: land-nfts2/YARD.sol

75:         return ERC721A.supportsInterface(interfaceId);

```

### <a name="M-3"></a>[M-3] Return values of `transfer()`/`transferFrom()` not checked
Not all `IERC20` implementations `revert()` when there's a failure in `transfer()`/`transferFrom()`. The function signature has a `boolean` return value and they indicate errors that way instead. By not checking the return value, operations that should have marked as failed, may potentially go through without actually making a payment

*Instances (6)*:
```solidity
File: land-nfts2/ACRE.sol

109:         token.transferFrom(

122:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts2/PLOT.sol

107:         token.transferFrom(

117:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts2/YARD.sol

111:         token.transferFrom(

121:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

### <a name="M-4"></a>[M-4] Unsafe use of `transfer()`/`transferFrom()` with `IERC20`
Some tokens do not implement the ERC20 standard properly but are still accepted by most code that accepts ERC20 tokens.  For example Tether (USDT)'s `transfer()` and `transferFrom()` functions on L1 do not return booleans as the specification requires, and instead have no return value. When these sorts of tokens are cast to `IERC20`, their [function signatures](https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca) do not match and therefore the calls made, revert (see [this](https://gist.github.com/IllIllI000/2b00a32e8f0559e8f386ea4f1800abc5) link for a test case). Use OpenZeppelin's `SafeERC20`'s `safeTransfer()`/`safeTransferFrom()` instead

*Instances (6)*:
```solidity
File: land-nfts2/ACRE.sol

109:         token.transferFrom(

122:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts2/PLOT.sol

107:         token.transferFrom(

117:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```

```solidity
File: land-nfts2/YARD.sol

111:         token.transferFrom(

121:         token.transferFrom(payee, _feeCollector, _txFeeAmount);

```
---

### High Issues

| |Issue|Instances|
|-|:-|:-:|
| [H-1](#H-1) | Lack of reentrancy protection in mint functions. | 6 |
| [H-2](#H-2) | Potential DoS attack in batch minting. | 3 |
| [H-3](#H-3) | Critical access control vulnerability. | 6 |
| [H-4](#H-4) | Improper update mechanism in batch minting. | 3 |

---

### <a name="H-4"></a>[H-4] Improper update mechanism in batch minting
The contracts update batch quantities before performing the mint operation, which could lead to inconsistencies if the mint fails.

**Instances (3):**
```solidity
File: PLOT.sol

91:         _currentBatch.quantity = (_currentBatch.quantity - quantity);
92:         _safeMint(msg.sender, quantity);
```

---

### Critical Issues

| |Issue|Instances|
|-|:-|:-:|
| [C-1](#C-1) | Incorrect access control in state-changing functions. | 6 |
| [C-2](#C-2) | Permanent fund lock due to broken update mechanism. | 6 |
| [C-3](#C-3) | Unprotected initializer function. | 3 |

---

### <a name="C-3"></a>[C-3] Unprotected initializer function
The `initialize` function can be called multiple times if not properly protected, leading to potential misconfiguration or overwriting of critical state.

**Instances (3):**
```solidity
File: PLOT.sol

38:     function initialize(address paymentToken) public initializer {
39:         _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
40:         ERC721A.ERC721A_Initialize("EVT Plot", "pEVT");
```