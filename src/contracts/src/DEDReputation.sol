// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.20;

import "node_modules/@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DEDReputation
 * @author <@quigela> <@pynchmeister>
 * @dev Allows both educators and students to give each other reputation scores (1-10)
 * @dev Users can only leave reputation scores after lesson completion
 * @dev Implements a decentralized reputation management system
 */
contract DEDReputation {

    /// @notice Custom errors for better gas efficiency
    error SenderNotStudent();
    error SenderNotEducator();
    error LessonNotCompleted();
    error InvalidReputationScore();
    error AlreadyRated();
    error CannotRateSelf();
    error InvalidAddress();

    /// @notice Reputation score range constants
    uint8 public constant MIN_SCORE = 1;
    uint8 public constant MAX_SCORE = 10;

    /// @notice Struct to store reputation data
    struct ReputationData {
        uint256 totalScore;
        uint256 numberOfRatings;
        uint256 averageScore;
        mapping(address => bool) hasRated;
    }

    /// @notice Mapping to track if a lesson is completed
    mapping(bytes32 => bool) public lessonCompleted;

    /// @notice Mapping to store student reputations
    mapping(address => ReputationData) public studentReputations;

    /// @notice Mapping to store educator reputations
    mapping(address => ReputationData) public educatorReputations;

    /// @notice Mapping to track allowed students for a lesson
    mapping(bytes32 => mapping(address => bool)) public allowedStudents;

        /// @notice Mapping to track allowed educators for a lesson
    mapping(bytes32 => mapping(address => bool)) public allowedEducators;
    
    /// @notice The owner of the contract
    address public immutable owner;
    
    /// @notice Modifier to restrict access to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /// @notice Event emitted when a reputation score is submitted
    /// @param from The address leaving the rating
    /// @param to The address being rated
    /// @param score The reputation score (1-10)
    /// @param lessonId The ID of the lesson
    /// @param isEducatorRating Whether this is an educator rating a student
    event ReputationSubmitted(
        address indexed from,
        address indexed to,
        uint8 score,
        bytes32 indexed lessonId,
        bool isEducatorRating
    );

    /// @notice Event emitted when a lesson is marked as completed
    /// @param lessonId The ID of the lesson
    /// @param student The student address
    /// @param educator The educator address
    event LessonCompleted(bytes32 indexed lessonId, address indexed student, address indexed educator);

    /// @notice Event emitted when participants are added to a lesson
    /// @param lessonId The ID of the lesson
    /// @param participant The participant address
    /// @param isEducator Whether the participant is an educator
    event ParticipantAdded(bytes32 indexed lessonId, address indexed participant, bool isEducator);

    /**
     * @dev Constructor
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Adds a student to a lesson for reputation tracking
     * @param lessonId The unique identifier for the lesson
     * @param student The student's address
     */
    function addStudentToLesson(bytes32 lessonId, address student) external onlyOwner {
        require(student != address(0), "Invalid student address");
        allowedStudents[lessonId][student] = true;
        emit ParticipantAdded(lessonId, student, false);
    }

    /**
     * @dev Adds an educator to a lesson for reputation tracking
     * @param lessonId The unique identifier for the lesson
     * @param educator The educator's address
     */
    function addEducatorToLesson(bytes32 lessonId, address educator) external onlyOwner {
        require(educator != address(0), "Invalid educator address");
        allowedEducators[lessonId][educator] = true;
        emit ParticipantAdded(lessonId, educator, true);
    }

    /**
     * @dev Marks a lesson as completed, allowing reputation scores to be submitted
     * @param lessonId The unique identifier for the lesson
     * @param student The student's address
     * @param educator The educator's address
     */
    function markLessonCompleted(bytes32 lessonId, address student, address educator) external onlyOwner {
        require(student != address(0) && educator != address(0), "Invalid addresses");
        require(allowedStudents[lessonId][student], "Student not in lesson");
        require(allowedEducators[lessonId][educator], "Educator not in lesson");
        
        lessonCompleted[lessonId] = true;
        emit LessonCompleted(lessonId, student, educator);
    }

    /**
     * @dev Allows a student to rate an educator after lesson completion
     * @param lessonId The unique identifier for the lesson
     * @param educator The educator being rated
     * @param score The reputation score (1-10)
     */
    function rateEducator(bytes32 lessonId, address educator, uint8 score) external {
        // Validations
        if (!allowedStudents[lessonId][msg.sender]) revert SenderNotStudent();
        if (!allowedEducators[lessonId][educator]) revert InvalidAddress();
        if (!lessonCompleted[lessonId]) revert LessonNotCompleted();
        if (score < MIN_SCORE || score > MAX_SCORE) revert InvalidReputationScore();
        if (msg.sender == educator) revert CannotRateSelf();
        if (educatorReputations[educator].hasRated[msg.sender]) revert AlreadyRated();

        // Update reputation data
        ReputationData storage repData = educatorReputations[educator];
        repData.totalScore += score;
        repData.numberOfRatings += 1;
        repData.averageScore = repData.totalScore / repData.numberOfRatings;
        repData.hasRated[msg.sender] = true;

        emit ReputationSubmitted(msg.sender, educator, score, lessonId, false);
    }

    /**
     * @dev Allows an educator to rate a student after lesson completion
     * @param lessonId The unique identifier for the lesson
     * @param student The student being rated
     * @param score The reputation score (1-10)
     */
    function rateStudent(bytes32 lessonId, address student, uint8 score) external {
        // Validations
        if (!allowedEducators[lessonId][msg.sender]) revert SenderNotEducator();
        if (!allowedStudents[lessonId][student]) revert InvalidAddress();
        if (!lessonCompleted[lessonId]) revert LessonNotCompleted();
        if (score < MIN_SCORE || score > MAX_SCORE) revert InvalidReputationScore();
        if (msg.sender == student) revert CannotRateSelf();
        if (studentReputations[student].hasRated[msg.sender]) revert AlreadyRated();

        // Update reputation data
        ReputationData storage repData = studentReputations[student];
        repData.totalScore += score;
        repData.numberOfRatings += 1;
        repData.averageScore = repData.totalScore / repData.numberOfRatings;
        repData.hasRated[msg.sender] = true;

        emit ReputationSubmitted(msg.sender, student, score, lessonId, true);
    }

    /**
     * @dev Gets the reputation data for an educator
     * @param educator The educator's address
     * @return totalScore The total score received
     * @return numberOfRatings The number of ratings received
     * @return averageScore The average score
     */
    function getEducatorReputation(address educator) external view returns (
        uint256 totalScore,
        uint256 numberOfRatings,
        uint256 averageScore
    ) {
        ReputationData storage repData = educatorReputations[educator];
        return (repData.totalScore, repData.numberOfRatings, repData.averageScore);
    }

    /**
     * @dev Gets the reputation data for a student
     * @param student The student's address
     * @return totalScore The total score received
     * @return numberOfRatings The number of ratings received
     * @return averageScore The average score
     */
    function getStudentReputation(address student) external view returns (
        uint256 totalScore,
        uint256 numberOfRatings,
        uint256 averageScore
    ) {
        ReputationData storage repData = studentReputations[student];
        return (repData.totalScore, repData.numberOfRatings, repData.averageScore);
    }

    /**
     * @dev Checks if a user has already rated another user for a specific lesson
     * @param lessonId The unique identifier for the lesson
     * @param rater The address of the person who would be rating
     * @param ratee The address of the person being rated
     * @param isEducatorRating Whether this is an educator rating a student
     * @return True if already rated, false otherwise
     */
    function hasRated(bytes32 lessonId, address rater, address ratee, bool isEducatorRating) 
        external 
        view 
        returns (bool) 
    {
        if (isEducatorRating) {
            return studentReputations[ratee].hasRated[rater];
        } else {
            return educatorReputations[ratee].hasRated[rater];
        }
    }
}
