// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.20;

import {ReentrancyGuard} from "node_modules/solady/src/utils/ReentrancyGuard.sol";

/**
 * @title DEDEscrow
 * @author <@quigela> <@pynchmeister>
 * @dev Custom escrow that holds funds for a beneficiary, deposited from multiple parties.
 * @dev Features:
 * - Multiple depositors can contribute funds
 * - Beneficiary can withdraw when escrow is closed
 * - Depositors can get refunds when refunds are enabled
 * - State management with Active, Refunding, and Closed states
 * - Reentrancy protection
 * - Pull payment pattern for secure withdrawals
 */
contract DEDEscrow is ReentrancyGuard {

    // ============ Errors ============
    
    error RefundEscrowCanOnlyDepositWhileActive();
    error RefundEscrowCanOnlyCloseWhileActive();
    error RefundEscrowCanOnlyEnableRefundsWhileActive();
    error RefundEscrowBeneficiaryCanOnlyWithdrawWhileClosed();
    error RefundEscrowCanOnlyWithdrawWhileRefunding();
    error RefundEscrowNoFundsToWithdraw();
    error RefundEscrowZeroAddress();
    error RefundEscrowTransferFailed();

    // ============ Events ============
    
    event RefundsClosed();
    event RefundsEnabled();
    event Deposit(address indexed depositor, address indexed refundee, uint256 amount);
    event Withdrawal(address indexed payee, uint256 amount);
    event BeneficiaryWithdrawal(address indexed beneficiary, uint256 amount);

    // ============ State Variables ============
    
    enum State { 
        Active,     // 0 - Accepting deposits
        Refunding,  // 1 - Allowing refunds to depositors
        Closed      // 2 - Beneficiary can withdraw
    }

    State private _state;
    address payable private immutable _beneficiary;
    
    // Track deposits per refundee
    mapping(address => uint256) private _deposits;
    
    // Track total deposits
    uint256 private _totalDeposits;

    // ============ Modifiers ============
    
    modifier onlyBeneficiary() {
        if (msg.sender != _beneficiary) {
            revert("Only the beneficiary can call this function");
        }
        _;
    }

    modifier onlyActive() {
        if (_state != State.Active) {
            revert RefundEscrowCanOnlyDepositWhileActive();
        }
        _;
    }

    modifier onlyRefunding() {
        if (_state != State.Refunding) {
            revert RefundEscrowCanOnlyWithdrawWhileRefunding();
        }
        _;
    }

    modifier onlyClosed() {
        if (_state != State.Closed) {
            revert RefundEscrowBeneficiaryCanOnlyWithdrawWhileClosed();
        }
        _;
    }

    // ============ Constructor ============
    
    /**
     * @dev Constructor.
     * @param beneficiary The beneficiary of the deposits.
     */
    constructor(address payable beneficiary) {
        if (beneficiary == address(0)) {
            revert RefundEscrowZeroAddress();
        }
        _beneficiary = beneficiary;
        _state = State.Active;
    }

    // ============ View Functions ============
    
    /**
     * @return The current state of the escrow.
     */
    function state() public view returns (State) {
        return _state;
    }

    /**
     * @return The beneficiary of the escrow.
     */
    function escrowBeneficiary() public view returns (address) {       
        return _beneficiary;
    }

    /**
     * @dev Returns the amount deposited by a specific refundee.
     * @param refundee The address to check deposits for.
     * @return The amount deposited by the refundee.
     */
    function depositsOf(address refundee) public view returns (uint256) {
        return _deposits[refundee];
    }

    /**
     * @dev Returns the total amount deposited in the escrow.
     * @return The total amount deposited.
     */
    function totalDeposits() public view returns (uint256) {
        return _totalDeposits;
    }

    /**
     * @dev Returns whether refundees can withdraw their deposits (be refunded).
     * @param payee The address to check withdrawal allowance for (ignored in this implementation).
     * @return True if refunds are enabled, false otherwise.
     */
    function withdrawalAllowed(address payee) public view returns (bool) {
        return _state == State.Refunding;
    }

    // ============ State Management Functions ============
    
    /**
     * @dev Stores funds that may later be refunded.
     * @param refundee The address funds will be sent to if a refund occurs.
     */
    function deposit(address refundee) public payable onlyActive {
        if (refundee == address(0)) {
            revert RefundEscrowZeroAddress();
        }
        if (msg.value == 0) {
            revert RefundEscrowNoFundsToWithdraw();
        }
        
        _deposits[refundee] += msg.value;
        _totalDeposits += msg.value;
        
        emit Deposit(msg.sender, refundee, msg.value);
    }

    /**
     * @dev Allows for the beneficiary to withdraw their funds, rejecting
     * further deposits.
     */
    function close() public {
        if (_state != State.Active) {
            revert RefundEscrowCanOnlyCloseWhileActive();
        }
        _state = State.Closed;
        emit RefundsClosed();
    }

    /**
     * @dev Allows for refunds to take place, rejecting further deposits.
     */
    function enableRefunds() public {
        if (_state != State.Active) {
            revert RefundEscrowCanOnlyEnableRefundsWhileActive();
        }
        _state = State.Refunding;
        emit RefundsEnabled();
    }

    // ============ Withdrawal Functions ============
    
    /**
     * @dev Withdraws the beneficiary's funds.
     */
    function beneficiaryWithdraw() external onlyBeneficiary nonReentrant onlyClosed {
        uint256 amount = address(this).balance;
        if (amount == 0) {
            revert RefundEscrowNoFundsToWithdraw();
        }
        
        // Use pull payment pattern for security
        (bool success, ) = _beneficiary.call{value: amount}("");
        if (!success) {
            revert RefundEscrowTransferFailed();
        }
        
        emit BeneficiaryWithdrawal(_beneficiary, amount);
    }

    /**
     * @dev Withdraws the deposited funds for a specific payee.
     * @param payee The address to withdraw funds for.
     */
    function withdraw(address payable payee) public nonReentrant onlyRefunding {
        uint256 payment = _deposits[payee];
        if (payment == 0) {
            revert RefundEscrowNoFundsToWithdraw();
        }
        
        _deposits[payee] = 0;
        _totalDeposits -= payment;
        
        // Use pull payment pattern for security
        (bool success, ) = payee.call{value: payment}("");
        if (!success) {
            revert RefundEscrowTransferFailed();
        }
        
        emit Withdrawal(payee, payment);
    }

    /**
     * @dev Withdraws the deposited funds for the caller.
     */
    function withdrawForCaller() external {
        withdraw(payable(msg.sender));
    }

    // ============ Emergency Functions ============
    
    /**
     * @dev Emergency function to recover stuck tokens (non-ETH).
     * @param token The token contract address.
     * @param to The address to send tokens to.
     * @param amount The amount of tokens to send.
     */
    function emergencyWithdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyBeneficiary {
        if (to == address(0)) {
            revert RefundEscrowZeroAddress();
        }
        
        // This would require an interface for ERC20 tokens
        // For now, this is a placeholder for emergency token recovery
        // Implementation would depend on the specific token interface
    }

    // ============ Receive Function ============
    
    /**
     * @dev Allows the contract to receive ETH.
     */
    receive() external payable {
        // Only allow deposits through the deposit function
        revert("Use deposit() function to send ETH");
    }
}
