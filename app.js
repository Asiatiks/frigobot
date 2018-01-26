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

        //make an array of products
        var q = [];
        for (var product in session.userData.productList)
        {
            q.push(product);
        }

        var url = `http://food2fork.com/api/search?key=`+apiKey+`&q=`+q;

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
        
                //extract the datas
                for (var i = 0; i < data.recipes.length; i++)
                {
                    recipeTitle  = data.recipes[i].title;
                    recipeUrl    = data.recipes[i].source_url;
                    recipeImgUrl = data.recipes[i].image_url;
                    if(i >= 0 && i < 10)
                    {
                        //Caroussel function call
                        carousselSetup(recipeTitle, recipeUrl, recipeImgUrl, session, response);
                    }
                }     
            
            }); 
        })
    },
    function(session, results) {
    }
])

// Add dialog to handle 'Buy' button click
bot.dialog('buyButtonClick', [
    function (session, args, next) {
        // Get color and optional size from users utterance
        var utterance = args.intent.matched[0];
        var color = /(white|gray)/i.exec(utterance);
        var size = /\b(Extra Large|Large|Medium|Small)\b/i.exec(utterance);
        if (color) {
            // Initialize cart item
            var item = session.dialogData.item = { 
                product: "classic " + color[0].toLowerCase() + " t-shirt",
                size: size ? size[0].toLowerCase() : null,
                price: 25.0,
                qty: 1
            };
            if (!item.size) {
                // Prompt for size
                builder.Prompts.choice(session, "What size would you like?", "Small|Medium|Large|Extra Large");
            } else {
                //Skip to next waterfall step
                next();
            }
        } else {
            // Invalid product
            session.send("I'm sorry... That product wasn't found.").endDialog();
        }   
    },
    function (session, results) {
        // Save size if prompted
        var item = session.dialogData.item;
        if (results.response) {
            item.size = results.response.entity.toLowerCase();
        }

        // Add to cart
        if (!session.userData.cart) {
            session.userData.cart = [];
        }
        session.userData.cart.push(item);

        // Send confirmation to users
        session.send("A '%(size)s %(product)s' has been added to your cart.", item).endDialog();
    }
]).triggerAction({ matches: /(recipe)\s.*shirt/i });


function carousselSetup(recipeTitle, recipeUrl, recipeImgUrl, session, response)
{
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title(recipeTitle)
            .images([
                builder.CardImage.create(session, recipeImgUrl)
            ])
            // .subtitle("This what you currently have on your fridge")
            .text("Price is $25 and carried in sizes (S, M, L, and XL)")
            .buttons([
                builder.CardAction.imBack(session, "Go to the recipe", "recipe")
            ])
    ]);  
    session.send(msg).endDialog();  
}


bot.dialog('Help', function (session) {
    // ...
}).triggerAction({
    matches: 'Help'
});
