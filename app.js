var builder = require('botbuilder');
var restify = require('restify');

//create the bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(
    connector,
    function(session)
    { 
        session.send(`Sorry, I didn't understand '%s'. Type 'help' if you need assistance`, session.message.text);
    }
);

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