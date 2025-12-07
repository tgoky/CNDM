// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.20;

import "node_modules/@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "node_modules/solady/src/utils/ReentrancyGuard.sol";
import "./DEDEscrow.sol";
import "./PaymentSplitter.sol";

/**
 * @title DEDListing
 * @author <@quigela> <@pynchmeister>
 * @dev A smart contract that manages lessons, student and educator rosters, and payments.
 * @dev Implements a complete lifecycle for educational lessons with escrow and payment splitting.
 */
contract DEDListing is ReentrancyGuard {

    /// @notice Custom errors for better gas efficiency
    error SenderNotStudent();
    error SenderNotEducator();
    error EscrowNotEstablished();
    error EscrowAlreadyEstablished();
    error RosterChangesUnapplicableCurrently();
    error PaymentUnapplicableCurrently();
    error ConfirmationUnapplicableCurrently();
    error SessionTerminationUnapplicableCurrently();
    error InvalidEducatorAddress();
    error InvalidStudentAddress();
    error EducatorAlreadyAdded();
    error EducatorNotInList();
    error StudentAlreadyAllowed();
    error StudentNotAllowed();
    error NoEducatorsAdded();
    error InvalidDepositAmount();
    error InsufficientDeposit();
    error EscrowStateInvalid();
    error EmptyString();

    /// @notice The state of a Listing
    enum ListingState { 
        Created, 
        AcceptingParticipants,
        AcceptingDeposit,
        AwaitingConfirm,
        InProgress,
        Refunded,
        Released
    }
    
    /// @notice Current state of the listing
    ListingState public state = ListingState.Created;

    /// @notice Lesson metadata
    string public topic;
    string public subject;
    string public objectives;           // lesson criteria
    uint256 public postAmount;          // lesson cost
    
    /// @notice Student management
    mapping (address => bool) public allowedStudents;
    uint256 public studentCount;
    
    /// @notice Educator management
    mapping(address => uint256) public potentialEducatorIndex;
    mapping(address => bool) public potentialEducatorList;
    PotentialEducator[] public potentialEducators;
    mapping(address => bool) public allowedEducators;
    uint256 public educatorCount;
    
    /// @notice Payment tracking
    mapping(address => uint256) public studentDeposits;
    uint256 public totalDeposits;
    
    /// @notice Escrow and payment splitter addresses
    address payable public escrow;
    address public outputSplitter;
    
    /// @notice The owner of the contract (usually DEDIndex)
    address public immutable owner;
    
    /// @notice The creator of the listing (the actual user who created it)
    address public immutable creator;
    
    /// @notice Events
    event StudentAllowed(address indexed student);
    event StudentDisallowed(address indexed student);
    event PossibleEducatorAdded(address indexed educator);
    event PossibleEducatorRemoved(address indexed educator);
    event ListingConfirmed();
    event EscrowReady();
    event InfoUpdate();
    event DepositReceived(address indexed student, uint256 amount);
    event EscrowReleased();
    event EscrowRefunded();
    
    /// @notice Struct for potential educator metadata
    struct PotentialEducator {
        address account;
        uint256 shares;
        uint256 index;
    }

    /// @notice Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /// @notice Modifier that allows either the owner or creator to call functions
    modifier onlyOwnerOrCreator() {
        require(msg.sender == owner || msg.sender == creator, "Only owner or creator can call this function");
        _;
    }
    
    modifier onlyStudent() {
        if (!allowedStudents[msg.sender]) {
            revert SenderNotStudent();
        }
        _;
    }
    
    modifier onlyEducator() {
        if (!allowedEducators[msg.sender]) { 
            revert SenderNotEducator();
        }
        _;
    }
    
    modifier requireEscrow() {
        if (address(outputSplitter) == address(0x0) || address(escrow) == address(0x0)) {
            revert EscrowNotEstablished();
        }
        _;
    }
    
    modifier requireNoEscrow() {
        if (address(outputSplitter) != address(0x0) || address(escrow) != address(0x0)) {
            revert EscrowAlreadyEstablished();
        }
        _;
    }
    
    modifier readyForParticipants() {
        if (state != ListingState.AcceptingParticipants) {
            revert RosterChangesUnapplicableCurrently();
        } 
        _;
    }
    
    modifier readyForDeposit() {
        if (state != ListingState.AcceptingDeposit) {
            revert PaymentUnapplicableCurrently();
        } 
        _;
    }
    
    modifier readyForConfirm() {
        if (state != ListingState.AwaitingConfirm) {
            revert ConfirmationUnapplicableCurrently();
        }
        _;
    }
    
    modifier readyForTermination() {
        if (state != ListingState.InProgress) {
            revert SessionTerminationUnapplicableCurrently();
        }
        _;
    }

    /**
     * @notice Constructor sets up the initial information for a Listing
     * @param _subject The subject of the lesson
     * @param _topic The topic of the lesson
     * @param _objectives The objectives or criteria of the lesson
     * @param _postAmount The cost of the lesson
     * @param _creator The address of the user who created this listing
     */
    constructor(
        string memory _subject, 
        string memory _topic, 
        string memory _objectives, 
        uint256 _postAmount,
        address _creator
    ) {
        if (bytes(_subject).length == 0) revert EmptyString();
        if (bytes(_topic).length == 0) revert EmptyString();
        if (bytes(_objectives).length == 0) revert EmptyString();
        if (_postAmount == 0) revert InvalidDepositAmount();
        if (_creator == address(0)) revert InvalidStudentAddress();
        
        subject = _subject;
        topic = _topic;
        objectives = _objectives;
        postAmount = _postAmount;
        state = ListingState.AcceptingParticipants;
        owner = msg.sender;
        creator = _creator;
    }
    
    /**
     * @notice Confirms the Listing and moves it to InProgress state
     */
    function confirm() public onlyOwnerOrCreator readyForConfirm {
        state = ListingState.InProgress;
        emit ListingConfirmed();
    }
    
    /**
     * @notice Allows a student to deposit their payment for the lesson
     */
    function studentDeposit() external payable onlyStudent readyForDeposit nonReentrant {
        if (msg.value == 0) revert InvalidDepositAmount();
        if (msg.value != postAmount) revert InvalidDepositAmount();
        
        DEDEscrow _esc = DEDEscrow(escrow);
        _esc.deposit{value: msg.value}(msg.sender);
        
        studentDeposits[msg.sender] = msg.value;
        totalDeposits += msg.value;
        
        emit DepositReceived(msg.sender, msg.value);
        
        // Check if all required deposits are received
        uint256 requiredAmount = postAmount * educatorCount;
        if (totalDeposits >= requiredAmount) {
            state = ListingState.AwaitingConfirm;
        }
    }
    
    /**
     * @notice Releases the escrow to the educators
     */
    function releaseEscrow() external onlyOwnerOrCreator readyForTermination nonReentrant {
        DEDEscrow _esc = DEDEscrow(escrow);

        // Check current escrow state
        DEDEscrow.State currentEscrowState = _esc.state();
        
        // Only proceed if escrow is in Active state
        if (currentEscrowState != DEDEscrow.State.Active) {
            revert EscrowStateInvalid();
        }

        // Update listing state first
        state = ListingState.Released;
        
        // Close the escrow (this will change escrow state from Active to Closed)
        _esc.close();
        
        // The PaymentSplitter (beneficiary) can now withdraw funds
        // Educators can call PaymentSplitter.release() to get their share
        emit EscrowReleased();
    }
    
    /**
     * @notice Refunds the escrow to the students
     */
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
    
    /**
     * @notice Checks if the provided address is a student in the Listing
     * @param whoIs The address to check
     * @return True if the address is a student
     */
    function isStudent(address whoIs) public view returns (bool) {
        return allowedStudents[whoIs];
    }

    /**
     * @notice Checks if the provided address is an educator in the Listing
     * @param whoIs The address to check
     * @return True if the address is an educator
     */
    function isEducator(address whoIs) public view returns (bool) {
        return allowedEducators[whoIs];
    }
    
    /**
     * @notice Gets the creator address of this listing
     * @return The address of the listing creator
     */
    function getCreator() public view returns (address) {
        return creator;
    }
    
    /**
     * @notice Allows a student to join the Listing
     * @param student The student's address
     */
    function allowStudent(address student) external onlyOwnerOrCreator readyForParticipants {
        if (student == address(0)) revert InvalidStudentAddress();
        if (allowedStudents[student]) revert StudentAlreadyAllowed();
        
        allowedStudents[student] = true;
        studentCount++;
        
        emit StudentAllowed(student);
    }
    
    /**
     * @notice Disallows a student from the Listing
     * @param student The student's address
     */
    function disallowStudent(address student) external onlyOwnerOrCreator readyForParticipants {
        if (!allowedStudents[student]) revert StudentNotAllowed();
        
        allowedStudents[student] = false;
        studentCount--;
        
        emit StudentDisallowed(student);
    }
    
    /**
     * @notice Adds a potential educator to the Listing
     * @param educator The educator's address
     * @param shares The payment shares for this educator (default 100)
     */
    function addPotentialEducator(address educator, uint256 shares) external onlyOwnerOrCreator readyForParticipants {
        if (educator == address(0)) revert InvalidEducatorAddress();
        if (potentialEducatorList[educator]) revert EducatorAlreadyAdded();
        if (shares == 0) revert("Shares must be greater than 0");
    
        uint256 i = potentialEducators.length;
        PotentialEducator memory edu = PotentialEducator(educator, shares, i);
        potentialEducators.push(edu);
        potentialEducatorIndex[educator] = i;
        potentialEducatorList[educator] = true;
    
        emit PossibleEducatorAdded(educator);
    }

    /**
     * @notice Removes a potential educator from the Listing
     * @param educator The educator's address
     */
    function removePotentialEducator(address educator) external onlyOwnerOrCreator readyForParticipants {
        if (!potentialEducatorList[educator]) revert EducatorNotInList();
        
        uint256 i = potentialEducatorIndex[educator];
        _removePotentialEducator(i);
        
        emit PossibleEducatorRemoved(educator);
    }
    
    /**
     * @notice Finalizes the list of educators and creates the escrow and payment splitter contracts
     * @return True if successful
     */
    function finalizeEducators() external onlyOwnerOrCreator readyForParticipants nonReentrant returns (bool) {
        if (potentialEducators.length == 0) revert NoEducatorsAdded();
        
        address[] memory payees = new address[](potentialEducators.length);
        uint256[] memory shares = new uint256[](potentialEducators.length);
        
        for (uint256 i = 0; i < potentialEducators.length; i++) {
            PotentialEducator memory e = potentialEducators[i];
            if (potentialEducatorList[e.account]) {
                allowedEducators[e.account] = true;
                payees[i] = e.account;
                shares[i] = e.shares;
                educatorCount++;
            }
        }
        
        outputSplitter = address(new PaymentSplitter(payees, shares));
        address payable payableSplitter = payable(address(outputSplitter));
        
        DEDEscrow _esc = new DEDEscrow(payableSplitter);
        escrow = payable(address(_esc));
        
        state = ListingState.AcceptingDeposit;
        
        emit EscrowReady();
        return true;
    }
    
    /**
     * @notice Updates the information of the Listing
     * @param _subject The new subject
     * @param _topic The new topic
     * @param _objectives The new objectives
     * @param _postAmount The new post amount
     */
    function updateInfo(
        string memory _subject, 
        string memory _topic,
        string memory _objectives, 
        uint256 _postAmount
    ) external onlyOwnerOrCreator readyForParticipants {
        if (bytes(_subject).length == 0) revert EmptyString();
        if (bytes(_topic).length == 0) revert EmptyString();
        if (bytes(_objectives).length == 0) revert EmptyString();
        if (_postAmount == 0) revert InvalidDepositAmount();
        
        subject = _subject;
        topic = _topic;
        objectives = _objectives;
        postAmount = _postAmount;
        
        emit InfoUpdate();
    }

    /**
     * @notice Gets the current listing state as a string
     * @return The state name
     */
    function getStateString() external view returns (string memory) {
        if (state == ListingState.Created) return "Created";
        if (state == ListingState.AcceptingParticipants) return "AcceptingParticipants";
        if (state == ListingState.AcceptingDeposit) return "AcceptingDeposit";
        if (state == ListingState.AwaitingConfirm) return "AwaitingConfirm";
        if (state == ListingState.InProgress) return "InProgress";
        if (state == ListingState.Refunded) return "Refunded";
        if (state == ListingState.Released) return "Released";
        return "Unknown";
    }

    /**
     * @notice Gets all potential educators
     * @return educators Array of educator addresses
     * @return shares Array of their shares
     */
    function getPotentialEducators() external view returns (address[] memory educators, uint256[] memory shares) {
        uint256 count = 0;
        for (uint256 i = 0; i < potentialEducators.length; i++) {
            if (potentialEducatorList[potentialEducators[i].account]) {
                count++;
            }
        }
        
        educators = new address[](count);
        shares = new uint256[](count);
        
        uint256 index = 0;
        for (uint256 i = 0; i < potentialEducators.length; i++) {
            if (potentialEducatorList[potentialEducators[i].account]) {
                educators[index] = potentialEducators[i].account;
                shares[index] = potentialEducators[i].shares;
                index++;
            }
        }
    }

    /**
     * @notice Removes a potential educator from the list by index, updating the internal data structures
     * @param index The index of the potential educator to remove from the list
     */
    function _removePotentialEducator(uint256 index) internal {
        require(index < potentialEducators.length, "Index out of bounds");
        
        potentialEducatorList[potentialEducators[index].account] = false;
        
        // If not the last element, swap with the last element
        if (index != potentialEducators.length - 1) {
            potentialEducators[index] = potentialEducators[potentialEducators.length - 1];
            potentialEducators[index].index = index;
            potentialEducatorIndex[potentialEducators[index].account] = index;
        }
        
        potentialEducators.pop();
    }
}