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
        session.send(`I'm Frigobot, I will help you to manage your fridge and what you eat`);
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









//Products are temporarly stored here
var productList = [];

var menuItems = {
    "Manage my fridge": {
        item: "ManageFridge"
    },
    "Check my fridge": {
        item: "CheckFridge"
    },
    "Suggest a recipe": {
        item: "RecipeSuggestion"
    },
    "Help": {
        item: "Help"
    }

}
bot.dialog('frigoMenu', [
    function (session) {
        builder.Prompts.choice(session, `Main menu: `, menuItems, { listStyle: 3 });
    },
    function(session, results) {
        if(results.response) {
            session.endDialogWithResult(results);
            session.beginDialog(menuItems[results.response.entity].item);
        }
    }
])
.triggerAction({
    matches: /^main menu$/i,
    confirmPrompt: "You'll loose your progression, are you sure?"
});

















/**
* Manage the fridge part
*/
bot.dialog('ManageFridge', [
    function (session, args, next){
        session.send(`Here you can manage your fridge, by adding or removing products easily`);
        session.send(`Just type what you want to do like "add me 1 tomato" or "i ate 4 apples", and I will manage what you got ;)`);
        builder.Prompts.text(session, `What can i do for you?`);
    },
    function (session, args, results) {
        bot.recognizer(luisRecognizer);
        //Identify entities and render a sentence to store or remove in "phraseTab"
        session.send(`Okay! Let's %s`, session.message.text);
        // builder.Prompts.text('Please provide all the products');

        var intents = new builder.IntentDialog({ recognizers: [luisRecognizer] })
        .matches('AddProduct', (session) => {
            session.send(`You reached Add intent, you said %s.`, session.message.text);
        })
        .matches('RemoveProduct', (session) => {
            session.send(`You reached Remove intent, you said %s.`, session.message.text);
        })
        .matches('Cancel', (session) => {
            session.send(`You reached Cancel intent, you said %s.`, session.message.text);
        })
        .onDefault((session) => {
            session.send(`Sorry, I did not understand %s`, session.message.text);
        });
        
        bot.dialog('/', intents);
    } 
]).triggerAction({
    matches: 'ManageFridge'
});

















bot.dialog('CheckFridge', [
    function (session) {
        if (productList.length > 0)
        {
            session.send()
            for (i = 0; i < productList.length; i++)
            {
                //render all products
            }
        }
    },
    function(session, results) {
    }
])




bot.dialog('Help', function (session) {
    // ...
}).triggerAction({
    matches: 'Help'
});