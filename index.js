const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const { TwitterScraper } = require("@tcortega/twitter-scraper");
const { Configuration, OpenAIApi } = require("openai");
const axios = require('axios');



app.use(bodyParser.json());

const PORT = process.env.PORT || 5001; 

const configuration = new Configuration({
  apiKey: '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',
});
const openai = new OpenAIApi(configuration);

app.get('/', (req,res)=>{
  res.send({status: "hello world"});
});


app.post('/download', async (req,res)=>{
    const link = req.query.url;
    
    try{
        const twtScraper = await TwitterScraper.create();
        const tweetMeta = await twtScraper.getTweetMeta(link);
        res.send(tweetMeta);
    } catch(e){
        res.status(500).send({error: 'error'});
    }

});

app.get('/', (req,res)=>{
  res.send({status: "hello world"});
});

app.get('/bolobhai', (req,res)=>{
  res.send(req.query['hub.challenge']);
});

app.post('/bolobhai', async (req,res)=>{


  const user_id = req.body.entry[0].id;
  const user_comment_id = req.body.entry[0].changes[0].value.comment_id;
  const user_media_id = req.body.entry[0].changes[0].value.media_id;
  const accessToken = 'EAAKf7JXO2hwBAJ3WVaWoZA8fefk017ZAYdZAhwHQj0Kl4QUF1G3RIpZAsrZA7ZCQZBDBHpuIcva4WrXKtPBNqEuTuyoK6EHLzsetL28ix7OpJaX6iv5UZCbzUY8ZAHObCq8z0jpXN70a3cvZBLeA6vthvCH1KfBZC2WO3NvnZBzybSUqZB6oZBmlTbvWpuOUF4pZClWOIqMWLnUU1MFPThLc2aETjXE';


  const api_url = `https://graph.facebook.com/${user_id}?fields=mentioned_comment.comment_id(${user_comment_id}){media{id,media_url}}&access_token=${accessToken}`;

  const request = await axios.get(api_url);

  const mediaUrl = request.data.mentioned_comment.media.media_url;

  const second_api_url = `https://sasssycomment.cognitiveservices.azure.com/vision/v3.1/describe?maxCandidates=1`;

  const second_request = await axios.post(second_api_url, {url: mediaUrl}, {headers: {'Ocp-Apim-Subscription-Key': '90c0876eb13c46438d69ca3e566d5b5c'}});


  const image_caption = second_request.data.description.captions[0].text;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `give a sassy compliment on a photo which describes '${image_caption}'`,
    temperature: 0,
    max_tokens: 256
  });

  const compiment = response.data.choices[0].text;

  const third_api_url = `https://graph.facebook.com/${user_id}/mentions`;


  await axios.post(third_api_url, {
    comment_id: user_comment_id,
    media_id: user_media_id,
    message: compiment,
    access_token: accessToken
  });

  res.sendStatus(200);

  
});




app.listen(PORT, ()=>{
    console.log('listening');
});