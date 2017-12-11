var builder = require('botbuilder');
var restify = require('restify');
var env     = require('dotenv');
env.config();

//create the bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(
    connector,
    function(session)
    { 
        session.endDialog(`Sorry, I didn't understand '%s'. Type 'Help' if you need assistance`);
    }
);

//Recognizer to use a machine learning LUIS
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

//create the host web server
var server = restify.createServer();
server.post('/api/messages', connector.listen());
server.listen(
    process.env.port || process.env.PORT || 3978, 
    function () 
    {
        console.log('%s listening to %s', server.name, server.url); 
    }
);

/**
 * Intents recognizer
 */
bot.dialog('AddProduct', [
    function(session, args, next){
        session.send(`Welcome to Frigobot! We are analyzing your message: %s`, session.message.text);        

        var intentResult = args.intent;
        var fruitEntity = builder.EntityRecognizer.findEntity(intentResult.entities, 'fruit');
        var vegetableEntity = builder.EntityRecognizer.findEntity(intentResult.entities, 'vegetable');
        var numberEntity = builder.EntityRecognizer.findEntity(intentResult.entities, 'number');

        //Waterfall Dialog
        if (fruitEntity)
        {
            //fruit entity detected
            console.log('Fruit => %s', session.message.text);
            next({ response: fruitEntity.entity });
        } else if (vegetableEntity){
            //vegetable entity detected
            console.log('Vegetable => %s', session.message.text);
            next({ response: vegetableEntity.entity });
        } else if (numberEntity){
            //vegetable entity detected
            console.log('Number => %s', session.message.text);
            next({ response: numberEntity.entity });
        } else {
            console.log('NONE ENTITY HAS BEEN FOUND');
        }
    }
]).triggerAction({
    matches: 'AddProduct',
    onInterrupted: function (session){
        session.send('Please provide an article');
    }
});

bot.dialog('RemoveProduct', [
]).triggerAction({
    matches: 'RemoveProduct'
});

bot.dialog('Help', [
]).triggerAction({
    matches: 'Help'
});