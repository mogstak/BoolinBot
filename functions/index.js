const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const express = require('express');
const app = express();
require('dotenv').config();
var request = require('request');

// our single entry point for every message
app.post('/', async (req, res) => {
  let curUserId = req.body.message.chat.id;
  let chatContent = req.body.message.text;

  if (curUserId) {
      let requestUrl = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage';

      sendMessage(curUserId, chatContent, (callback) => {
        return res.status(200).send();
      });

      function sendMessage(curUserId, chatContent, callback) {
        request.post({
          url: requestUrl,
          'Content-Type': "application/json;charset=utf-8",
          json: true,
          body: {
            chat_id: curUserId,
            text: chatContent
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
    return res.status(400).send({ status: 'not a telegram message' });
  }
});

exports.router = functions.https.onRequest(app);
