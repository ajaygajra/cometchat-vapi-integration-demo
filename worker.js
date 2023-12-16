const fs = require('fs');
const axios = require('axios');
const { Logger } = require('./files_utils');

require('dotenv').config()

module.exports = {
    startWorker:function(){
        setInterval(() => {
            const filePath = 'message.txt';
        
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading the file:', err);
                } else {
        
                    const messages = data.split(";\n")
        
                    messages.forEach(async (message, i) => {
        
                        if (i - 1 < messages.length - 2) {
        
                            const temp = message.split("#,#");
                            const timestamp = temp[0];
                            const messageJSON = JSON.parse(temp[1])
        
        
                            if (Date.now() - timestamp > (process.env.INTERVAL * 60 * 1000)) {
        
        
                                const requestId = messageJSON.data.metaData.requestId;
                                const prompt = messageJSON.data.metaData.prompt;
        
        
                                delete messageJSON.data
                                let user = (JSON.parse(await getUser(messageJSON.receiver))).data;
        
                                Logger(`It's been a while, \`${user.name}\` is yet to complete the form`, {})
        
                                customer = {
                                    name: requestId,
                                    number: user.metadata.contact
                                }
        
                                makeCall(customer, null, prompt, requestId, user.name, (res, error) => {
                                    Logger(`making a call to customer with request id :\`${requestId}\``, {
                                        name: user.name,
                                        uid: user.uid,
                                        phone: user.metadata.contact
        
                                    });
        
                                    if (res?.status === 'queued') {
        
                                        Logger(`call to customer went through, deleting the records for request id`, { requestId: requestId });
        
                                        pushToActiveCalls(requestId, messageJSON);
                                        removeTheEntryFromFile(message + ";\n")
                                    } else {
                                        Logger(`Not Deleting the entry from the queue for request id `, { requestId: requestId });
                                    }
                                });
                            }
                        }
                    });
                }
            });
        
        }, 5000);
    }
}





/**
 * 
 * @param {*} message 
 * @param {*} cb 
 */
function pushToActiveCalls(requestId, message, cb) {

    const text = requestId + "#;#" + JSON.stringify(message) + "\n";
    appendToFile("active_calls.txt", text);
};


function appendToFile(filePath, text, cb) {

    fs.appendFile(filePath, text, (err) => {
        if (err) {
            console.error('Error appending to the file:', err);
        } else {
            // console.log('Data appended to the file successfully.');
        }
    });
}


function removeTheEntryFromFile(stringToRemove) {


    const filePath = "message.txt";


    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        // Remove the desired string from the data
        const modifiedData = data.replace(stringToRemove, '');

        // Write the modified data back to the file
        fs.writeFile(filePath, modifiedData, 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing to the file:', writeErr);
            } else {
                // console.log('String removed successfully.');
            }
        });
    });
}

const assistantObject = {
    "firstMessage": "Hello , can you please tell us about below questions",
    "endCallMessage": "Thanks for your response and it's really appreciated",
    "name": "mark",
    "model": "gpt-3.5-turbo",
}

function makeCall(customer, assistant, prompt, requestId, name, cb) {
    body = {
        "assistant": {
            // "id": "dd5f8905-6738-41b0-88da-761cdcc3d562",
            "name": "bob",
            "voice": "burt-11labs",
            "model": {
                "model": "gpt-4",
                "provider": "openai",
                "functions": [],
                "temperature": 0,
                "systemPrompt": prompt.replace("%name_of_the_person%", name)
            },
            "recordingEnabled": false,
            "firstMessage": "Hello"
        },
        // assistantId:"dd5f8905-6738-41b0-88da-761cdcc3d562",
        customer,
        "phoneNumberId": "43e35e70-e5bb-4b22-9782-5bbfa936cf46"
    }


    const options = {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.VAPI_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };

    fetch('https://api.vapi.ai/call/phone', options)
        .then(response => response.json())
        .then(response => {
            if (cb) {
                // Logger("Response while making call",response)
                cb(response)
            }
        })
        .catch(err => {
            console.error({ err });
            cb(undefined, err)
        });
}

async function getUser(uid) {
    return new Promise((res, rej) => {
        let data = '';

        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'http://api-us.cometchat.io/v3.0/users/' + uid,
            headers: {
                'appId': process.env.APP_ID,
                'apiKey': process.env.API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: data
        };

        axios.request(config)
            .then((response) => {

                res(JSON.stringify(response.data));
            })
            .catch((error) => {
                Logger("Error while making call", error)
                rej(error)
            });
    });
}