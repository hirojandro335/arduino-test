const dsteem = require("dsteem")
const es = require("event-stream")
const steem = require('steem')

const MILLI_SECONDS_TO_COMPLETE = 3000
const MILLI_SECONDS_TO_COMPLETE_WITH_BUFFER = MILLI_SECONDS_TO_COMPLETE + 500
const HOME_DEGREES = 0
const TO_DEGREES = 180
const ACCOUNT_NAME = 'east.autovote'

// Steem Init
const client = new dsteem.Client('https://api.steemit.com')
const stream = client.blockchain.getOperationsStream()

var five = require("johnny-five");
var board = new five.Board({ port: "COM6" });
var account = null;
var last_trx_id = null;

function handler() {
  console.log('move complete')
}

function returnToHome(servo){
  if(servo.value === TO_DEGREES) {
    servo.to(HOME_DEGREES, MILLI_SECONDS_TO_COMPLETE);
  }
}

function loop(servo) {
  console.log('looping every 10 Seconds'); // Output

  steem.api.getAccounts(['east.autovote'], function (err, result) { // Get Account Data
    if (err || !result) { // Check for Errors
      console.log('Error loading account: ' + err); // Output Error
      return;
    }
    account = result[0]; // set account
  });

  if (account) {
    steem.api.getAccountHistory(account.name, -1, 1, function (err, result) { // Get last transactions of account
      if (err || !result) { // Check for errors
        console.log('Error loading account history: ' + err); // Output error
        return;
      }

      result.forEach(function(trans) { // Loop through transactions
          var op = trans[1].op; // Get transaction data

          if (op[0] == 'transfer' && op[1].to == account.name) { // Check if transaction is transfer TO user account
            var current_trx_id = trans[1].trx_id
            if (last_trx_id !== current_trx_id) {
              console.log('new transaction. run servo...'); // Output transaction 
              last_trx_id = current_trx_id
              console.log('last_trx_id', last_trx_id)

              servo.to(TO_DEGREES, MILLI_SECONDS_TO_COMPLETE);
              setTimeout(returnToHome.bind(null, servo), MILLI_SECONDS_TO_COMPLETE_WITH_BUFFER);
            }
          }
      });
    });
  }

}

board.on("ready", function() {
  var servo = new five.Servo({
    pin: 9,
    startAt: 0
  });
  servo.on('move:complete', handler)

  board.repl.inject({
    servo: servo
  });

  steem.api.setOptions({ url: 'https://rpc.buildteam.io' }); // Set Steem Node
  setInterval(loop.bind(null, servo), 10000); // Create Loop

});


