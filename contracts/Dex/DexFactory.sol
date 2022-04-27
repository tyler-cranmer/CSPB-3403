// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Token.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract Exchange {
    using SafeMath for uint256;


    //Account that recieves exchange fees
    address public feeAccount;
    uint256 public feePercent;

    // asign the 0 address to ether, to store ether amount
	// in mapping for minimizing storage on the blockchain
    address constant ETHER = address(0);

    // 1st key: token address, 2nd key: deposit user address, value: number of tokens
    mapping(address => mapping(address => uint256)) public token;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;
    uint256 public orderCount;


	event Deposit(address token, address user, uint256 amount, uint256 balance);
	event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp);
    event Cancel (
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    )
    event Trade (
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    )
    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }


    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    //Fallback function for refunding if people send ether to this contract. 
    function() external{
        revert();
    }


    function depositEther() public payble {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    function withdrawEther(uint256 _amount) public {
        require(tokens[ETHER][msg.sender] >= _amount, "Not enough tokens");
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }


/* ERC20 Deposit and withdraw token function */

    function depositToken(address _token, uint256 _amount) public {
        //Shouldnt take in ETHER
        require(_token != ETHER);
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));

        //deposit token amount into mapping
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint _amount) public {
        require(_token != ETHER, "cannot withdraw ETHER");
        require(tokens[_token][msg.sender] => _amount, "Not enough funds");
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));

        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }


    function balanceOf(address _token, address _owner) public view returns (uint256 balance){
        balance = tokens[_token][_owner];
        return balance;
    }


    function makeOrder(address _tokenIn, uint256 _amountIn, address _tokenOut, uint256 _amountOut) public {
        orderCount = orderCount.add(1);
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenIn,
            _amountIn,
            _tokenOut,
            _amoutOut,
            block.timestamp
        )
    }





}