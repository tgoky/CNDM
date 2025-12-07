import { ethers } from 'ethers';

// Contract ABI - this would be generated from the compiled contract
const DED_SESSION_ESCROW_ABI = [
  "function recordSession(string memory sessionId, address student, address educator, address arbiter, bytes32 commitment, string memory cid, string memory fileHash, uint256 blockHeight, string memory txHash) external",
  "function getSession(string memory sessionId) external view returns (tuple(string sessionId, address student, address educator, address arbiter, tuple(bytes32 commitment, string cid, string fileHash, uint256 timestamp, uint256 blockHeight, string txHash) sessionProof, uint256 createdAt, uint256 updatedAt, bool disputeActive, address disputeInitiator) session)",
  "function deposit(address refundee) external payable",
  "function close() external",
  "function enableRefunds() external",
  "function beneficiaryWithdraw() external",
  "function withdraw(address payable payee) external",
  "function initiateDispute(string memory sessionId) external",
  "function resolveDispute(string memory sessionId, bool refundToStudent, uint256 payoutAmount, string memory reason) external",
  "function authorizeArbiter(address arbiter, uint256 stakeAmount) external payable",
  "function isAuthorizedArbiter(address arbiter) external view returns (bool)",
  "function getArbiterStake(address arbiter) external view returns (uint256)",
  "function state() external view returns (uint8)",
  "function totalDeposits() external view returns (uint256)",
  "function depositsOf(address refundee) external view returns (uint256)",
  "event SessionRecorded(string indexed sessionId, address indexed student, address indexed educator, bytes32 commitment, string cid, uint256 timestamp)",
  "event DisputeInitiated(string indexed sessionId, address indexed initiator, address indexed arbiter, uint256 timestamp)",
  "event DisputeResolved(string indexed sessionId, address indexed arbiter, bool refundToStudent, uint256 payoutAmount, string reason, uint256 timestamp)",
  "event Deposit(address indexed depositor, address indexed refundee, uint256 amount)",
  "event Withdrawal(address indexed payee, uint256 amount)",
  "event BeneficiaryWithdrawal(address indexed beneficiary, uint256 amount)"
];

export interface SessionProof {
  ipfsCid: string;
  celestiaCommitment: string;
  fileHash: string;
  timestamp: number;
  blockHeight: number;
  txHash: string;
}

export interface SessionData {
  sessionId: string;
  student: string;
  educator: string;
  arbiter: string;
  sessionProof: SessionProof;
  createdAt: number;
  updatedAt: number;
  disputeActive: boolean;
  disputeInitiator: string;
}

export class SessionEscrowService {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;

  constructor(contractAddress: string, provider: ethers.Provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(contractAddress, DED_SESSION_ESCROW_ABI, provider);
  }

  // Set signer for transactions
  setSigner(signer: ethers.Signer) {
    this.signer = signer;
    this.contract = this.contract.connect(signer);
  }

  // Record session on smart contract
  async recordSession(
    sessionId: string,
    student: string,
    educator: string,
    arbiter: string,
    sessionProof: SessionProof
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not set. Please connect wallet first.');
    }

    try {
      const tx = await this.contract.recordSession(
        sessionId,
        student,
        educator,
        arbiter,
        sessionProof.celestiaCommitment,
        sessionProof.ipfsCid,
        sessionProof.fileHash,
        sessionProof.blockHeight,
        sessionProof.txHash
      );

      return tx;
    } catch (error) {
      console.error('Failed to record session on smart contract:', error);
      throw new Error(`Smart contract transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get session data from smart contract
  async getSession(sessionId: string): Promise<SessionData> {
    try {
      const session = await this.contract.getSession(sessionId);
      
      // Convert the contract response to our interface
      return {
        sessionId: session.sessionId,
        student: session.student,
        educator: session.educator,
        arbiter: session.arbiter,
        sessionProof: {
          ipfsCid: session.sessionProof.cid,
          celestiaCommitment: session.sessionProof.commitment,
          fileHash: session.sessionProof.fileHash,
          timestamp: Number(session.sessionProof.timestamp),
          blockHeight: Number(session.sessionProof.blockHeight),
          txHash: session.sessionProof.txHash,
        },
        createdAt: Number(session.createdAt),
        updatedAt: Number(session.updatedAt),
        disputeActive: session.disputeActive,
        disputeInitiator: session.disputeInitiator,
      };
    } catch (error) {
      console.error('Failed to get session from smart contract:', error);
      throw new Error(`Failed to retrieve session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Deposit funds for a session
  async depositFunds(refundee: string, amount: string): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not set. Please connect wallet first.');
    }

    try {
      const tx = await this.contract.deposit(refundee, {
        value: ethers.parseEther(amount)
      });

      return tx;
    } catch (error) {
      console.error('Failed to deposit funds:', error);
      throw new Error(`Deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Close escrow
  async closeEscrow(): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not set. Please connect wallet first.');
    }

    try {
      const tx = await this.contract.close();
      return tx;
    } catch (error) {
      console.error('Failed to close escrow:', error);
      throw new Error(`Close escrow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enable refunds
  async enableRefunds(): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not set. Please connect wallet first.');
    }

    try {
      const tx = await this.contract.enableRefunds();
      return tx;
    } catch (error) {
      console.error('Failed to enable refunds:', error);
      throw new Error(`Enable refunds failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Initiate dispute
  async initiateDispute(sessionId: string): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not set. Please connect wallet first.');
    }

    try {
      const tx = await this.contract.initiateDispute(sessionId);
      return tx;
    } catch (error) {
      console.error('Failed to initiate dispute:', error);
      throw new Error(`Initiate dispute failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Resolve dispute (arbiter only)
  async resolveDispute(
    sessionId: string,
    refundToStudent: boolean,
    payoutAmount: string,
    reason: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Signer not set. Please connect wallet first.');
    }

    try {
      const tx = await this.contract.resolveDispute(
        sessionId,
        refundToStudent,
        ethers.parseEther(payoutAmount),
        reason
      );
      return tx;
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      throw new Error(`Resolve dispute failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get contract state
  async getContractState(): Promise<{
    state: number;
    totalDeposits: string;
    userDeposits: string;
  }> {
    try {
      const [state, totalDeposits, userDeposits] = await Promise.all([
        this.contract.state(),
        this.contract.totalDeposits(),
        this.signer ? this.contract.depositsOf(await this.signer.getAddress()) : 0
      ]);

      return {
        state: Number(state),
        totalDeposits: ethers.formatEther(totalDeposits),
        userDeposits: ethers.formatEther(userDeposits),
      };
    } catch (error) {
      console.error('Failed to get contract state:', error);
      throw new Error(`Failed to get contract state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if address is authorized arbiter
  async isAuthorizedArbiter(address: string): Promise<boolean> {
    try {
      return await this.contract.isAuthorizedArbiter(address);
    } catch (error) {
      console.error('Failed to check arbiter status:', error);
      return false;
    }
  }

  // Get arbiter stake
  async getArbiterStake(address: string): Promise<string> {
    try {
      const stake = await this.contract.getArbiterStake(address);
      return ethers.formatEther(stake);
    } catch (error) {
      console.error('Failed to get arbiter stake:', error);
      return '0';
    }
  }
}

export default SessionEscrowService;
