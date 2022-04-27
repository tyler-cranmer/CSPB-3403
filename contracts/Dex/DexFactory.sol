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
    );
    event Trade (
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }


        constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    //Fallback function for refunding if people send ether to this contract. 
    fallback() external {
        revert();
    }


    function depositEther() public payable {
        token[ETHER][msg.sender] = token[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, token[ETHER][msg.sender]);
    }

    function withdrawEther(uint256 _amount) public {
        require(token[ETHER][msg.sender] >= _amount, "Not enough token");
        token[ETHER][msg.sender] = token[ETHER][msg.sender].sub(_amount);
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        emit Withdraw(ETHER, msg.sender, _amount, token[ETHER][msg.sender]);
    }


/* ERC20 Deposit and withdraw token function */

    function depositToken(address _token, uint256 _amount) public {
        //Shouldnt take in ETHER
        require(_token != ETHER);
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));

        //deposit token amount into mapping
        token[_token][msg.sender] = token[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, token[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint _amount) public {
        require(_token != ETHER, "cannot withdraw ETHER");
        require(token[_token][msg.sender] >= _amount, "Not enough funds");
        token[_token][msg.sender] = token[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));

        emit Withdraw(_token, msg.sender, _amount, token[_token][msg.sender]);
    }


    function balanceOf(address _token, address _owner) public view returns (uint256 balance){
        balance = token[_token][_owner];
        return balance;
    }


    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        orderCount = orderCount.add(1);
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );

          emit Order( orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }

    function cancelOrder(uint256 _id) public {
        _Order storage order = orders[_id];
        require(address(order.user) == msg.sender, "Only the owner can cancel the order.");
        require(order.id == _id);
        orderCancelled[_id] = true;
        emit Cancel(order.id, msg.sender, order.tokenGet, order.amountGet, order.tokenGive, order.amountGive, block.timestamp);

    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount, "Not a valid order");
        require(!orderFilled[_id]);
        require(!orderCancelled[_id]);

        _Order storage order = orders[_id];
        _trade(_id, order.user, order.tokenGet, order.amountGet, order.tokenGive, order.amountGive);
        orderFilled[order.id] = true;


    }

    function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {

        uint256 _feeAmount = _amountGet.mul(feePercent).div(100);

		// Execute trade
		// Get sender balance and substract the amount get (including fees)
        token[_tokenGet][msg.sender] = token[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));

        // Get the user balance and add the previous value
        token[_tokenGet][_user] = token[_tokenGet][_user].add(_amountGet);

        // add fee to feeAccount
        token[_tokenGet][feeAccount] = token[_tokenGet][feeAccount].add(_feeAmount);

        // get user balance and subtract the amount get
        token[_tokenGive][_user] = token[_tokenGive][_user].sub(_amountGive);

        //get the sender balance and add the previous value;
        token[_tokenGive][msg.sender] = token[_tokenGive][msg.sender].add(_amountGive);

        emit Trade (_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }


}