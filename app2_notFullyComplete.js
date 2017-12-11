var restify = require('restify');
var builder = require('botbuilder');
var cognitiveServices = require('botbuilder-cognitiveservices');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector);

// POST /knowledgebases/5e77ee9b-b572-4870-8e73-445d93ec2aa1/generateAnswer
// Host: https://westus.api.cognitive.microsoft.com/qnamaker/v2.0
// Ocp-Apim-Subscription-Key: 04eaded1d8424142ab930c2dd520190e
// Content-Type: application/json
// {"question":"hi"}
var qnAMakerRecognizer = new cognitiveServices.QnAMakerRecognizer({
    knowledgeBaseId: '5e77ee9b-b572-4870-8e73-445d93ec2aa1',
    subscriptionKey: '04eaded1d8424142ab930c2dd520190e'
});

var qnaMakerDialog = new cognitiveServices.QnAMakerDialog({
    recognizers: [qnAMakerRecognizer],
    qnaThreshold: 0.4,
    defaultMessage: 'Allez prendre un verre :) car je n\'ai pas compris'
});

// bot.dialog('/', qnaMakerDialog);

var luisEndpoint = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/2888e726-5a17-44d5-9697-78438be59abb?subscription-key={YOUR_KEY_HERE}&verbose=true&timezoneOffset=0&q=";
var luisRecognizer = new builder.LuisRecognizer(luisEndpoint);
bot.recognizer(luisRecognizer);

bot.dialog('HomePilot', [
    function(session, args, next) {
        var intentResult = args.intent;
        var entities = builder.EntityRecognizer.findEntity(intentResult.entities, 'HomeAutomation.Device');
        session.send(`Votre intention : ${intentResult.intent}`);
        intentResult.entities.forEach(function(element) {
            session.send(`Votre Entity : ${element.entity}`);
            session.send(`Votre Type : ${element.type}`);
            session.send(`---------------------------`);
        }, this);
    }

]).triggerAction({
    matches: 'HomeAutomation.TurnOn'
});