// Contract addresses - update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  DEDToken: '0x55557245B1FD154558c1Ef3dBa459565b9dB69a2', // ✅ Sepolia Deployed
  DEDIndex: '0xAfA25dBF8A5AF87ea1c482139A66764a89973f44', // ✅ IndexOperations Sepolia Deployed
  DEDReputation: '0x3D1FcE8193FB8D3D99eBCF9D4587283072021b59', // ✅ Sepolia Deployed
  ListingBroker: '0x00DE4DE88E4fD624E0278d5D7f49493E74d37064', // ✅ Sepolia Deployed
  // Split Index contracts
  IndexRegistry: '0x42acda9Ac173cBdE6382abF6C2220F34a87343bc', // ✅ Sepolia Deployed
  IndexOperations: '0xAfA25dBF8A5AF87ea1c482139A66764a89973f44', // ✅ Sepolia Deployed
  ListingFactory: '0x2de109Ee75DA6d0CD9C3321e2576600411B2a711', // ✅ Sepolia Deployed (bytecode set)
  ProfileFactory: '0x333D0C688b86aEa531520630F4366b6cd40564ce', // ✅ Sepolia Deployed
} as const

// Helper to check if contracts are configured
export const areContractsConfigured = () => {
  // Check only the main contracts (exclude split Index contracts for now)
  const mainContracts = {
    DEDToken: CONTRACT_ADDRESSES.DEDToken,
    DEDIndex: CONTRACT_ADDRESSES.DEDIndex,
    DEDReputation: CONTRACT_ADDRESSES.DEDReputation,
    ListingBroker: CONTRACT_ADDRESSES.ListingBroker,
  }
  return Object.values(mainContracts).every(addr => addr && addr.length === 42 && addr.startsWith('0x') && addr !== '0x0000000000000000000000000000000000000000')
}

// Deployment instructions
export const DEPLOYMENT_INSTRUCTIONS = {
  DEDListing: {
    description: "Deploy the updated DEDListing.sol with creator parameter support",
    constructor: "constructor(string _subject, string _topic, string _objectives, uint256 _postAmount, address _creator)",
    note: "This contract now supports creator-based permissions"
  },
  DEDProfile: {
    description: "Deploy DEDProfile.sol for user profile management",
    constructor: "constructor()",
    note: "Standard profile contract"
  },
  DEDEscrow: {
    description: "Deploy DEDEscrow.sol for payment escrow functionality",
    constructor: "constructor(address payable _beneficiary)",
    note: "Used for secure payment handling"
  }
} 