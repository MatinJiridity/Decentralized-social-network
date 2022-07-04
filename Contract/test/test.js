const { assert } = require('chai');

const Instagram = artifacts.require('./Instagram.sol');

require('chai').use(require('chai-as-promised')).should

contract('Instagram', (accounts) => {

    let Mycontract

    before(async () => {
        Mycontract = await Instagram.deployed()
    })

    describe('deployment', async () => {
        it('deploy successfully', async () => {
            const address = await Mycontract.address

            assert.notEqual(address, 0x00, 'zero address');
            assert.notEqual(address, '', 'empty');
            assert.notEqual(address, undefined, 'undefined');
            assert.notEqual(address, null, 'null');
        })
    })

    describe('upload post', async () => {
        let result, PostCounter;
        const hash = "ijfiiwej09uj9j3p10jf919h10dh91fejiwh9di04s";

        before(async () => {
            result = await Mycontract.uplodPost(hash, 'this is first POST', '27 Aug 2022 5:5:5', { from: accounts[0] });
            PostCounter = await Mycontract.postCounter();
        })

        it('check Post', async () => {
            let activitiesAmount = await Mycontract.getActivities(accounts[0]);

            assert.equal(PostCounter, 1, 'incorrect post counter')


            const event = result.logs[0].args

            assert.equal(event.id.toNumber(), PostCounter, 'id is incorrect');
            assert.equal(event.hashImage, hash, 'hash image is incorrect');
            assert.equal(event.descripetion, 'this is first POST', 'des is incorrect');
            assert.equal(event.author, accounts[0], 'aothor is address(0)');

            // await Mycontract.uplodPost('', 'this is first POST', '27 Aug 2022 5:5:5', { from: accounts[0] }).should.be.rejected;
            // await Mycontract.uplodPost('hash', '', '27 Aug 2022 5:5:5', { from: accounts[0] }).should.be.rejected;
            // // await Mycontract.uplodPost('', 'this is first POST', '27 Aug 2022 5:5:5', { from: accounts[0] }).should.be.rejected; //should expwct assert are methods in chai shoud mean if hash is empty reject
        })

        it('check list Post', async () => {
            let counter = PostCounter - 1
            const post = await Mycontract.posts(counter)

            let activitiesAmount = await Mycontract.getActivities(accounts[0]);
            assert.equal(activitiesAmount.postsAmount, 1, 'activitiesAmount postsAmount is incoreecte')

            assert.equal(post.id.toNumber(), counter)
            assert.equal(post.likeCounter, '0')
            assert.equal(post.dislikeCounter, '0')
            assert.equal(post.commentCounter, '0')
            assert.equal(post.tipAmount, '0')
            assert.equal(post.hashImage, hash)
            assert.equal(post.descripetion, 'this is first POST')
            assert.equal(post.date, '27 Aug 2022 5:5:5')
            assert.equal(post.author, accounts[0])
        })
    })

    


    describe('Add/Sub Like/disLike', async () => {

        let count, post

        before(async () => {
            PostCounter = await Mycontract.postCounter()
            count = PostCounter - 1
            post = await Mycontract.posts(count)
        })

        it('Add/Sub Like', async () => {
            let activitiesAmount = await Mycontract.getActivities(accounts[0]);

            let likelist

            await Mycontract.addLike(count, { from: accounts[0] })
            likelist = await Mycontract.getLikeAddress(count)

            let postnew = await Mycontract.posts(count)
            assert.equal(postnew.likeCounter.toNumber(), 1, 'likeCounter is incorrect')
            // assert.equal(activitiesAmount.likesAmount, 1, 'activitiesAmount likes amounts is incoreecte')
            assert.equal(likelist[0], accounts[0], 'activitiesAmount accounts is incorrect')

            await Mycontract.subLike(count, { from: accounts[0] })
            likelist = await Mycontract.getLikeAddress(count)

            let activitiesAmount2 = await Mycontract.getActivities(accounts[0]);
            let postnew2 = await Mycontract.posts(count)
            assert.equal(postnew2.likeCounter.toNumber(), 0, 'likeCounter2 is incorrect')
            assert.equal(activitiesAmount2.likesAmount, 0, 'activitiesAmount sub likes amounts is incoreecte')
            assert.equal(likelist[0], undefined, 'accounts2 is incorrect')


        })


        it('Add/Sub disLike', async () => {
            let activitiesAmount = await Mycontract.getActivities(accounts[0]);

            let dislikelist

            await Mycontract.addDislike(count, { from: accounts[0] })
            dislikelist = await Mycontract.getDislikeAddress(count)

            let postnew = await Mycontract.posts(count)
            assert.equal(postnew.dislikeCounter.toNumber(), 1, 'dislikeCounter is incorrect')
            // assert.equal(activitiesAmount.dislikesAmount, 1, 'activitiesAmount add dislikes amounts is incoreecte')
            assert.equal(dislikelist[0], accounts[0], 'accounts is incorrect')

            await Mycontract.subDislike(count, { from: accounts[0] })
            dislikelist = await Mycontract.getDislikeAddress(count)

            let activitiesAmount2 = await Mycontract.getActivities(accounts[0]);
            let postnew2 = await Mycontract.posts(count)
            assert.equal(postnew2.dislikeCounter, 0, 'dislikeCounter2 is incorrect')
            assert.equal(activitiesAmount2.dislikesAmount, 0, 'activitiesAmount sub dislikes amounts is incoreecte')
            assert.equal(dislikelist[0], undefined, 'accounts2 is incorrect')


        })
    })


    describe('add comment', async () => {
        let result, PostCounter, count, post, commentCounter
        before(async () => {
            PostCounter = await Mycontract.postCounter()
            count = PostCounter - 1
            result = await Mycontract.addComment(count, 'post comment', 'march 7:0:9', { from: accounts[0] })
            post = await Mycontract.posts(count) 
            commentCounter = (post.commentCounter.toNumber()) - 1
        })

        it('add comment', async () => {
            const event = result.logs[0].args

            assert.equal(event.idPost.toNumber(), count, 'id is incorrct')
            assert.equal(event.idComment, commentCounter , 'id comment incorrect')
            assert.equal(event.comment, 'post comment', 'comment incorrct')
            assert.equal(event.author, accounts[0], 'author incoorect')
        })

        it('list comments', async () => {
            const Comment = await Mycontract.getComments(count)

            let activitiesAmount = await Mycontract.getActivities(accounts[0]);
            assert.equal(activitiesAmount.commentsAmount, 1, 'activitiesAmount add dislikes amounts is incoreecte')
            
            assert.equal(Comment[0].id, commentCounter, 'id is incorrct')
            assert.equal(Comment[0].comment, 'post comment', 'post  comment incorrect')
            assert.equal(Comment[0].date, 'march 7:0:9', 'date incorrct')
            assert.equal(Comment[0].author, accounts[0], 'author incoorect')
        })
    })

    describe('tip post', async () => {
        let result, PostCounter, count ;
        before(async () => {
            PostCounter = await Mycontract.postCounter()
            count = PostCounter - 1
            post = await Mycontract.posts(count) 
        })

        it('allow user to tip', async () => {
            result = await Mycontract.tipPost(count, { from: accounts[0], value: web3.utils.toWei('1', 'Ether') })
            const event = result.logs[0].args;
            let activitiesAmount = await Mycontract.getActivities(accounts[0]);



            assert.equal(event.id.toNumber(), count, 'id is incorrct')
            assert.equal(event.amount, '1000000000000000000' , 'tip amount comment incorrect')
            assert.equal(activitiesAmount.tipAmount, '1000000000000000000', 'Activity Amount tip amount incorrected')
            assert.equal(event.currentAccount, accounts[0], 'comment incorrct')
            assert.equal(event.author, post.author, 'author incoorect')
        })
    });

});








