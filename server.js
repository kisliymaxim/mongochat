const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//Connect to mongoDB
mongo.connect('mongodb://127.0.0.1/mongochat', function (err, db) {
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    //Connect to socket.io
    client.on('connection', function (socket) {
        var chat = db.collection('chats');

        //Create function to send status
        var sendStatus = function (s) {
            socket.emit('status', s);
        };

        //Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function (err, res) {
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        //Handle input events
        socket.on('input', function (data) {
            var name = data.name;
            var message = data.message;

            //Check for name and message
            if(name === '' || message === ''){
                //Send Error status
                sendStatus('Please enter a name and message');
            }
            else{
                // Insert message
                chat.insert({name:name,message:message}, function () {
                    socket.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: "Message sent",
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    })
});