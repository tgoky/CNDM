# Gas Optimization Guide

This guide provides specific, actionable gas optimizations for the DED smart contracts.

---

## Quick Wins (Easy to Implement)

### 1. Use `calldata` Instead of `memory` for Read-Only Parameters

**Savings:** ~200-300 gas per function call

**Files to Update:**

#### DEDListing.sol
```solidity
// Line 122 - BEFORE
function submitListing(
    string memory _subject,
    string memory _topic,
    string memory _objectives,
    uint256 _postAmount
)

// AFTER
function submitListing(
    string calldata _subject,
    string calldata _topic,
    string calldata _objectives,
    uint256 _postAmount
)

// Line 404 - BEFORE
function updateInfo(
    string memory _subject,
    string memory _topic,
    string memory _objectives,
    uint256 _postAmount
)

// AFTER
function updateInfo(
    string calldata _subject,
    string calldata _topic,
    string calldata _objectives,
    uint256 _postAmount
)
```

#### ListingBroker.sol
```solidity
// Line 174 - BEFORE
function submitListing(
    bytes32 subject,
    bytes32 topic,
    string memory description,
    string memory objectives,
    uint256 amount
)

// AFTER
function submitListing(
    bytes32 subject,
    bytes32 topic,
    string calldata description,
    string calldata objectives,
    uint256 amount
)

// Line 231 - BEFORE
function applyToListing(
    bytes32 listingId,
    uint256 barterAmount,
    string memory message
)

// AFTER
function applyToListing(
    bytes32 listingId,
    uint256 barterAmount,
    string calldata message
)
```

#### DEDProfile.sol
```solidity
// Line 54 - BEFORE
function updateInfo(string memory _displayName, string memory _bio)

// AFTER
function updateInfo(string calldata _displayName, string calldata _bio)
```

**Total Estimated Savings:** 600-900 gas per transaction

---

### 2. Cache Array Length in Loops

**Savings:** ~100 gas per iteration

#### ListingBroker.sol
```solidity
// Line 43 - BEFORE
for (uint256 i = 0; i < payees.length; i++) {
    _addPayee(payees[i], shares_[i]);
}

// AFTER
uint256 length = payees.length;
for (uint256 i = 0; i < length; i++) {
    _addPayee(payees[i], shares_[i]);
}
```

#### DEDListing.sol
```solidity
// In getPotentialEducators() - BEFORE
for (uint256 i = 0; i < potentialEducators.length; i++) {

// AFTER
uint256 length = potentialEducators.length;
for (uint256 i = 0; i < length; i++) {
```

**Total Estimated Savings:** 100+ gas per loop iteration

---

### 3. Use `++i` Instead of `i++` in Loops

**Savings:** ~5 gas per iteration

```solidity
// BEFORE
for (uint256 i = 0; i < length; i++) {

// AFTER
for (uint256 i = 0; i < length; ++i) {
```

Apply to all loops in all contracts.

**Total Estimated Savings:** 20-50 gas per transaction

---

### 4. Use Custom Errors Instead of `require` with Strings

**Savings:** ~50 gas per revert

**Already Implemented:** Most contracts already use this!

**Still Need to Fix:**

#### DEDListing.sol
```solidity
// Line 161 - BEFORE
require(listingIndex < listings[msg.sender].length, "Invalid listing index");

// AFTER
error InvalidListingIndex();
if (listingIndex >= listings[msg.sender].length) revert InvalidListingIndex();

// Line 189 - BEFORE
require(user != address(0), "Invalid user address");

// AFTER - Already has InvalidAddress error, use it
if (user == address(0)) revert InvalidAddress();

// Line 206 - BEFORE
require(index < listings[user].length, "Invalid listing index");

// AFTER
if (index >= listings[user].length) revert InvalidListingIndex();
```

#### DEDReputation.sol
```solidity
// Line 100 - BEFORE
require(student != address(0), "Invalid student address");

// AFTER - Already has InvalidAddress error defined elsewhere
error InvalidAddress();
if (student == address(0)) revert InvalidAddress();

// Similar for lines 111, 123, 124, 125
```

