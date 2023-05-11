const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const GSheetReader = require('g-sheets-api');

//vercel stuff
const { v4 } = require('uuid');

//vercel stuff
app.get('/api', (req, res) => {
  const path = `/api/item/${v4()}`;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
});

app.get('/api/item/:slug', (req, res) => {
  const { slug } = req.params;
  res.end(`Item: ${slug}`);
});


//google sheets stuff – will return sheetsData if it can

function getSheetsData() {
  
  const gSheetsOptions = {
    apiKey: process.env.GOOGLE_API_KEY,
    sheetId: '19BQqRM0peLlyVHgHYjj24qhW0s4WqPR7LUU_TeH9W0o',
    sheetNumber: 1,
    returnAllResults: true
  };

  return new Promise((resolve, reject) => {
    GSheetReader(gSheetsOptions, results => {
      const sheetsData = results;
      if(sheetsData){
        resolve(sheetsData) // Resolve the promise with the sheetsData if available
      } else {
        reject('Unable to get sheetsData'); //Reject the promise if its not available
      }
    });
  });

  }

app.get('/sheetsdata', async (req, res) => {
  const sheetsData = await getSheetsData();
  res.json(sheetsData);
});



const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.GPT_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(bodyParser.json());
app.use(express.static('public'));

const messages = [];

function addMessage(role, content) {
   messages.push({ role: role, content: content });
}

async function sendToOpenAI() {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messages,
  }).catch((err) => {
     console.log("error received: " + err);
  });
  reply = completion.data.choices[0].message.content;
  return reply;
}

app.post('/api/gpt', async (req, res) => {
  console.log("Received: " + req.body.prompt);
  addMessage('user', req.body.prompt);
  reply = await sendToOpenAI();
  console.log("Reply: " + reply);
  addMessage("assistant", reply);
  res.send({ message: reply });
});

app.post('/api/startWorld', async (req, res) => {
  messages.length = 0;
  addMessage('system', req.body.systemPrompt);
  reply = await sendToOpenAI();
  addMessage("assistant", reply);
  res.send({ message: reply });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

module.exports = app;