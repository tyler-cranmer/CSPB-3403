// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;


contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(address indexed owner, uint indexed txIndex, address indexed to, uint value, bytes data);
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeTransaction(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    struct Transaction{
        address to;
        uint value;
        bytes data; //data to be sent to the to address
        bool executed;
        uint numConfirmations;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public numConfirmationRequired;
    Transaction[] public transactions;

     // mapping from tx index => owner => bool
    mapping(uint => mapping(address => bool)) public isConfirmed;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "You are not an owner of this wallet");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        _;
    }

    modifier notConfirmed(uint _txIndex){
        require(!isConfirmed[_txIndex][msg.sender], "You have already approved this transaction");
        _;
    }

    modifier notExecuted(uint _txIndex){
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    constructor(address[] memory _owner, uint _numConfirmationRequired){
        require(_owner.length > 0, "owners required");
        require(_numConfirmationRequired > 0 && _numConfirmationRequired >= _owner.length, "invalid numConfirmationRequired for amount of owners");

        for(uint i; i < _owner.length; ++i){
            address owner = _owner[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);

        }

        numConfirmationRequired = _numConfirmationRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint _value, bytes calldata _data) external onlyOwner{
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            numConfirmations: 0
        }));

        emit SubmitTransaction(msg.sender,transactions.length - 1, _to,_value, _data); 
    }

    function confirmTransaction(uint _txIndex) public onlyOwner txExists(_txIndex) notConfirmed(_txIndex) notExecuted(_txIndex) {
            Transaction storage transaction = transactions[_txIndex];
            transaction.numConfirmations += 1;
            isConfirmed[_txIndex][msg.sender] = true;

            emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint _txIndex) public onlyOwner txExists(_txIndex)  notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];
        require(transaction.numConfirmations >= numConfirmationRequired, "Not enough owners approved transaction");
        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );

        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint _txIndex) public onlyOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex];

        require(isConfirmed[_txIndex][msg.sender], "tx not confirmed");
        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;

        emit RevokeTransaction(msg.sender, _txIndex);
    }

    function getOwners() public view returns (address[] memory){
        return owners;
    }

    function getTransactionCount() public view returns(uint){
        return transactions.length;
    }

    function getTransaction(uint _txIndex) public view returns(address to, uint value, bytes memory data, bool executed, uint numConfirmations){
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}