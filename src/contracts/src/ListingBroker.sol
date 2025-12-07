// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.20;

import {ERC20} from "node_modules/solady/src/tokens/ERC20.sol";
import {ReentrancyGuard} from "node_modules/solady/src/utils/ReentrancyGuard.sol";

/**
 * @title ListingBroker
 * @author <@quigela> <@pynchmeister>
 * @dev A broker for Decentralized Education Development (DED) lessons
 * @dev Manages token-based listing submissions and educational marketplace functionality
 */
contract ListingBroker is ReentrancyGuard {

    /// @notice Custom errors for better gas efficiency
    error AccountNoListings();
    error IndexOutOfBounds();
    error NotEnoughTokenApproved();
    error InvalidTokenAmount();
    error InvalidAddress();
    error EmptyDescription();
    error EmptyObjectives();
    error ListingNotFound();
    error NotAuthorized();
    error InvalidBarterAmount();
    error ApplicationNotFound();

    /// @notice The DED token contract
    ERC20 public immutable token;
    
    /// @notice The owner of the contract
    address public immutable owner;
    
    /// @notice Modifier to restrict access to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /// @notice Platform fee percentage (basis points: 100 = 1%)
    uint256 public platformFeeBps = 250; // 2.5% default
    
    /// @notice Minimum token amount required for listing
    uint256 public minListingAmount = 1e18; // 1 token minimum
    
    /// @notice Maximum token amount allowed for listing
    uint256 public maxListingAmount = 10000e18; // 10,000 tokens maximum
    
    /// @notice Mapping from user address to their listings
    mapping(address => Listing[]) public listings;
    
    /// @notice Array of addresses that have created listings
    address[] public listingCreators;
    
    /// @notice Mapping to track if an address has listings
    mapping(address => bool) public hasListings;
    
    /// @notice Mapping to track listing applications
    mapping(bytes32 => Application[]) public applications;
    
    /// @notice Mapping to track if a listing is active
    mapping(bytes32 => bool) public activeListings;
    
    /// @notice Total number of listings created
    uint256 public totalListings;
    
    /// @notice Total fees collected
    uint256 public totalFeesCollected;

    /// @notice Event emitted when a listing is submitted
    /// @param listingId The unique identifier for the listing
    /// @param creator The creator's address (can be student or teacher)
    /// @param amount The token amount for the lesson
    /// @param subject The subject of study
    /// @param topic The specific topic
    event ListingSubmitted(
        bytes32 indexed listingId,
        address indexed creator,
        uint256 amount,
        bytes32 indexed subject,
        bytes32 topic
    );

    /// @notice Event emitted when a user applies to a listing
    /// @param listingId The listing identifier
    /// @param applicant The applicant's address
    /// @param barterAmount The proposed amount
    /// @param message Additional message from applicant
    event Application(
        bytes32 indexed listingId,
        address indexed applicant,
        uint256 barterAmount,
        string message
    );
    
    /// @notice Event emitted when a creator responds to an applicant's application
    /// @param listingId The listing identifier
    /// @param applicant The applicant's address
    /// @param accepted Whether the application was accepted
    /// @param finalAmount The final agreed amount
    event ApplicationResponse(
        bytes32 indexed listingId,
        address indexed applicant,
        bool accepted,
        uint256 finalAmount
    );
    
    /// @notice Event emitted when a listing is finalized
    /// @param listingId The listing identifier
    /// @param creator The creator's address
    /// @param applicant The applicant's address
    /// @param finalAmount The final amount agreed
    event ListingFinalized(
        bytes32 indexed listingId,
        address indexed creator,
        address indexed applicant,
        uint256 finalAmount
    );
    
    /// @notice Event emitted when platform fees are updated
    /// @param oldFee The old fee percentage
    /// @param newFee The new fee percentage
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    /// @notice Event emitted when listing limits are updated
    /// @param minAmount The new minimum amount
    /// @param maxAmount The new maximum amount
    event ListingLimitsUpdated(uint256 minAmount, uint256 maxAmount);

    /// @notice Struct for listing metadata
    struct Listing {
        bytes32 listingId;
        address creator;  // Can be either a student or teacher
        uint256 amount;
        bytes32 subject;
        bytes32 topic;
        string description;
        string objectives;
        uint256 timestamp;
        bool isActive;
        address selectedApplicant;  // Can be either a student or teacher (whoever is opposite of creator)
        uint256 finalAmount;
    }
    
    /// @notice Struct for applications to listings
    struct Application {
        address applicant;  // Can be either a student or teacher (whoever is opposite of creator)
        uint256 barterAmount;
        string message;
        uint256 timestamp;
        bool isActive;
    }

    /**
     * @dev Constructor initializes the broker with the DED token
     * @param _token The DED token contract address
     */
    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        token = ERC20(_token);
        owner = msg.sender;
    }

    /**
     * @notice Submits a new educational listing
     * @param subject The field of study
     * @param topic The specific sub-discipline
     * @param description A detailed description of the desired lesson
     * @param objectives The learning objectives
     * @param amount The token amount for the lesson
     * @dev Can be called by both students and teachers
     */
    function submitListing(
        bytes32 subject,
        bytes32 topic,
        string memory description,
        string memory objectives,
        uint256 amount
    ) external nonReentrant {
        // Input validation
        if (msg.sender == address(0)) revert InvalidAddress();
        if (amount < minListingAmount || amount > maxListingAmount) revert InvalidTokenAmount();
        if (bytes(description).length == 0) revert EmptyDescription();
        if (bytes(objectives).length == 0) revert EmptyObjectives();
        
        // Transfer tokens from user to contract
        uint256 feeAmount = (amount * platformFeeBps) / 10000;
        uint256 netAmount = amount - feeAmount;
        
        token.transferFrom(msg.sender, address(this), amount);
        
        // Create listing
        bytes32 listingId = keccak256(abi.encodePacked(msg.sender, block.timestamp, totalListings));
        
        Listing memory newListing = Listing({
            listingId: listingId,
            creator: msg.sender,
            amount: amount,
            subject: subject,
            topic: topic,
            description: description,
            objectives: objectives,
            timestamp: block.timestamp,
            isActive: true,
            selectedApplicant: address(0),
            finalAmount: 0
        });
        
        listings[msg.sender].push(newListing);
        
        // Track listing creators
        if (!hasListings[msg.sender]) {
            listingCreators.push(msg.sender);
            hasListings[msg.sender] = true;
        }
        
        activeListings[listingId] = true;
        totalListings++;
        totalFeesCollected += feeAmount;
        
        emit ListingSubmitted(listingId, msg.sender, amount, subject, topic);
    }

    /**
     * @notice Allows users (students or teachers) to apply to a listing
     * @param listingId The listing identifier
     * @param barterAmount The proposed amount (0 to accept original amount)
     * @param message Additional message from applicant
     * @dev Can be called by any user to apply to listings created by others
     */
    function applyToListing(
        bytes32 listingId,
        uint256 barterAmount,
        string memory message
    ) external {
        if (!activeListings[listingId]) revert ListingNotFound();
        if (msg.sender == address(0)) revert InvalidAddress();
        
        // Find the listing
        Listing storage listing = _findListing(listingId);
        if (listing.creator == msg.sender) revert NotAuthorized();
        
        Application memory application = Application({
            applicant: msg.sender,
            barterAmount: barterAmount,
            message: message,
            timestamp: block.timestamp,
            isActive: true
        });
        
        applications[listingId].push(application);
        
        emit Application(listingId, msg.sender, barterAmount, message);
    }

    /**
     * @notice Allows the listing creator to respond to an application
     * @param listingId The listing identifier
     * @param applicantIndex The index of the applicant in the applications array
     * @param accepted Whether to accept the application
     * @param finalAmount The final agreed amount (if accepted)
     * @dev Can be called by the listing creator (student or teacher)
     */
    function respondToApplication(
        bytes32 listingId,
        uint256 applicantIndex,
        bool accepted,
        uint256 finalAmount
    ) external {
        if (!activeListings[listingId]) revert ListingNotFound();
        
        Listing storage listing = _findListing(listingId);
        if (listing.creator != msg.sender) revert NotAuthorized();
        
        Application[] storage appList = applications[listingId];
        if (applicantIndex >= appList.length) revert IndexOutOfBounds();
        
        Application storage application = appList[applicantIndex];
        if (!application.isActive) revert ApplicationNotFound();
        
        if (accepted) {
            if (finalAmount == 0) revert InvalidBarterAmount();
            listing.selectedApplicant = application.applicant;
            listing.finalAmount = finalAmount;
            listing.isActive = false;
            activeListings[listingId] = false;
            
            emit ListingFinalized(listingId, listing.creator, application.applicant, finalAmount);
        }
        
        application.isActive = false;
        emit ApplicationResponse(listingId, application.applicant, accepted, finalAmount);
    }

    /**
     * @notice Gets all listings for a specific address
     * @param user The user's address
     * @return The array of listings
     */
    function getListings(address user) external view returns (Listing[] memory) {
        return listings[user];
    }

    /**
     * @notice Gets all applications for a specific listing
     * @param listingId The listing identifier
     * @return The array of applications
     */
    function getApplications(bytes32 listingId) external view returns (Application[] memory) {
        return applications[listingId];
    }

    /**
     * @notice Gets all listing creators
     * @return Array of addresses that have created listings
     */
    function getListingCreators() external view returns (address[] memory) {
        return listingCreators;
    }

    /**
     * @notice Gets the number of listings for a user
     * @param user The user's address
     * @return The number of listings
     */
    function getListingCount(address user) external view returns (uint256) {
        return listings[user].length;
    }

    /**
     * @notice Gets the number of applications for a listing
     * @param listingId The listing identifier
     * @return The number of applications
     */
    function getApplicationCount(bytes32 listingId) external view returns (uint256) {
        return applications[listingId].length;
    }

    /**
     * @notice Updates the platform fee percentage (owner only)
     * @param newFeeBps The new fee in basis points
     */
    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee cannot exceed 10%");
        uint256 oldFee = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(oldFee, newFeeBps);
    }

    /**
     * @notice Updates the listing amount limits (owner only)
     * @param newMinAmount The new minimum amount
     * @param newMaxAmount The new maximum amount
     */
    function updateListingLimits(uint256 newMinAmount, uint256 newMaxAmount) external onlyOwner {
        require(newMinAmount < newMaxAmount, "Min must be less than max");
        minListingAmount = newMinAmount;
        maxListingAmount = newMaxAmount;
        emit ListingLimitsUpdated(newMinAmount, newMaxAmount);
    }

    /**
     * @notice Allows the owner to withdraw collected fees
     * @param amount The amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(amount <= totalFeesCollected, "Insufficient fees");
        totalFeesCollected -= amount;
        token.transfer(owner, amount);
    }

    /**
     * @notice Emergency function to cancel a listing (owner only)
     * @param listingId The listing identifier
     */
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

    /**
     * @dev Internal function to find a listing by ID
     * @param listingId The listing identifier
     * @return The listing storage reference
     */
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

    /**
     * @notice Gets platform statistics
     * @return totalListingsCount Total number of listings
     * @return totalFees Total fees collected
     * @return activeListingsCount Number of active listings
     * @return totalCreators Number of listing creators
     */
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
}
