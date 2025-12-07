// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.20;

import "node_modules/@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DEDProfile
 * @author <@quigela> <@pynchmeister>
 * @dev Manages user profiles for the DED platform with display names and biographies.
 * @dev Each profile is owned by the user who created it and can only be updated by the owner.
 */
contract DEDProfile {
    
    /// @notice The address of the user who owns this profile
    address public immutable userAddress;
    
    /// @notice The display name of the user
    string public displayName;
    
    /// @notice The biography/description of the user
    string public bio;
    
    /// @notice Modifier to restrict access to owner only
    modifier onlyOwner() {
        require(msg.sender == userAddress, "Only profile owner can call this function");
        _;
    }
    
    /// @notice Event emitted when profile information is updated
    /// @param user The address of the user whose profile was updated
    /// @param displayName The new display name
    /// @param bio The new biography
    event ProfileUpdated(address indexed user, string displayName, string bio);
    
    /// @notice Event emitted when a new profile is created
    /// @param user The address of the user who created the profile
    event ProfileCreated(address indexed user);
    
    /// @dev Constructor initializes the contract with the address that deployed the contract.
    /// @notice Sets the userAddress to the address of the contract's deployer (tx.origin).
    constructor() {
        userAddress = tx.origin;
        emit ProfileCreated(tx.origin);
    }
    
    /**
     * @dev Updates the displayName and bio of the user.
     * @notice Allows the profile owner to update their display name and biography.
     * @param _displayName The new display name for the user (max 50 characters).
     * @param _bio The new biography for the user (max 500 characters).
     * @return A boolean value indicating whether the update was successful.
     */
    function updateInfo(string memory _displayName, string memory _bio) 
        public 
        onlyOwner 
        returns (bool)
    {
        // Input validation
        require(bytes(_displayName).length > 0, "Display name cannot be empty");
        require(bytes(_displayName).length <= 50, "Display name too long (max 50 chars)");
        require(bytes(_bio).length <= 500, "Bio too long (max 500 chars)");
        
        displayName = _displayName;
        bio = _bio;
        
        emit ProfileUpdated(msg.sender, _displayName, _bio);
        
        return true;
    }
    
    /**
     * @dev Returns the profile information as a tuple
     * @return The display name
     * @return The biography
     * @return The user address
     */
    function getProfileInfo() public view returns (string memory, string memory, address) {
        return (displayName, bio, userAddress);
    }
}