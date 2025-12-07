// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.20;

import "./DEDListing.sol";
import "./DEDProfile.sol";

/**
 * @title DEDIndex
 * @author <@quigela> <@pynchmeister>
 * @dev Manages the creation and indexing of educational listings
 */
contract DEDIndex {
    
    /// @notice Mapping from user address to their listings
    mapping(address => DEDListing[]) public listings;
    
    /// @notice Mapping from user address to their profile
    mapping(address => DEDProfile) public profiles;
    
    /// @notice Array of all users who have created listings
    address[] public listingCreators;
    
    /// @notice Mapping to track if a user has been added to listingCreators
    mapping(address => bool) public isListingCreator;
    
    /// @notice Mapping to track if a user has a profile
    mapping(address => bool) public hasProfile;
    
    /// @notice The owner of the contract
    address public immutable owner;
    
    /// @notice Modifier to restrict access to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /// @notice Event emitted when a new listing is submitted
    /// @param poster The address of the listing poster
    /// @param subject The subject of the listing
    /// @param topic The topic of the listing
    /// @param objectives The objectives of the listing
    /// @param postAmount The amount of the listing
    /// @param listingAddress The address of the created listing contract
    event ListingSubmitted(
        address indexed poster, 
        string indexed subject, 
        string topic,
        string objectives, 
        uint256 indexed postAmount,
        address listingAddress
    );
    
    /// @notice Event emitted when a new profile is created
    /// @param user The address of the user
    /// @param profileAddress The address of the created profile contract
    event ProfileCreated(address indexed user, address profileAddress);
    
    /// @notice Event emitted when a listing is removed
    /// @param poster The address of the listing poster
    /// @param listingAddress The address of the removed listing
    event ListingRemoved(address indexed poster, address listingAddress);
    
    /// @notice Custom errors for better gas efficiency
    error EmptySubject();
    error EmptyTopic();
    error EmptyObjectives();
    error InvalidPostAmount();
    error ListingNotFound();
    error ProfileAlreadyExists();
    
    /**
     * @dev Constructor
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice Retrieves the list of listings for a given address
     * @param user The address of the user
     * @return list The array of listings
     */
    function getListings(address user) public view returns (DEDListing[] memory list) {
        return listings[user];
    }
    
    /**
     * @notice Gets the number of listings for a user
     * @param user The address of the user
     * @return The number of listings
     */
    function getListingCount(address user) public view returns (uint256) {
        return listings[user].length;
    }
    
    /**
     * @notice Gets all listing creators
     * @return Array of addresses that have created listings
     */
    function getAllListingCreators() public view returns (address[] memory) {
        return listingCreators;
    }
    
    /**
     * @notice Gets the total number of listing creators
     * @return The number of users who have created listings
     */
    function getListingCreatorsCount() public view returns (uint256) {
        return listingCreators.length;
    }
    
    /**
     * @notice Submits a new listing with the provided details
     * @param _subject The subject of the new listing (max 100 characters)
     * @param _topic The topic of the new listing (max 100 characters)
     * @param _objectives The objectives of the new listing (max 500 characters)
     * @param _postAmount The amount of the new listing (must be > 0)
     * @return newListing The new listing created
     */
    function submitListing(
        string memory _subject, 
        string memory _topic, 
        string memory _objectives, 
        uint256 _postAmount
    ) public returns (DEDListing newListing) {
        // Input validation
        if (bytes(_subject).length == 0) revert EmptySubject();
        if (bytes(_topic).length == 0) revert EmptyTopic();
        if (bytes(_objectives).length == 0) revert EmptyObjectives();
        if (_postAmount == 0) revert InvalidPostAmount();
        
        // Create new listing with creator address
        newListing = new DEDListing(_subject, _topic, _objectives, _postAmount, msg.sender);
        // Owner is set to DEDIndex, creator is set to msg.sender
        
        // Add to listings array
        listings[msg.sender].push(newListing);
        
        // Track listing creator
        if (!isListingCreator[msg.sender]) {
            listingCreators.push(msg.sender);
            isListingCreator[msg.sender] = true;
        }
        
        // Generate profile if needed
        generateProfile();
        
        // Emit event
        emit ListingSubmitted(msg.sender, _subject, _topic, _objectives, _postAmount, address(newListing));
        
        return newListing;
    }
    
    /**
     * @notice Removes a listing at the specified index for the sender
     * @param listingIndex The index of the listing to remove
     */
    function removeListing(uint256 listingIndex) external {
        require(listingIndex < listings[msg.sender].length, "Invalid listing index");
        
        DEDListing listingToRemove = listings[msg.sender][listingIndex];
        
        // Remove from array by swapping with last element
        listings[msg.sender][listingIndex] = listings[msg.sender][listings[msg.sender].length - 1];
        listings[msg.sender].pop();
        
        emit ListingRemoved(msg.sender, address(listingToRemove));
    }
    
    /**
     * @notice Generates a profile for the sender if one doesn't already exist
     */
    function generateProfile() internal {
        if (address(profiles[tx.origin]) == address(0x0)) {
            DEDProfile newProfile = new DEDProfile();
            // Ownership is already set to user in the constructor
            profiles[tx.origin] = newProfile;
            emit ProfileCreated(tx.origin, address(newProfile));
        }
    }
    
    /**
     * @notice Manually creates a profile for a user
     * @param user The address of the user (must be msg.sender)
     */
    function createProfileForUser(address user) external {
        require(user != address(0), "Invalid user address");
        require(user == msg.sender, "Can only create profile for yourself");
        if (address(profiles[user]) != address(0x0)) revert ProfileAlreadyExists();
        
        DEDProfile newProfile = new DEDProfile();
        // Ownership is already set to user in the constructor
        profiles[user] = newProfile;
        emit ProfileCreated(user, address(newProfile));
    }
    
    /**
     * @notice Gets a specific listing by user and index
     * @param user The address of the user
     * @param index The index of the listing
     * @return The listing at the specified index
     */
    function getListingByIndex(address user, uint256 index) external view returns (DEDListing) {
        require(index < listings[user].length, "Invalid listing index");
        return listings[user][index];
    }
}
