# Critical Vulnerability Fixes

This document provides step-by-step fixes for all 6 CRITICAL vulnerabilities found in the audit.

---

## Fix 1: Remove tx.origin Usage

### Files to Modify:
1. `src/contracts/src/DEDIndex.sol`
2. `src/contracts/src/DEDProfile.sol`

### DEDIndex.sol Changes:

**Line 176, 179, 180:**
```solidity
// BEFORE
function generateProfile() internal {
    if (address(profiles[tx.origin]) == address(0x0)) {
        DEDProfile newProfile = new DEDProfile();
        profiles[tx.origin] = newProfile;
        emit ProfileCreated(tx.origin, address(newProfile));
    }
}

// AFTER
function generateProfile() internal {
    if (address(profiles[msg.sender]) == address(0x0)) {
        DEDProfile newProfile = new DEDProfile();
        profiles[msg.sender] = newProfile;
        emit ProfileCreated(msg.sender, address(newProfile));
    }
}
```

### DEDProfile.sol Changes:

**Line 43, 44:**
```solidity
// BEFORE
constructor() {
    userAddress = tx.origin;
    emit ProfileCreated(tx.origin);
}

// AFTER
constructor() {
    userAddress = msg.sender;
    emit ProfileCreated(msg.sender);
}
```

---

## Fix 2: Add Access Control to DEDEscrow

### File to Modify:
`src/contracts/src/DEDEscrow.sol`

### Changes:

**Add owner state variable (after line 49):**
```solidity
address payable private immutable _beneficiary;
address private immutable _owner;  // ADD THIS
```

**Update constructor (line 93-99):**
```solidity
// BEFORE
constructor(address payable beneficiary) {
    if (beneficiary == address(0)) {
        revert RefundEscrowZeroAddress();
    }
    _beneficiary = beneficiary;
    _state = State.Active;
}

// AFTER
constructor(address payable beneficiary) {
    if (beneficiary == address(0)) {
        revert RefundEscrowZeroAddress();
    }
    _beneficiary = beneficiary;
    _owner = msg.sender;  // ADD THIS
    _state = State.Active;
}
```

**Add onlyOwner modifier (after line 85):**
```solidity
modifier onlyOwner() {
    require(msg.sender == _owner, "Only owner can call this function");
    _;
}
```

**Update close() function (line 167):**
```solidity
// BEFORE
function close() public {

// AFTER
function close() public onlyOwner {
```

**Update enableRefunds() function (line 178):**
```solidity
// BEFORE
function enableRefunds() public {

// AFTER
function enableRefunds() public onlyOwner {
```

**Add view function for owner (optional, add at end):**
```solidity
/**
 * @return The owner of the escrow.
 */
function owner() public view returns (address) {
    return _owner;
}
```

---

## Fix 3: Fix Refund Logic Bug

### File to Modify:
`src/contracts/src/DEDListing.sol`

### Option A: Remove Automatic Refund (Recommended)

**Replace entire refundEscrow() function (lines 259-278):**

```solidity
// BEFORE
function refundEscrow() external onlyOwnerOrCreator readyForTermination {
    DEDEscrow _esc = DEDEscrow(escrow);
    if (_esc.state() != DEDEscrow.State.Active) {
        revert EscrowStateInvalid();
    }
    state = ListingState.Refunded;
    _esc.enableRefunds();

    // Refund all students who deposited
    for (uint256 i = 0; i < potentialEducators.length; i++) {
        PotentialEducator memory e = potentialEducators[i];
        if (allowedStudents[e.account] && studentDeposits[e.account] > 0) {
            _esc.withdraw(payable(e.account));
        }
    }

    emit EscrowRefunded();
}

// AFTER
function refundEscrow() external onlyOwnerOrCreator readyForTermination {
    DEDEscrow _esc = DEDEscrow(escrow);
    if (_esc.state() != DEDEscrow.State.Active) {
        revert EscrowStateInvalid();
    }
    state = ListingState.Refunded;
    _esc.enableRefunds();

    // Students can now call escrow.withdrawForCaller() themselves
    // This is safer and more gas efficient

    emit EscrowRefunded();
}
```

### Option B: Track Students and Refund Them (More Complex)

If you want automatic refunds, you need to track students:

**Add student tracking (after line 61):**
```solidity
mapping (address => bool) public allowedStudents;
uint256 public studentCount;
address[] public studentList;  // ADD THIS to track all students
```

**Update allowStudent() function (line 310):**
```solidity
function allowStudent(address student) external onlyOwnerOrCreator readyForParticipants {
    if (student == address(0)) revert InvalidStudentAddress();
    if (allowedStudents[student]) revert StudentAlreadyAllowed();

    allowedStudents[student] = true;
    studentList.push(student);  // ADD THIS
    studentCount++;

    emit StudentAllowed(student);
}
```