// describe('add/sub Like & Dislike', async () => {
//     let count, post

//     before(async () => {
//         PostCounter = await Mycontract.postCounter();
//         count = PostCounter - 1
//         post = await Mycontract.posts(count) // no like yet
//     })

//     it('add/sub Like', async () => {
//         let likeList

//         await Mycontract.addLike(count, { from: accounts[0] })
//         likeList = await Mycontract.getLikeAddress(count) // now post liked

//         let postNew = await Mycontract.posts(count) // 
//         assert.equal(postNew.likeCounter.toNumber(), 1, 'like counter is incorrect')
//         assert.equal(likeList[0], accounts[0], 'account incorrect')


//         await Mycontract.subLike(count, { from: accounts[0] })
//         likeList = await Mycontract.getLikeAddress(count)

//         let postNew2 = await Mycontract.posts(count)
//         assert.equal(postNew2.likeCounter.toNumber(), 0, 'sublike counter is incorrect')
//         assert.equal(likeList[0], undefined, 'account is exisist')
//     })

//     it('add/sub Dislike', async () => {
//         let dislikeList

//         await Mycontract.addDislike(count, { from: accounts[0] })
//         dislikeList = await Mycontract.getDislikeAddress(count) // now post liked

//         let postNew = await Mycontract.posts(count) // 
//         assert.equal(postNew.dislikeCounter.toNumber(), 1, 'dislike counter is incorrect')
//         assert.equal(dislikeList[0], accounts[0], 'account incorrect')


//         await Mycontract.subLike(count, { from: accounts[0] })
//         dislikeList = await Mycontract.getDislikeAddress(count)

//         let postNew2 = await Mycontract.posts(count)
//         assert.equal(postNew2.dislikeCounter.toNumber(), 0, 'dis sublike counter is incorrect')
//         assert.equal(dislikeList[0], undefined, 'account is exisist')
//     })
// })














