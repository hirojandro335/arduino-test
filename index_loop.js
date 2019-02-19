require('dotenv').config()

const steem = require('steem')
var five = require("johnny-five");
var board = new five.Board({ port: "COM6" });
const player = require('node-wav-player');

const LOOP_SPEED = 3000
const AUDIO_PLAY_DURATION = 10000
const MILLI_SECONDS_TO_COMPLETE = 3000
const MILLI_SECONDS_TO_COMPLETE_WITH_BUFFER = MILLI_SECONDS_TO_COMPLETE + 500
const HOME_DEGREES = 0
const TO_DEGREES = 180

const ACCOUNT_NAME = (process.env.ACCOUNT_NAME || 'east.autovote')
const STEEM_FEE = (process.env.STEEM_FEE || '1.000')
const SBD_FEE = (process.env.SBD_FEE || '1.000')

let account = null;
let last_trx_id = null;

function returnToHome(servo){
  if(servo.value === TO_DEGREES) {
    servo.to(HOME_DEGREES, MILLI_SECONDS_TO_COMPLETE);
  }
}

function greetDog() {
  player.play({
    path: './audio/bark.wav',
  }).then(() => {
    console.log('The wav file started to play.');
  }).catch((error) => {
    console.error(error);
  });

  setTimeout(() => {
    player.stop();
    console.log('Audio play stopped.')
  }, AUDIO_PLAY_DURATION);
}

function feedDog(servo) {
  servo.to(TO_DEGREES, MILLI_SECONDS_TO_COMPLETE);
  setTimeout(returnToHome.bind(null, servo), MILLI_SECONDS_TO_COMPLETE_WITH_BUFFER);
}

function loop(servo) {
  console.log('looping every ' + (LOOP_SPEED)/1000 + ' seconds'); // Output

  steem.api.getAccounts([ACCOUNT_NAME], function (err, result) { // Get Account Data
    if (err || !result) { // Check for Errors
      console.log('Error loading account: ' + err); // Output Error
      return;
    }
    account = result[0]; // set account
  });

  if (account) {
    steem.api.getAccountHistory(account.name, -1, 0, function (err, result) { // Get last transaction of account

      if (err || !result) { // Check for errors
        console.log('Error loading account history: ' + err); // Output error
        return;
      }

      result.forEach(function(trans) { // Loop through transactions
          var op = trans[1].op; // Get transaction data

          if (op[0] == 'transfer' && op[1].to == account.name) { // Check if transaction is transfer TO user account
            var current_trx_id = trans[1].trx_id

            const isNewTrx = (last_trx_id !== current_trx_id)
            const transferAmt = op[1].amount
            const isOneSteem = (transferAmt === STEEM_FEE + ' STEEM')
            const isOneSbd = (transferAmt === SBD_FEE + ' SBD')

            const memo = op[1].memo
            const isFeedDog = (memo && memo.toLowerCase().indexOf('feed dog') >= 0)
            const isGreetDog = (memo && memo.toLowerCase().indexOf('greet dog') >= 0)

            if (isNewTrx && (isOneSteem || isOneSbd)) {
              console.log('new transaction. with memo: ', op[1].memo); // Output transaction 

              if (isGreetDog) {
                greetDog()
              }

              if (isFeedDog) {
                feedDog(servo)
              }

              last_trx_id = current_trx_id
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

  board.repl.inject({
    servo: servo
  });

  //steem.api.setOptions({ url: 'https://rpc.buildteam.io' }); // Set Steem Node
  setInterval(loop.bind(null, servo), LOOP_SPEED); // Create Loop

});


