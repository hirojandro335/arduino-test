const dotenv = require("dotenv")
const dsteem = require("dsteem")
const es = require("event-stream")

// Environment Init
dotenv.config()
if (!process.env.ACCOUNT_NAME) throw new Error('ENV variable missing')
let ACCOUNT_NAME = process.env.ACCOUNT_NAME

// Steem Init
const client = new dsteem.Client('https://api.steemit.com')
const stream = client.blockchain.getOperationsStream()

var five = require("johnny-five");
var board = new five.Board({ port: "COM6" });

board.on("ready", function() {
  var servo = new five.Servo(9);

  // Stream Steem Blockchain
  stream.on('data', async operation => {
    // Look for comment type of transaction
    if (operation.op[0] == 'transfer') {
      console.log('is transfer operation: ', operation.op[1])
      if (operation.op[1].to == ACCOUNT_NAME) {
        console.log("received transfer to: ", ACCOUNT_NAME)
        servo.sweep();
      }
    }
  })  // end: stream.on()

});