**Update disallowStudent() function (line 324):**
```solidity
function disallowStudent(address student) external onlyOwnerOrCreator readyForParticipants {
    if (!allowedStudents[student]) revert StudentNotAllowed();

    allowedStudents[student] = false;

    // Remove from studentList
    for (uint256 i = 0; i < studentList.length; i++) {
        if (studentList[i] == student) {
            studentList[i] = studentList[studentList.length - 1];
            studentList.pop();
            break;
        }
    }

    studentCount--;

    emit StudentDisallowed(student);
}
```

**Update refundEscrow() function:**
```solidity
function refundEscrow() external onlyOwnerOrCreator readyForTermination {
    DEDEscrow _esc = DEDEscrow(escrow);
    if (_esc.state() != DEDEscrow.State.Active) {
        revert EscrowStateInvalid();
    }
    state = ListingState.Refunded;
    _esc.enableRefunds();

    // Refund all students who deposited
    for (uint256 i = 0; i < studentList.length; i++) {
        address student = studentList[i];
        if (studentDeposits[student] > 0) {
            _esc.withdraw(payable(student));
        }
    }

    emit EscrowRefunded();
}
```

**RECOMMENDATION: Use Option A** - Let students withdraw themselves. It's simpler, more gas efficient, and safer.

---

## Fix 4: Fix Unbounded Loop DoS

### File to Modify:
`src/contracts/src/ListingBroker.sol`

### Changes:

**Add mapping for direct lookup (after line 66):**
```solidity
uint256 public totalListings;
uint256 public totalFeesCollected;

// ADD THESE
struct ListingLocation {
    address creator;
    uint256 index;
    bool exists;
}
mapping(bytes32 => ListingLocation) private listingLocations;
```

**Update submitListing() function (add after line 210):**
```solidity
listings[msg.sender].push(newListing);

// ADD THIS - Track listing location
listingLocations[listingId] = ListingLocation({
    creator: msg.sender,
    index: listings[msg.sender].length - 1,
    exists: true
});

// Track listing creators
if (!hasListings[msg.sender]) {
```

**Replace entire _findListing() function (lines 395-405):**
```solidity
// BEFORE
function _findListing(bytes32 listingId) internal view returns (Listing storage) {
    for (uint256 i = 0; i < listingCreators.length; i++) {
        address creator = listingCreators[i];
        for (uint256 j = 0; j < listings[creator].length; j++) {
            if (listings[creator][j].listingId == listingId) {
                return listings[creator][j];
            }
        }
    }
    revert ListingNotFound();
}

// AFTER
function _findListing(bytes32 listingId) internal view returns (Listing storage) {
    ListingLocation memory loc = listingLocations[listingId];
    if (!loc.exists) revert ListingNotFound();
    return listings[loc.creator][loc.index];
}
```

**Important:** If you implement listing removal/cancellation, you must update the `listingLocations` mapping accordingly.

**Update getPlatformStats() to be more efficient (lines 414-431):**
```solidity
// BEFORE
function getPlatformStats() external view returns (
    uint256 totalListingsCount,
    uint256 totalFees,
    uint256 activeListingsCount,
    uint256 totalCreators
) {
    uint256 activeCount = 0;
    for (uint256 i = 0; i < listingCreators.length; i++) {
        address creator = listingCreators[i];
        for (uint256 j = 0; j < listings[creator].length; j++) {
            if (listings[creator][j].isActive) {
                activeCount++;
            }
        }
    }

    return (totalListings, totalFeesCollected, activeCount, listingCreators.length);
}

// AFTER - Add activeListingsCount state variable
uint256 public activeListingsCount;  // Add this to state variables

// Update in submitListing
activeListingsCount++;  // Add when creating listing

// Then simplify getPlatformStats
function getPlatformStats() external view returns (
    uint256 totalListingsCount,
    uint256 totalFees,
    uint256 activeListingsTotal,
    uint256 totalCreators
) {
    return (totalListings, totalFeesCollected, activeListingsCount, listingCreators.length);
}

// Update activeListingsCount when listings are finalized or cancelled
```

---

## Fix 5: Add Token Minting

### File to Modify:
`src/contracts/src/DEDToken.sol`

### Changes:

**Add owner and max supply (after line 16):**
```solidity
string private _symbol;

// ADD THESE
address public immutable owner;
uint256 public constant MAX_SUPPLY = 1_000_000_000e18; // 1 billion tokens
```

**Update constructor (lines 33-39):**
```solidity
// BEFORE
constructor(string memory name_, string memory symbol_) ERC20() {
    require(bytes(name_).length > 0, "Name cannot be empty");
    require(bytes(symbol_).length > 0, "Symbol cannot be empty");

    _name = name_;
    _symbol = symbol_;
}

// AFTER
constructor(string memory name_, string memory symbol_) ERC20() {
    require(bytes(name_).length > 0, "Name cannot be empty");
    require(bytes(symbol_).length > 0, "Symbol cannot be empty");

    _name = name_;
    _symbol = symbol_;
    owner = msg.sender;

    // Mint initial supply to deployer
    _mint(msg.sender, MAX_SUPPLY);
    emit TokensMinted(msg.sender, MAX_SUPPLY);
}
```

