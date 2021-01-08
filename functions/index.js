const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const express = require('express');
const app = express();
require('dotenv').config();
var emojiMappings = require('./emoji-mappings.json');
var request = require('request');

// our single entry point for every message
app.post('/', async (req, res) => {
  // function to check if the bot has been mentioned
  function isMentioned(msg) {
    let mentioned = false;
    if (msg.entities !== undefined) { // contains entities like mentions or commands
      mentioned = msg.text.includes(process.env.BOT_USERNAME); // set as @<bot username> in .env
    }
    return mentioned;
  }

  // function to convert the text into emojipasta
  function emojify(txt) {
    let splicedText = txt.split(" ");
    let stringArray = new Array();
    let returnMsg = "";
    for (var i = 0; i < splicedText.length; i++) {
      let word = splicedText[i];
      stringArray.push(word);
      word = word.toLowerCase()
      if (emojiMappings.hasOwnProperty(word)) {
        let wordEmojis = emojiMappings[word]
        // pick no. of emojis to insert between 0 and 3
        // Weighted random num closer to 0
        let rng = Math.random();
        let numToInsert = 0;
        switch (true) {
          case (rng >= 0 && rng < 0.3):
            numToInsert = 0;
            break;
          case (rng >= 0.3 && rng < 0.7):
            numToInsert = 1;
            break;
          case (rng >= 0.7 && rng < 0.9):
            numToInsert = 2;
            break;
          default:
            numToInsert = 3;
            break;
        }

        // pick emojis randomly from the mapping
        while (numToInsert--) {
          let i = Math.floor(Math.random() * wordEmojis.length)
          stringArray.push(wordEmojis[i])
        }
      } 
      stringArray.push(" ");
    }
    for (var i = 0; i < stringArray.length; i++) {
      returnMsg += stringArray[i];
    }
      return returnMsg;
  }

  let curUserId = req.body.message.chat.id;
  let currMsg = req.body.message; 
  let replyingToMsg = req.body.message.reply_to_message; // if the message is replying to another message
  
  if (curUserId) {
    if (isMentioned(currMsg)) {
      var replyId, replyText;

      if (replyingToMsg === undefined) {
        replyId = currMsg.message_id;
        replyText = currMsg.text.replace(process.env.BOT_USERNAME, ''); 
        replyText = replyText === '' ? "👁👄👁" : emojify(replyText);
      } else {
        replyId = replyingToMsg.message_id;
        replyText = emojify(replyingToMsg.text);
      }

      let requestUrl = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage';

      replyToMessage(curUserId, replyText, (callback) => {
        return res.status(200).send();
      });

      function replyToMessage(curUserId, msg, callback) {
        request.post({
          url: requestUrl,
          'Content-Type': "application/json;charset=utf-8",
          json: true,
          body: {
            chat_id: curUserId,
            text: msg,
            reply_to_message_id: replyId // the message that the bot will reply to
          }
        }, function (error, result, body) {
            if (error) {
                console.log(error);
            } else if (result.statusCode === 500 || result.statusCode === 400) {
                console.log('error');
                callback(true, body);
            } else {
              callback(false, body);
            }
        });
      } //end of callbackFunction
    } else { // ignore messages without mentions
      return res.status(200).send(); // TODO: find a better way to prevent timeout ?
    }
  } else {
    return res.status(400).send({ status: 'not a telegram message' });
  }
});

exports.router = functions.https.onRequest(app);
