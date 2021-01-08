const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const express = require('express');
const app = express();
require('dotenv').config();
var request = require('request');

// our single entry point for every message
app.post('/', async (req, res) => {

  // function to check if the bot has been mentioned
  function isMentioned(msg) {
    let mentioned = false;
    if (msg.entities !== undefined) { // contains entities like mentions or commands
      mentioned = msg.text.includes(process.env.BOT_USERNAME); 
    }
    return mentioned;
  }

  let curUserId = req.body.message.chat.id;
  let chatContent = req.body.message.text;

  let currMsg = req.body.message; 
  let replyingToMsg = req.body.message.reply_to_message; // if the message is replying to another message

  if (curUserId) {
    if (isMentioned(currMsg)) {
      var replyId, replyText;

      if (replyingToMsg === undefined) {
        replyId = currMsg.message_id;
        replyText = currMsg.text.replace(process.env.BOT_USERNAME, ''); 
        replyText = replyText === '' ? "👁👄👁" : replyText + " 🤣";
      } else {
        replyId = replyingToMsg.message_id;
        replyText = replyingToMsg.text + " 🤣";
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
    } else {
      return res.status(200).send(); // TODO: find a better way to prevent timeout ?
    }

    // let requestUrl = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage';

    // sendMessage(curUserId, chatContent, (callback) => {
    //   return res.status(200).send();
    // });

    // function sendMessage(curUserId, chatContent, callback) {
    //   request.post({
    //     url: requestUrl,
    //     'Content-Type': "application/json;charset=utf-8",
    //     json: true,
    //     body: {
    //       chat_id: curUserId,
    //       text: chatContent
    //     }
    //   }, function (error, result, body) {
    //       if (error) {
    //           console.log(error);
    //       } else if (result.statusCode === 500 || result.statusCode === 400) {
    //           console.log('error');
    //           callback(true, body);
    //       } else {
    //         callback(false, body);
    //       }
    //   });
    // } //end of callbackFunction
  } else {
    return res.status(400).send({ status: 'not a telegram message' });
  }
});

exports.router = functions.https.onRequest(app);