**Add burn function (at end of contract):**
```solidity
/**
 * @dev Burns tokens from the caller's balance
 * @param amount The amount of tokens to burn
 */
function burn(uint256 amount) external {
    _burn(msg.sender, amount);
    emit TokensBurned(msg.sender, amount);
}

/**
 * @dev Burns tokens from a specific address (requires allowance)
 * @param from The address to burn from
 * @param amount The amount of tokens to burn
 */
function burnFrom(address from, uint256 amount) external {
    uint256 currentAllowance = allowance(from, msg.sender);
    require(currentAllowance >= amount, "Insufficient allowance");

    _approve(from, msg.sender, currentAllowance - amount);
    _burn(from, amount);
    emit TokensBurned(from, amount);
}
```

---

## Fix 6: Fix Fee Accounting in Emergency Cancel

### File to Modify:
`src/contracts/src/ListingBroker.sol`

### Changes:

**Replace entire emergencyCancelListing() function (lines 377-388):**

```solidity
// BEFORE
function emergencyCancelListing(bytes32 listingId) external onlyOwner {
    if (!activeListings[listingId]) revert ListingNotFound();

    Listing storage listing = _findListing(listingId);
    listing.isActive = false;
    activeListings[listingId] = false;

    // Refund the creator
    uint256 feeAmount = (listing.amount * platformFeeBps) / 10000;
    uint256 refundAmount = listing.amount - feeAmount;
    token.transfer(listing.creator, refundAmount);
}

// AFTER
function emergencyCancelListing(bytes32 listingId) external onlyOwner {
    if (!activeListings[listingId]) revert ListingNotFound();

    Listing storage listing = _findListing(listingId);
    listing.isActive = false;
    activeListings[listingId] = false;

    // Calculate fee
    uint256 feeAmount = (listing.amount * platformFeeBps) / 10000;

    // Refund full amount to creator
    token.transfer(listing.creator, listing.amount);

    // Adjust fee accounting (subtract the fee we're refunding)
    totalFeesCollected -= feeAmount;

    // Update active listings count if you implemented it
    activeListingsCount--;

    emit ListingCancelled(listingId, listing.creator);  // Add this event
}
```

**Add event at the top of contract:**
```solidity
event ListingFinalized(...);

// ADD THIS
event ListingCancelled(bytes32 indexed listingId, address indexed creator);
```

---

## Testing After Fixes

After applying all fixes, run these tests:

### Test 1: tx.origin Fix
```javascript
// Test that profiles are created for msg.sender, not tx.origin
it("should create profile for msg.sender when called through another contract", async () => {
    const intermediateContract = await deployIntermediate();
    await intermediateContract.submitListingViaIndex();
    // Verify profile created for intermediateContract, not for original caller
});
```

### Test 2: Escrow Access Control
```javascript
it("should revert when non-owner tries to close escrow", async () => {
    await expect(
        escrow.connect(attacker).close()
    ).to.be.revertedWith("Only owner can call this function");
});
```

### Test 3: Refund Logic
```javascript
it("should allow students to withdraw after refund is enabled", async () => {
    await listing.refundEscrow();
    await escrow.connect(student).withdrawForCaller();
    // Verify student received refund
});
```

### Test 4: Listing Lookup Performance
```javascript
it("should find listing in O(1) time", async () => {
    // Create 1000 listings
    for (let i = 0; i < 1000; i++) {
        await broker.submitListing(...);
    }
    // Finding a listing should not exceed gas limit
    const listing = await broker._findListing(listingId);
});
```

### Test 5: Token Minting
```javascript
it("should mint initial supply to owner", async () => {
    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(MAX_SUPPLY);
});
```

### Test 6: Fee Accounting
```javascript
it("should correctly adjust fees when emergency cancelling", async () => {
    const feesBefore = await broker.totalFeesCollected();
    await broker.emergencyCancelListing(listingId);
    const feesAfter = await broker.totalFeesCollected();

    const expectedFeeReduction = (listingAmount * platformFeeBps) / 10000;
    expect(feesBefore.sub(feesAfter)).to.equal(expectedFeeReduction);
});
```

---

## Deployment Order After Fixes

1. Deploy DEDToken (with initial supply)
2. Deploy DEDIndex
3. Deploy DEDReputation
4. Deploy ListingBroker (with DEDToken address)
5. Test on testnet thoroughly
6. External audit
7. Deploy to mainnet

---

## Verification Checklist

After applying all fixes:

- [ ] All `tx.origin` replaced with `msg.sender`
- [ ] DEDEscrow has `_owner` and access control on `close()` and `enableRefunds()`
- [ ] DEDListing refund logic simplified (students withdraw themselves)
- [ ] ListingBroker uses mapping for O(1) lookups
- [ ] DEDToken mints initial supply in constructor
- [ ] ListingBroker emergency cancel adjusts fee accounting
- [ ] All tests pass
- [ ] Gas costs measured and acceptable
- [ ] Deployed to testnet and tested end-to-end

---

**CRITICAL:** Do NOT deploy to mainnet until:
1. All 6 critical fixes are applied
2. All tests pass with >95% coverage
3. Professional security audit is completed
4. Testnet has been running successfully for at least 2 weeks