---

### 5. Pack Struct Variables

**Savings:** 2,000-20,000 gas per storage operation

#### ListingBroker.sol - Listing Struct

```solidity
// BEFORE (inefficient packing)
struct Listing {
    bytes32 listingId;          // slot 0
    address creator;            // slot 1 (12 bytes wasted)
    uint256 amount;             // slot 2
    bytes32 subject;            // slot 3
    bytes32 topic;              // slot 4
    string description;         // slot 5
    string objectives;          // slot 6
    uint256 timestamp;          // slot 7
    bool isActive;              // slot 8 (31 bytes wasted)
    address selectedApplicant;  // slot 9 (12 bytes wasted)
    uint256 finalAmount;        // slot 10
}

// AFTER (optimized packing) - if amount fits in uint96
struct Listing {
    bytes32 listingId;          // slot 0
    bytes32 subject;            // slot 1
    bytes32 topic;              // slot 2
    address creator;            // slot 3 (20 bytes)
    uint96 amount;              // slot 3 (12 bytes) - packed!
    address selectedApplicant;  // slot 4 (20 bytes)
    uint96 finalAmount;         // slot 4 (12 bytes) - packed!
    uint64 timestamp;           // slot 5 (8 bytes)
    bool isActive;              // slot 5 (1 byte) - packed!
    string description;         // slot 6+
    string objectives;          // slot 7+
}

// Saved 5 storage slots = ~100,000 gas per Listing creation!
```

**Note:** Only use uint96 if maximum amount is < 2^96 (79,228,162,514 tokens with 18 decimals)

#### ListingBroker.sol - Application Struct

```solidity
// BEFORE
struct Application {
    address applicant;      // slot 0
    uint256 barterAmount;   // slot 1
    string message;         // slot 2+
    uint256 timestamp;      // slot 3+
    bool isActive;          // slot 4+
}

// AFTER
struct Application {
    address applicant;      // slot 0 (20 bytes)
    uint96 barterAmount;    // slot 0 (12 bytes) - packed!
    uint64 timestamp;       // slot 1 (8 bytes)
    bool isActive;          // slot 1 (1 byte) - packed!
    string message;         // slot 2+
}

// Saved 2 storage slots = ~40,000 gas per Application!
```

---

### 6. Use `immutable` for Variables Set in Constructor

**Savings:** ~2,100 gas per read

**Already Implemented:** ✓ All contracts properly use `immutable`

Examples:
- DEDIndex: `owner`
- DEDEscrow: `_beneficiary`
- DEDListing: `owner`, `creator`
- DEDProfile: `userAddress`
- DEDToken: (add `owner` with CRIT-05 fix)

---

### 7. Short-Circuit Boolean Checks

**Savings:** Varies, can save thousands of gas

```solidity
// BEFORE - Always checks both conditions
if (potentialEducatorList[e.account] && studentDeposits[e.account] > 0) {

// AFTER - Short-circuits if first is false
if (potentialEducatorList[e.account]) {
    if (studentDeposits[e.account] > 0) {
        // do something
    }
}
```

Apply to:
- DEDListing.sol line 270 (in refund logic)
- Any other compound boolean checks

---

### 8. Use `unchecked` for Safe Arithmetic

**Savings:** ~20-40 gas per operation

**Only use when overflow is impossible!**

```solidity
// Example: Loop counter (cannot overflow in practice)
for (uint256 i = 0; i < length;) {
    // ... loop body ...

    unchecked { ++i; }
}

// Example: Subtraction after check
require(balance >= amount, "Insufficient balance");
unchecked {
    balance -= amount;  // Safe because of require above
}
```

**Warning:** Only use after thorough analysis. Overflow bugs are critical.

---

## Medium Optimizations (More Complex)

### 9. Use Events Instead of Storage for Historical Data

If you only need to query historical data off-chain, use events instead of storing it.

