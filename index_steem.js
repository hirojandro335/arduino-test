const es = require("event-stream")
const steem = require("steem")
const player = require('node-wav-player');
var five = require("johnny-five");
var board = new five.Board({ port: "COM6" });

const MILLI_SECONDS_TO_COMPLETE = 3000
const MILLI_SECONDS_TO_COMPLETE_WITH_BUFFER = MILLI_SECONDS_TO_COMPLETE + 500
const HOME_DEGREES = 0
const TO_DEGREES = 180
const ACCOUNT_NAME = 'east.autovote'
const AUDIO_PLAY_DURATION = 10000

function returnToHome(servo){
  if(servo.value === TO_DEGREES) {
    servo.to(HOME_DEGREES, MILLI_SECONDS_TO_COMPLETE);
  }
}

board.on("ready", function() {
  var servo = new five.Servo({
    pin: 9,
    startAt: 0
  });

  steem.api.streamTransactions(function (err, transaction) {
    // Look for comment type of transaction
    const operation = transaction.operations[0]

    const isTransferTx = (operation[0] === 'transfer')
    const isTransferToAccount = (operation[1].to === ACCOUNT_NAME)

    if (isTransferTx && isTransferToAccount) {
      console.log('is transfer transaction to target account...')
      const isOneSteem = (operation[1].amount === '0.001 STEEM')
      const containsMemo = (operation[1].memo && operation[1].memo.toLowerCase().indexOf('feed dog') >= 0)

      if (operation[1].to == ACCOUNT_NAME) {
        console.log("received transfer from: ", operation[1].from)

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

        servo.to(TO_DEGREES, MILLI_SECONDS_TO_COMPLETE);
        setTimeout(returnToHome.bind(null, servo), MILLI_SECONDS_TO_COMPLETE_WITH_BUFFER);
      }
    }
  });

});
