var builder = require('botbuilder');
var restify = require('restify');
var env     = require('dotenv');
env.config();

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//create the bot
var bot = new builder.UniversalBot(connector, [
    function(session){
        session.beginDialog('UserStatus');
    }
]);

//Recognizer to use a machine learning LUIS
var luisRecognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(luisRecognizer);

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




bot.dialog('UserStatus', [
    function (session) {
        if (session.userData.name != null) {
            session.beginDialog('SignIn');
        } else {
            session.beginDialog('SignUp');
        }
    }
]);

bot.dialog('SignIn', [
    function (session) {
        session.send(`Hello ${session.userData.name}!`);
        session.beginDialog('frigoMenu');
    }
]);

bot.dialog('SignUp', [
    function (session) {
        session.send(`Hello and welcome here!`);
        session.send(`I'm Frigobot, i will help you to manage your fridge and what you eat`);
        session.send(`Let's create your account together! (Don't worry, it's very fast :) )`);
        builder.Prompts.text(session, `Firstly, how can I call you?`);
    },
    function (session, results) {
        var name = results.response;
        session.userData.name = name;
        session.endDialogWithResult(results);
        session.save();
        session.beginDialog('frigoMenu');
    }
]);







var menuItems = {
    "Add product": {
        item: "AddProduct"
    },
    "Remove product": {
        item: "RemoveProduct"
    },
    "Check fridge": {
        item: "CheckFridge"
    }
}

bot.dialog('frigoMenu', [
    function (session) {
        builder.Prompts.choice(session, `Main menu: `, menuItems, { listStyle: 3 });
    },
    function(session, results) {
        if(results.response) {
            session.beginDialog(menuItems[results.response.entity].item);
        }
    }
])
.triggerAction({
    matches: /^main menu$/i,
    confirmPrompt: "You'll loose your progression, are you sure?"
});


/**
* Intents recognizer
*/
bot.dialog('AddProduct', [
    function(session, args, next){
        session.send(`Welcome to Frigobot! We are analyzing your message: %s`, session.message.text);
        session.beginDialog('SignIn');

        var intentResult = args.intent;
        var fruitEntity = builder.EntityRecognizer.findEntity(intentResult.entities, 'fruit');		
        var vegetableEntity = builder.EntityRecognizer.findEntity(intentResult.entities, 'vegetable');		
        var numberEntity = builder.EntityRecognizer.findEntity(intentResult.entities, 'builtin.number');		

        //Waterfall Dialog
        if (fruitEntity)
        {
            //fruit entity detected
            console.log('Fruit => %s', fruitEntity.entity);
            next({ response: fruitEntity.entity });
        } if (vegetableEntity){
            //vegetable entity detected		
            console.log('Vegetable => %s', vegetableEntity.entity);		
            next({ response: vegetableEntity.entity });		
        } if (numberEntity){
            //number entity detected		
            console.log('Number => %s', numberEntity.entity);		
            next({ response: numberEntity.entity });		
        }
    }
]).triggerAction({
    matches: 'AddProduct'
});
bot.dialog('RemoveProduct', [
    function (session) {
    
    },
    function(session, results) {
    }
])

bot.dialog('CheckFridge', [
    function (session) {
    
    },
    function(session, results) {
    }
])