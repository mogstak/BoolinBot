const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const express = require('express');
const app = express();
require('dotenv').config();
var request = require('request');
var emoji = require("@jukben/emoji-search");

// our single entry point for every message
app.post('/', async (req, res) => {
  let curUserId = req.body.message.chat.id;
  let chatContent = req.body.message.text;
  function main(txt) {
    spliced_txt = txt.split(" ");
    var stringArray = new Array();
    var mssg = "";
    for (var i = 0; i < spliced_txt.length; i++) {
      stringArray.push(spliced_txt[i]);
      const search_result = emoji.default(spliced_txt[i]);
      if (search_result.length != 0) {
        for (var j = 0; j < search_result.length; j++) {
          stringArray.push(search_result[j].char);
        }
      }
      else {
        stringArray.push(" ");
      }
    }
    for (var i = 0; i < stringArray.length; i++) {
      mssg = mssg + stringArray[i];
    }
      return mssg;
  }
  if (curUserId) {
      let requestUrl = 'https://api.telegram.org/bot' + process.env.BOT_TOKEN + '/sendMessage';

      sendMessage(curUserId, chatContent, (callback) => {
        return res.status(200).send();
      });

    function sendMessage(curUserId, chatContent, callback) {
        const return_message = main(chatContent);
        request.post({
          url: requestUrl,
          'Content-Type': "application/json;charset=utf-8",
          json: true,
          body: {
            chat_id: curUserId,
            text: return_message
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
