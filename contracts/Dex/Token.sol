// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Token {
    using SafeMath for uint256;

    string public name;
    string public symbol;
    uint256 public totalSupply;
    uint256 public decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowances;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupplyAmount
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupplyAmount * (10**decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function getBalance(address _owner) public view returns (uint256 balance) {
        balance = balanceOf[_owner];
        return balance;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(
            balanceOf[msg.sender] >= _value,
            "Not enough funds for transfer"
        );
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        require(_from != address(0), "ERC20: transfer from the zero address");
        require(_to != address(0), "ERC20: transfer to the zero address");
        balanceOf[_from] = balanceOf[_from].sub(_amount);
        balanceOf[_to] = balanceOf[_to].add(_amount);
        emit Transfer(_from, _to, _amount);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool) {
        require(_value <= balanceOf[_from]);
        require(_value <= allowances[_from][msg.sender]);
        allowances[_from][msg.sender] = allowances[_from][msg.sender].sub(
            _value
        );
        _transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_spender != address(0), "ERC20: approve to the zero address");
        allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
}
