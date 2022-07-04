// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Context.sol";
import "./Address.sol";

contract Instagram is Context {
    using Address for address;
    address public owner;

    constructor () {
        owner = _msgSender();
    }

    struct Post {
        uint256 id;
        uint256 likeCounter;
        uint256 dislikeCounter;
        uint256 commentCounter;
        uint256 tipAmount;
        string hashImage;
        string descripetion;
        string date;
        address payable author;
    }

    struct Comment {
        uint256 id;
        string comment;
        string date;
        address author;
    }

    struct ActivityAmount {
        uint postsAmount;
        uint commentsAmount;
        uint likesAmount;
        uint dislikesAmount;
        uint tipAmount;     // how many ethers have tiped by from account
    }



    mapping(address => ActivityAmount) public activitiesAmount;
    mapping(uint256 => Post) public posts;
    // mapping(address => mapping(uint => uint)) public addLikeTime;  // timeActivity[msg.sender][idpost] = 1601454252 secends
    mapping(uint256 => mapping(uint256 => Comment)) public comments; // coments[idpost][idcomment] = 97
    mapping(uint256 => mapping(uint256 => address)) public likes; // coments[idpost][likeCounter] = 0xjfiwj1daaf24..   mapping(uint256 => mapping(uint256 => address)) public dislikes;
    mapping(uint256 => mapping(uint256 => address)) public dislikes;
    mapping(address => uint256[]) public timeListActivities;
    mapping(address => uint256[]) public listActiviies;

    event PostCreat(
        uint256 id,
        string hashImage,
        string descripetion,
        address payable author
    );
    event CommentCreated(
        uint256 idPost,
        uint256 idComment,
        string comment,
        address author
    );
    event TipPosted(
        uint256 id,
        uint256 amount,
        address currentAccount,
        address payable author
    );
    event NewShortcut(string icon);

    modifier onlyOwner() {
        require(_msgSender() == owner, "Instagram: only owner can call it!");
        _;
    }

    uint256 public postCounter;

    string[] public shortcutList;

    function getTimeListActivities(address user) public view returns(uint256[] memory) {
        return timeListActivities[user];
    }

    function getListActivities(address user) public view returns(uint256[] memory) {
        return listActiviies[user];
    }
 
    function addShortcut(string memory _icon) public onlyOwner() {
        shortcutList.push(_icon);
        emit NewShortcut(_icon);
    }

    function getShortcutList() public view returns (string[] memory) {
        return shortcutList;
    }

    function checkOwner(address user) public view returns(bool) {
        if (user == owner) {
            return true;
        }else{
            return false;
        }
    } 

    function uplodPost(
        string memory hashImg,
        string memory description,
        string memory date
    ) public {
        require(bytes(hashImg).length > 0, "Instagram:incorrect hashImg");
        require(
            bytes(description).length > 0,
            "Instagram:incorrect description"
        );
        require(_msgSender() != address(0), "Instagram:address(0)!");

        posts[postCounter] = Post(
            postCounter,
            0,
            0,
            0,
            0,
            hashImg,
            description,
            date,
            payable(_msgSender())
        );
        activitiesAmount[_msgSender()].postsAmount ++;
        postCounter++;
        uint time = block.timestamp;
        listActiviies[_msgSender()].push(0);
        timeListActivities[_msgSender()].push(time);

        emit PostCreat(
            postCounter,
            hashImg,
            description,
            payable(_msgSender())
        );

    }


    function getActivities(address account) public view returns (ActivityAmount memory) {
                require(
            account != address(0),
            "Insragram: address(0)! "
        );
        return activitiesAmount[account ]; 
    }


    function getPost(uint256 _id) public view returns (Post memory) {
                require(
            _id >= 0 && _id < postCounter,
            "Insragram: This Id AddLike Incorrect"
        );
        return posts[_id];
    }

    function addLike(uint256 _id) public {
        require(
            _id >= 0 && _id < postCounter,   
            "Instagram:this id add like incorrect"
        );

        uint256 numberLike = posts[_id].likeCounter;
        posts[_id].likeCounter++;
        activitiesAmount[_msgSender()].likesAmount ++;
        likes[_id][numberLike] = _msgSender();
        uint time = block.timestamp;
        timeListActivities[_msgSender()].push(time);
        listActiviies[_msgSender()].push(1);

        // addLikeTime[_msgSender()][_id] = block.timestamp;
    }

    function subLike(uint256 _id) public {
        require(
            _id >= 0 && _id < postCounter,
            "Instagram:this id sub like incorrect"
        );

        uint256 numberLike = posts[_id].likeCounter;
        posts[_id].likeCounter--;
        activitiesAmount[_msgSender()].likesAmount --;
        uint time = block.timestamp;
        timeListActivities[_msgSender()].push(time);
        listActiviies[_msgSender()].push(2);
        delete likes[_id][numberLike];
    }

    function getLikeAddress(uint256 _id)
        public
        view
        returns (
            address[] memory //we have mapping[][] so we can't returns mapping so we returns array ***********
        )
    {
        address[] memory returnn = new address[](posts[_id].likeCounter); // new=>object (posts[_id].likeCounter) is amount of this arrays

        for (uint256 i = 0; i < posts[_id].likeCounter; i++) {
            returnn[i] = likes[_id][i];
        }
        return returnn;
    }


    // function getAddLikeTime(uint _id) public view returns (uint256[] memory) {
    //    uint256[] memory getAddLikesTimes = new uint256[](posts[_id].likeCounter);

    //     for (uint256 i = 0; i < posts[_id].likeCounter; i++) {
    //         getAddLikesTimes[i] = addLikeTime[likes[_id][i]][_id];         
    //     }
    //     return getAddLikesTimes;
    // }

    // function getAddLikeTime(uint _id, address user) public view returns (uint256) {
    //     return addLikeTime[user][_id];
    // }

    function addDislike(uint256 _id) public {
        require(
            _id >= 0 && _id < postCounter,
            "Instagram:this id add like incorrect"
        );

        uint256 numberDisike = posts[_id].dislikeCounter;
        posts[_id].dislikeCounter++;
        activitiesAmount[_msgSender()].dislikesAmount ++;
        dislikes[_id][numberDisike] = _msgSender();
        uint time = block.timestamp;
        timeListActivities[_msgSender()].push(time);
        listActiviies[_msgSender()].push(3);

    }

    function subDislike(uint256 _id) public {
        require(
            _id >= 0 && _id < postCounter,
            "Instagram:this id sub like incorrect"
        );

        uint256 numberDislike = posts[_id].dislikeCounter;
        posts[_id].dislikeCounter--;
        activitiesAmount[_msgSender()].dislikesAmount --;
        delete dislikes[_id][numberDislike];
        uint time = block.timestamp;
        timeListActivities[_msgSender()].push(time);
        listActiviies[_msgSender()].push(4);

    }

    function getDislikeAddress(uint256 _id)
        public
        view
        returns (
            address[] memory //we can't returns mapping so we returns array ***********
        )
    {
        address[] memory returnn = new address[](posts[_id].dislikeCounter);

        for (uint256 i = 0; i < posts[_id].dislikeCounter; i++) {
            returnn[i] = dislikes[_id][i];
        }
        return returnn;
    }

    function addComment(
        uint256 _id,
        string memory _comment,
        string memory date
    ) public {
        require(
            _id >= 0 && _id < postCounter,
            "Instagram:this id sub like incorrect"
        );
        require(bytes(_comment).length > 0, "Instagram:this comment incorrect");

        uint256 count = posts[_id].commentCounter;
        comments[_id][count].id = count;
        comments[_id][count].comment = _comment;
        comments[_id][count].date = date;
        comments[_id][count].author = _msgSender();
        posts[_id].commentCounter++;
        activitiesAmount[_msgSender()].commentsAmount ++;
        uint time = block.timestamp;
        timeListActivities[_msgSender()].push(time);
        listActiviies[_msgSender()].push(5);

        emit CommentCreated(_id, count, _comment, _msgSender());
    }

    function getComments(uint256 _id) public view returns (Comment[] memory) {
        Comment[] memory returnn = new Comment[](posts[_id].commentCounter);

        for (uint256 i = 0; i < posts[_id].commentCounter; i++) {
            returnn[i] = comments[_id][i];
        }
        return returnn;
    }

    function tipPost(uint _id) public payable {
        require(
            _id >= 0 && _id < postCounter,
            "Instagram:this id sub like incorrect"
        );
        
        Post memory post = posts[_id];
        address payable authorAddress = post.author;
        Address.sendValue(authorAddress, msg.value); //Address is library and sendVslue() is for this library 
        post.tipAmount += msg.value;
        activitiesAmount[_msgSender()].tipAmount += msg.value;
        posts[_id] = post;
        uint time = block.timestamp;
        timeListActivities[_msgSender()].push(time);
        listActiviies[_msgSender()].push(6);


        emit TipPosted(_id, msg.value, msg.sender, authorAddress);
    }
}





    