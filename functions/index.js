const functions = require('firebase-functions');
const cors = require('cors')({origin: true});
const express = require('express');
const app = express();
require('dotenv').config();
var emojiMappings = require('./emoji-mappings.json');
var request = require('request');
//var emoji = require("@jukben/emoji-search");

// our single entry point for every message
app.post('/', async (req, res) => {
  let curUserId = req.body.message.chat.id;
  let chatContent = req.body.message.text;
  function main(txt) {
    spliced_txt = txt.split(" ");
    var stringArray = new Array();
    var mssg = "";
    for (var i = 0; i < spliced_txt.length; i++) {
      let word = spliced_txt[i];
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
        // let numToInsert = Math.floor(Math.random() * 4);

        // pick emojis randomly from the mapping
        while (numToInsert--) {
          let i = Math.floor(Math.random() * wordEmojis.length)
          stringArray.push(wordEmojis[i])
        }
      } 
      stringArray.push(" ");
    }
    for (var i = 0; i < stringArray.length; i++) {
      mssg += stringArray[i];
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
