require('dotenv').config()

const es = require("event-stream")
const dsteem = require('dsteem');
const player = require('node-wav-player');
const opn = require('opn');
var five = require("johnny-five");
var board = new five.Board({ port: "COM6" });

const MILLI_SECONDS_TO_COMPLETE = 3000
const MILLI_SECONDS_TO_COMPLETE_WITH_BUFFER = MILLI_SECONDS_TO_COMPLETE + 500
const HOME_DEGREES = 0
const TO_DEGREES = 180
const AUDIO_PLAY_DURATION = 10000

const ACCOUNT_NAME = (process.env.ACCOUNT_NAME || 'east.autovote')
const STEEM_FEE = (process.env.STEEM_FEE || '1.000')
const SBD_FEE = (process.env.SBD_FEE || '1.000')

console.log('ACCOUNT_NAME', ACCOUNT_NAME)
console.log('STEEM_FEE', STEEM_FEE)
console.log('SBD_FEE', SBD_FEE)

//connect to server which is connected to the network/production
const client = new dsteem.Client('https://api.steemit.com')
const stream = client.blockchain.getOperationsStream()

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

  stream.on('data', async operation => {
    if (!operation) return

    const isTransferTx = (operation.op[0] === 'transfer')
    if (!isTransferTx) return

    const isTransferToAccount = (operation.op[1].to === ACCOUNT_NAME)

    // Look for transfer transaction and is transfer to target account
    if (isTransferToAccount) {
      console.log('is transfer transaction to target account...')

      const isOneSteem = (operation.op[1].amount === STEEM_FEE + ' STEEM')
      const isOneSbd = (operation.op[1].amount === SBD_FEE + ' SBD')
      const containsMemo = (operation.op[1].memo && operation.op[1].memo.toLowerCase().indexOf('feed dog') >= 0)

      if (isOneSteem || isOneSbd) {
        console.log("received transfer from: ", operation.op[1].from)

        // open gif html
        opn('./thanks.html',  {app: 'chrome'});

        // play audio
        player.play({
          path: './audio/bark.wav',
        }).then(() => {
          console.log('play wav.');
        }).catch((error) => {
          console.error(error);
        });

        setTimeout(() => {
          player.stop();
          console.log('stop wav.')
        }, AUDIO_PLAY_DURATION);

        servo.to(TO_DEGREES, MILLI_SECONDS_TO_COMPLETE);
        setTimeout(returnToHome.bind(null, servo), MILLI_SECONDS_TO_COMPLETE_WITH_BUFFER);
      }
    }
  });

});
