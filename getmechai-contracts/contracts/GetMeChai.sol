// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./utils/ReentrancyGuard.sol";


/**
 * @title GetMeChai
 * @dev Manages creators, subscriptions, posts, and contributions.
 * Stores all financial & ownership data. Emits events for the frontend.
 *
 * Note: Media, likes, and comments remain off-chain (IPFS / DB).
 */
contract GetMeChai is ReentrancyGuard {
    // --- CONSTANTS ---
    uint256 private constant THIRTY_DAYS_IN_SECONDS = 30 days;

    // --- STRUCTS ---
    struct Creator {
        address wallet;
        string name;
        uint256 subscriptionPrice;
        uint256[] postIds;
        bool isRegistered;
    }

    struct Post {
        uint256 id;
        address creator;
        string ipfsHash;
        bool isFree;
        uint256 contributions;
    }

    struct Subscription {
        uint256 expiry;
        uint256 autoPayBalance;
    }

    // --- STATE ---
    uint256 private nextPostId = 1;
    mapping(address => Creator) public creators;
    mapping(uint256 => Post) public posts;
    mapping(address => mapping(address => Subscription)) public subscriptions;
    mapping(address => uint256) public creatorEarnings;

    // --- EVENTS ---
    event CreatorRegistered(address indexed creator, string name, uint256 price);
    event PostAdded(uint256 indexed postId, address indexed creator, string ipfsHash, bool isFree);
    event Subscribed(address indexed subscriber, address indexed creator, uint256 expiry);
    event AutoPayDeposited(address indexed subscriber, address indexed creator, uint256 amount, uint256 newBalance);
    event SubscriptionRenewed(address indexed subscriber, address indexed creator, uint256 newExpiry, uint256 pricePaid);
    event Contributed(address indexed contributor, uint256 indexed postId, uint256 amount);
    event EarningsWithdrawn(address indexed creator, uint256 amount);

    // --- MODIFIER ---
    modifier onlyCreator() {
        require(creators[msg.sender].isRegistered, "GMC: Not a registered creator");
        _;
    }

    // --- VIEW ---
    function isSubscribed(address _subscriber, address _creator) public view returns (bool) {
        return subscriptions[_subscriber][_creator].expiry > block.timestamp;
    }

    // --- CORE FUNCTIONS ---

    function registerCreator(string calldata _name, uint256 _price) external {
        require(!creators[msg.sender].isRegistered, "GMC: Already registered");
        require(_price > 0, "GMC: Invalid price");

        creators[msg.sender] = Creator({
            wallet: msg.sender,
            name: _name,
            subscriptionPrice: _price,
            postIds: new uint256[](0),
            isRegistered: true
        });

        emit CreatorRegistered(msg.sender, _name, _price);
    }

    function addPost(string calldata _ipfsHash, bool _isFree) external onlyCreator {
        uint256 postId = nextPostId++;
        posts[postId] = Post({
            id: postId,
            creator: msg.sender,
            ipfsHash: _ipfsHash,
            isFree: _isFree,
            contributions: 0
        });

        creators[msg.sender].postIds.push(postId);
        emit PostAdded(postId, msg.sender, _ipfsHash, _isFree);
    }

    function subscribe(address _creator) external payable {
        require(creators[_creator].isRegistered, "GMC: Creator not registered");
        require(msg.sender != _creator, "GMC: Cannot self-subscribe");
        require(!isSubscribed(msg.sender, _creator), "GMC: Already subscribed");

        uint256 price = creators[_creator].subscriptionPrice;
        require(msg.value == price, "GMC: Incorrect ETH amount");

        subscriptions[msg.sender][_creator].expiry = block.timestamp + THIRTY_DAYS_IN_SECONDS;
        creatorEarnings[_creator] += msg.value;

        emit Subscribed(msg.sender, _creator, subscriptions[msg.sender][_creator].expiry);
    }

    function depositAutoPay(address _creator) external payable {
        require(creators[_creator].isRegistered, "GMC: Creator not registered");
        require(msg.value > 0, "GMC: Zero deposit");

        subscriptions[msg.sender][_creator].autoPayBalance += msg.value;

        emit AutoPayDeposited(
            msg.sender,
            _creator,
            msg.value,
            subscriptions[msg.sender][_creator].autoPayBalance
        );
    }

    function renewSubscription(address _creator) external {
        require(creators[_creator].isRegistered, "GMC: Creator not registered");
        require(msg.sender != _creator, "GMC: Invalid self-renew");

        Subscription storage sub = subscriptions[msg.sender][_creator];
        uint256 price = creators[_creator].subscriptionPrice;
        require(sub.autoPayBalance >= price, "GMC: Insufficient balance");

        sub.autoPayBalance -= price;

        uint256 startTime = sub.expiry > block.timestamp ? sub.expiry : block.timestamp;
        sub.expiry = startTime + THIRTY_DAYS_IN_SECONDS;

        creatorEarnings[_creator] += price;
        emit SubscriptionRenewed(msg.sender, _creator, sub.expiry, price);
    }

    function contribute(uint256 _postId) external payable {
        Post storage post = posts[_postId];
        require(post.creator != address(0), "GMC: Invalid post");
        require(msg.value > 0, "GMC: Zero contribution");

        post.contributions += msg.value;
        creatorEarnings[post.creator] += msg.value;

        emit Contributed(msg.sender, _postId, msg.value);
    }

    function withdrawEarnings() external onlyCreator nonReentrant {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount > 0, "GMC: Nothing to withdraw");

        creatorEarnings[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "GMC: Withdraw failed");

        emit EarningsWithdrawn(msg.sender, amount);
    }
}