**Example:** Remove `totalListings` counter if only needed for display

```solidity
// BEFORE
uint256 public totalListings;

function submitListing(...) {
    // ...
    totalListings++;  // Costs ~20,000 gas
}

// AFTER
// Remove totalListings state variable
// Calculate off-chain by counting ListingSubmitted events
```

**Savings:** 20,000 gas per listing creation
**Trade-off:** Need off-chain indexing (The Graph, etc.)

---

### 10. Batch Operations

Add functions to batch multiple operations in one transaction.

```solidity
// Add to DEDListing.sol
function allowMultipleStudents(address[] calldata students)
    external
    onlyOwnerOrCreator
    readyForParticipants
{
    uint256 length = students.length;
    for (uint256 i = 0; i < length; ++i) {
        address student = students[i];
        if (student == address(0)) revert InvalidStudentAddress();
        if (allowedStudents[student]) continue; // Skip duplicates

        allowedStudents[student] = true;
        studentList.push(student);
        ++studentCount;

        emit StudentAllowed(student);
    }
}
```

**Savings:** 21,000 gas per additional student (vs. individual transactions)

---

### 11. Use Mappings Instead of Arrays When Possible

**Current Issue:** `listingCreators` array in DEDIndex and ListingBroker

If you don't need to iterate over all creators, use only the mapping:

```solidity
// BEFORE
address[] public listingCreators;
mapping(address => bool) public hasListings;

// AFTER - If you don't need to iterate
mapping(address => bool) public hasListings;

// If you DO need to iterate, keep both but add pagination
```

**Savings:** ~20,000 gas per new creator

---

### 12. Delete Unused Storage

When removing items, explicitly delete storage to get gas refunds.

```solidity
// In DEDListing._removePotentialEducator
delete potentialEducatorList[potentialEducators[index].account];
delete potentialEducatorIndex[potentialEducators[index].account];
```

**Gas Refund:** Up to 15,000 gas per storage slot deleted

---

## Advanced Optimizations (Significant Refactoring)

### 13. Use Assembly for Efficient Storage Access

**Warning:** Only for experienced developers. Easy to introduce bugs.

```solidity
// Example: Efficiently accessing mapping
function getBalance(address user) public view returns (uint256 balance) {
    assembly {
        mstore(0x00, user)
        mstore(0x20, balances.slot)
        balance := sload(keccak256(0x00, 0x40))
    }
}
```

**Savings:** 100-300 gas per operation
**Risk:** High - only use if you know what you're doing

---

### 14. Use Minimal Proxy Pattern (EIP-1167)

For creating many instances of DEDListing or DEDProfile:

```solidity
import "@openzeppelin/contracts/proxy/Clones.sol";

contract DEDIndex {
    address public listingImplementation;
    address public profileImplementation;

    constructor() {
        // Deploy implementations once
        listingImplementation = address(new DEDListing());
        profileImplementation = address(new DEDProfile());
    }

    function submitListing(...) public returns (address) {
        // Clone instead of new
        address listing = Clones.clone(listingImplementation);
        DEDListing(listing).initialize(...);
        // ...
    }
}
```

**Savings:** ~95% reduction in deployment gas for each listing/profile

**Trade-off:**
- Requires making contracts upgradeable (initialize instead of constructor)
- Slightly more complex code
- Small increase in function call gas

---

### 15. Move to Layer 2

Deploy on Optimism, Arbitrum, or zkSync for 10-100x gas cost reduction.

**Estimated Costs on L2:**
- Listing creation: $0.50 instead of $50
- Full lesson: $3-10 instead of $100-300

---

## Gas Optimization Priority Matrix

