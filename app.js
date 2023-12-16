const fs = require('fs');
const axios = require('axios');

const express = require('express');

require('dotenv').config()


var app = express();
app.use(express.json());
var cors = require('cors');
const { appendToFile, Logger } = require('./files_utils');
const { startWorker } = require('./worker');

app.use(cors());

app.get('/', function (req, res) {
    
    res.send("Hello world!");
});

/**
 * Just to check the basic authentication. 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function authenticate(req, res, next) {

    if (req.headers.authorization) {
        const header_authorization = (req.headers.authorization).split(' ')[1];
        if (header_authorization === process.env.AUTH) {
            next();
            return;
        }
    }
    res.sendStatus(401)
}


/**
 * After message webhook, all the messages will come here. 
 * it will filter the interactive type message and stores it in a file
 */
app.post("/after_message", authenticate, function (req, res) {

    if (req.body?.trigger === "after_message" && req.body?.data?.category === "interactive") {
        
        insertMessage(JSON.stringify(req.body.data));
        Logger("on message received", "a message added to queue");
    }
    res.sendStatus(201);

    /**
     * write to a file
     * @param {*} message 
     * @param {*} cb 
     */
    function insertMessage(message, cb) {
        const filePath = "message.txt";
        appendToFile(filePath, Date.now() + "#,#" + message + ";\n");
    }
});

/**
 * Webhook for interactive message
 *  response of interaction will be stored here.
 */
app.post("/user_response", function (req, res) {

    insertFormResponse(JSON.stringify(req.body))

    res.sendStatus(200);

    /**
     * funtion to insert the form response in a file.
     */
    function insertFormResponse(response, cb) {
        const filePath = 'form_response.txt';
        appendToFile(filePath, response + ";\n");
    }
});

app.post("/user_call_response", function (req, res) {

    insertCallResponse(req.body);

    res.sendStatus(200);

    /**
     * insert the response from the call to a file.
     * with user details and ansewers.
     * @param {*} response 
     * @param {*} cb 
     */
   async function insertCallResponse(response, cb) {

        let filePath = './call_response.txt';

        if (response.message?.type === "end-of-call-report") {
            
            Logger(`call ended and response received \t" \` ${response.message.call.customer?.name}\`\n`,`\n ${response.message.transcript}`);

            getTheActiveCall(response.message.call.customer?.name, async (message) => {
                
                Logger(`informing the user that he has interacted with the form over the call`,{});
                
                await interactWithMessage(message.id, message.receiver);
                await informAboutInteraction(message.id, message.sender, message.receiver,response.message.transcript);
                Logger(`user informed about the call interaction `,{});
                removeFromActiveCallsList((response.message.call.customer ? response.message.call.customer?.name : "superhero1_r1"));
            });


        } else {
            filePath = './other_call_response.txt';
        }
        appendToFile(filePath, JSON.stringify(response) + ";\n")
    }


    /**
     * since we have received the response from call, we need to mark the message as `interacted` and we can use this function;
     */
    function interactWithMessage(messageId, sender) {
        fetch("https://api-" + process.env.REGION + ".cometchat.io/v3.0/messages/" + messageId + "/interacted", {
            "headers": {
                "accept": "application/json",
                "accept-language": "en-US,en;q=0.9",
                "appid": process.env.APP_ID,
                "apiKey": process.env.API_KEY,
                "cache-control": "max-age=0",
                "onBehalfOf": sender,
                "content-type": "application/json",
            },
            "body": "{\"interactions\":[\"submitForm\"]}",
            "method": "PATCH"
        });
    }

    /** Remove the active call entry from active calls list */
    function removeFromActiveCallsList(requestId) {

        const filePath = "active_calls.txt"

        const stringToRemove = requestId;

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return;
            }

            const lines = data.split('\n');


            const filteredLines = lines.filter(line => !line.includes(stringToRemove));

            const modifiedData = filteredLines.join('\n');

            fs.writeFile(filePath, modifiedData, 'utf8', (writeErr) => {
                if (writeErr) {
                    console.error('Error writing to the file:', writeErr);
                } else {
                    // console.log('Lines removed successfully.');
                }
            });
        });
    }
    /**
     * get the active calls from the calls list 
     * @param {*} requestId 
     * @param {*} cb 
     */
    async function getTheActiveCall(requestId, cb) {
        
        const filePath = 'active_calls.txt';
    
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
            } else {
    
                const messages = data.split("\n")
                
                for(let i=0;i<=(messages.length - 2);i++){
                    const message=messages[i].trim();
                    const temp = message.split("#;#");
                    const requestIdTemp = temp[0];
                    const messageJSON = temp[1]?JSON.parse(temp[1]):{}
                    if(requestId===requestIdTemp){
                        cb(messageJSON)
                        return messageJSON;
                    }
                }
              
            }
        });
    
    }
});
startWorker();

module.exports = app

// app.listen(process.env.PORT);




//TODO don't know what to do.
async function informAboutInteraction(messageId, sender, receiver,prompt) {

    let data = JSON.stringify({
        "receiver": receiver,
        "receiverType": "user",
        "category": "message",
        "type": "text",
        "data": {
            "text":"we called you a while back and here is the transcript of out last interaction :\n"+ prompt
        }
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://api-us.cometchat.io/v3.0/messages?myMentions=1',
        headers: {
            'appId': process.env.APP_ID,
            'apiKey': process.env.API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'onBehalfOf': sender
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            return response;
            // console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            throw Error(error)
            console.log(error);
        });


}





