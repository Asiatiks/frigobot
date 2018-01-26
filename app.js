var builder = require('botbuilder');
var restify = require('restify');
var env     = require('dotenv');
//dialog with the API
var http = require("http");
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
var apiKey = process.env.recipeApiKey;

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
        session.userData.productList = new Object();
        session.save();
        session.beginDialog('frigoMenu');
    }
]);







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












var menuManageItems = {
    "Add a product": {
        item: "AddProduct"
    },
    "Remove a product": {
        item: "RemoveProduct"
    }
}
bot.dialog('ManageFridge', [
    function (session) {
        builder.Prompts.choice(session, `Manage Fridge menu: `, menuManageItems, { listStyle: 3 });
    },
    function(session, results) {
        if(results.response) {
            session.endDialogWithResult(results);
            session.beginDialog(menuManageItems[results.response.entity].item);
        }
    }
])
.triggerAction({
    matches: /^manage menu$/i,
    confirmPrompt: "You'll loose your progression, are you sure?"
});







/**
* Add Products in the fridge
*/
bot.dialog('AddProduct', [
    function (session){
        builder.Prompts.text(session, `What did you bought today? :)`);
    },
    function (session, args, next){
        bot.recognizer(luisRecognizer);
        //render the user sentence 
        //var sentence = identifyProduct(session, args, next);
        //store all products

        console.log(args.intent);

        var intentResult = args.intent;
        var fruitEntity = builder.EntityRecognizer.findEntity(intentResult.entities, 'fruit');	

        productList.push(sentence);
        console.log(`Product List : ${productList}`);        
        builder.Prompts.text(session, `I've just added ${sentence} in the fridge`);
    },
    function (session, results) {
        session.userData.productList = productList;
        session.endDialogWithResult(results);
        session.save();
        // console.log(session);
    }
]);



//Remove products from the fridge
bot.dialog('RemoveProduct', [
    function (session, args, next){
        var sentence = identifyProduct(session, args, next);
        for (i = 0; i < phraseTab.length; i++)
        {
            //Identify the product to remove
        }
        builder.Prompts.text(session, `I've just removed ${sentence} from the fridge`)
    }
]);

bot.dialog('CheckFridge', [
    function (session) {

        //Generate fake datas for the begining of the demo
        session.userData.productList["chicken"] = 4;
        session.userData.productList["mushrooms"] = 8;
        console.log(`Yes, I've created some products`);

        var productList = session.userData.productList;  
        session.send("This what you currently have on your fridge");
        for(var product in productList)
        {
            var value = productList[product];
            session.send(product + " = " + productList[product] + '<br>');
        }
    },
    function(session, results) {
    }
])




bot.dialog('RecipeSuggestion', [
    function (session) {

        session.send(`I found some delicious recipe with what you have! Take a look...`);

        //make an array of products
        var q = [];
        for (var product in session.userData.productList)
        {
            q.push(product);
        }

        var url = `http://food2fork.com/api/search?key=`+apiKey+`&q=`+q;

        var recipePublisher;
        var recipeTitle;
        var recipeUrl;
        var recipeImgUrl;

        var query = http.get(url, function (response) {
            var buffer = "", 
                data,
                route;
        
            response.on("data", function (chunk) {
                buffer += chunk;
            }); 
        
            response.on("end", function (err) {
                // finished transferring data
                data = JSON.parse(buffer);   
            
                //Caroussel function call
                carousselSetup(data, session, response);

            }); 
        })
    },
    function(session, results) {
    }
])



function carousselSetup(data, session, response)
{
    var cards = getCardsAttachments(data);
    
    // create reply with Carousel AttachmentLayout
    var reply = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);

    session.send(reply);
};

function getCardsAttachments(data, session) {

    return [
        new builder.HeroCard(session)
            .title(data.recipes[0].title)
            .subtitle(data.recipes[0].publisher)
            .images([
                builder.CardImage.create(session, data.recipes[0].image_url)
            ])
            .buttons([
                builder.CardAction.openUrl(session, data.recipes[0].source_url, 'Learn More')
            ]),

        new builder.HeroCard(session)
            .title(data.recipes[1].title)
            .subtitle(data.recipes[1].publisher)
            .images([
                builder.CardImage.create(session, data.recipes[1].image_url)
            ])
            .buttons([
                builder.CardAction.openUrl(session, data.recipes[1].source_url, 'Learn More')
            ]),

        new builder.HeroCard(session)
            .title(data.recipes[2].title)
            .subtitle(data.recipes[2].publisher)
            .images([
                builder.CardImage.create(session, data.recipes[2].image_url)
            ])
            .buttons([
                builder.CardAction.openUrl(session, data.recipes[2].source_url, 'Learn More')
            ]),

        new builder.HeroCard(session)
            .title(data.recipes[3].title)
            .subtitle(data.recipes[3].publisher)
            .images([
                builder.CardImage.create(session, data.recipes[3].image_url)
            ])
            .buttons([
                builder.CardAction.openUrl(session, data.recipes[3].source_url, 'Learn More')
            ]),

        new builder.HeroCard(session)
            .title(data.recipes[4].title)
            .subtitle(data.recipes[4].publisher)
            .images([
                builder.CardImage.create(session, data.recipes[4].image_url)
            ])
            .buttons([
                builder.CardAction.openUrl(session, data.recipes[4].source_url, 'Learn More')
            ])
    ];
}





bot.dialog('Help', function (session) {
    session.send(`You seems a bit lost ${session.userData.name}! Let me help you...`);
    session.sendTyping();
    setTimeout(function () {
        session.send("If you want to manage your fridge, just click on the Manage button");
    }, 1500);
    setTimeout(function () {
        session.send("You can also check your current fridge status, by clicking on the second one! :)");
    }, 1500);
    setTimeout(function () {
        session.send("And because we taking care of you, we suggest our best meals with what you got in stock <3");
    }, 1500);
    setTimeout(function () {
        session.send("Just wait a second, i will put you back on the menu...");
    }, 1500);
    setTimeout(function () {
        session.beginDialog('frigoMenu');
    }, 1500);
}).triggerAction({
    matches: 'Help'
});
