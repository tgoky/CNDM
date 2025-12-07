// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.20;

import {ERC20} from "node_modules/solady/src/tokens/ERC20.sol";
/**
 * @title DEDToken
 * @author <@quigela> <@pynchmeister>
 * @dev ERC20 token for the Decentralized Education Development (DED) platform
 * @dev This token serves as the native currency for educational transactions
 */
contract DEDToken is ERC20 {
    /// @notice The name of the token
    string private _name;
    
    /// @notice The symbol of the token
    string private _symbol;
    
    /// @notice Event emitted when tokens are minted
    /// @param to The address receiving the tokens
    /// @param amount The amount of tokens minted
    event TokensMinted(address indexed to, uint256 amount);
    
    /// @notice Event emitted when tokens are burned
    /// @param from The address whose tokens are burned
    /// @param amount The amount of tokens burned
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * @dev Constructor initializes the token with name and symbol
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     */
    constructor(string memory name_, string memory symbol_) ERC20() {
        require(bytes(name_).length > 0, "Name cannot be empty");
        require(bytes(symbol_).length > 0, "Symbol cannot be empty");
        
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token
     * @return The token name
     */
    function name() public view override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token
     * @return The token symbol
     */
    function symbol() public view override returns (string memory) {
        return _symbol;
    }
    
    /**
     * @dev Returns the total token information
     * @return tokenName The name of the token
     * @return tokenSymbol The symbol of the token
     * @return tokenDecimals The number of decimals
     * @return tokenTotalSupply The total supply
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply
    ) {
        return (name(), symbol(), decimals(), totalSupply());
    }
}