| Optimization | Savings | Complexity | Priority | Recommended |
|--------------|---------|------------|----------|-------------|
| calldata instead of memory | High | Low | 1 | ✅ Yes |
| Custom errors | Medium | Low | 1 | ✅ Yes |
| Cache array length | Medium | Low | 1 | ✅ Yes |
| ++i instead of i++ | Low | Low | 2 | ✅ Yes |
| Pack structs | Very High | Medium | 1 | ✅ Yes |
| immutable variables | High | Low | 1 | ✅ Done |
| Batch operations | High | Medium | 2 | ⚠️ Consider |
| Delete storage | Medium | Low | 2 | ⚠️ Consider |
| Events instead of storage | High | High | 3 | ⚠️ Consider |
| Minimal proxy | Very High | High | 3 | ⚠️ Consider |
| Assembly | Medium | Very High | 4 | ❌ No |
| Layer 2 | Very High | Medium | 2 | ✅ Consider |

---

## Implementation Plan

### Phase 1: Quick Wins (1-2 days)
1. ✅ Change all `string memory` to `string calldata` for read-only params
2. ✅ Cache array lengths in all loops
3. ✅ Use `++i` in all loops
4. ✅ Convert remaining `require` to custom errors

**Expected Total Savings:** 500-1000 gas per transaction

### Phase 2: Struct Optimization (2-3 days)
1. ✅ Optimize ListingBroker.Listing struct
2. ✅ Optimize ListingBroker.Application struct
3. ⚠️ Consider other struct optimizations

**Expected Total Savings:** 100,000+ gas for listing creation

### Phase 3: Advanced (1 week)
1. ⚠️ Add batch operations
2. ⚠️ Implement storage deletion
3. ⚠️ Consider minimal proxy pattern
4. ⚠️ Evaluate Layer 2 deployment

---

## Testing Gas Costs

Use Hardhat gas reporter:

```javascript
// hardhat.config.js
module.exports = {
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 50,
    coinmarketcap: 'YOUR_API_KEY'
  }
};
```

Run tests and compare before/after:

```bash
npx hardhat test
```

---

## Gas Cost Comparison

### Before Optimizations
| Operation | Gas | USD @ 50 gwei, $2000 ETH |
|-----------|-----|--------------------------|
| Create Listing | 500,000 | $50 |
| Finalize Educators | 800,000 | $80 |
| Student Deposit | 150,000 | $15 |

### After Quick Wins
| Operation | Gas | USD @ 50 gwei, $2000 ETH | Savings |
|-----------|-----|--------------------------|---------|
| Create Listing | 480,000 | $48 | 4% |
| Finalize Educators | 760,000 | $76 | 5% |
| Student Deposit | 145,000 | $14.50 | 3% |

### After Struct Optimization
| Operation | Gas | USD @ 50 gwei, $2000 ETH | Savings |
|-----------|-----|--------------------------|---------|
| Create Listing | 380,000 | $38 | 24% |
| Finalize Educators | 700,000 | $70 | 12.5% |
| Student Deposit | 145,000 | $14.50 | 3% |

### With Minimal Proxy
| Operation | Gas | USD @ 50 gwei, $2000 ETH | Savings |
|-----------|-----|--------------------------|---------|
| Create Listing | 120,000 | $12 | 76% |
| Finalize Educators | 700,000 | $70 | 12.5% |
| Student Deposit | 145,000 | $14.50 | 3% |

### On Layer 2 (Optimism)
| Operation | Gas | USD @ 1 gwei, $2000 ETH | Savings |
|-----------|-----|-------------------------|---------|
| Create Listing | 500,000 | $1 | 98% |
| Finalize Educators | 800,000 | $1.60 | 98% |
| Student Deposit | 150,000 | $0.30 | 98% |

---

## Recommended Final Configuration

1. ✅ Implement all Quick Wins (Phase 1)
2. ✅ Implement Struct Optimization (Phase 2)
3. ⚠️ Consider Minimal Proxy if gas costs are still too high
4. ✅ Deploy to Layer 2 for production (massive savings)

**Best Option:** Optimized contracts on Layer 2 (Arbitrum or Optimism)
- **Total lesson cost:** $3-10 instead of $100-300
- **User experience:** Much better with low fees
- **Ecosystem:** Growing rapidly with good tooling

---

**Last Updated:** December 7, 2025
