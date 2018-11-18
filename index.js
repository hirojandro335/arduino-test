const steem = require('steem'); // Include Steem Library
const validUrl = require('valid-url'); // Include Valid-URL Library

var account = null;
var outstanding_votes = [];
var isVoting = false;

steem.api.setOptions({ url: 'https://rpc.buildteam.io' }); // Set Steem Node
loop();
setInterval(loop, 10000); // Create Loop

function loop() {
     console.log('looping every 10 Seconds'); // Output

    steem.api.getAccounts(['moonrise'], function (err, result) { // Get Account Data
        if (err || !result) { // Check for Errors
            console.log('Error loading account: ' + err); // Output Error
            return;
        }

        account = result[0]; // set account
    });

    if (account) {
        steem.api.getAccountHistory(account.name, -1, 50, function (err, result) { // Get last 10 transactions of account
            if (err || !result) { // Check for errors
              console.log('Error loading account history: ' + err); // Output error
              return;
            }

            result.forEach(function(trans) { // Loop through transactions
                var op = trans[1].op; // Get transaction data

                if (op[0] == 'transfer' && op[1].to == account.name) { // Check if transaction is transfer TO user account
                  if (validUrl.isUri(op[1].memo)) { // Check if memo contains valid URL
                      checkValidMemo(op);
                  }
                }
            });
          });

        if (outstanding_votes.length > 0 && !isVoting) {
            sendVotes();
        }
    }
}

function sendVotes() {
    isVoting = true;
    vote(outstanding_votes.pop(), function() {
        if (outstanding_votes.length > 0) {
            setTimeout(function () { sendVotes(); }, 5000);
        } else {
            isVoting = false;
        }
    })
}

function vote(vote, callback) {
    console.log('Voting: ' + vote);

    steem.broadcast.vote('5KYzL9NnfdbebTJek4PQYuU2xtPQY4rkNDQiYTA7ZsCHj394pmZ', account.name, vote.author, vote.permlink, 10000, function (err, result) {
        if (err && !result) {
            console.log('Voting failed: ' + err);
            return;
        }

        if (callback) {
            callback();
        }
    });
}

function checkValidMemo(transData) {
    if (isVoting) { // Exit early if bot is already voting
        return;
    }

    const memo = transData[1].memo; // Get Memo

    var permLink = memo.substr(memo.lastIndexOf('/') + 1); // Get permLink from memo
    var author = memo.substring(memo.lastIndexOf('@') + 1, memo.lastIndexOf('/')); // get Author from memo

    steem.api.getContent(author, permLink, function (err, result) { // Get Post Data
        if (err || !result) {
            console.log('Not a valid url / author: ' + err); // Post does not exist
            return;
        }


        var votes = result.active_votes.filter(function(vote) { return vote.voter == account.name; }); // Check if already voted
        console.log(votes);
        if (votes.length > 0 && votes[0].percent > 0) {
            console.log('Already voted on post');
            return;
        }

        outstanding_votes.push({author: result.author, permlink: result.permlink}); // Add vote to outstanding vote list
    });

}