const axios = require('axios');
const { Logger } = require('./files_utils');
require('dotenv').config()
const readline = require('node:readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

initTheProcess();

function initTheProcess(){
    getIfMessage(() => {
        getTheUID((uid) => {
            console.log("You have entered the uid \t", uid);
            getThePrompt((prompt) => {
                console.log("You have entered the prompt as  \t", prompt);
                messageConformation(formMessage({ prompt, receiver: uid }), (message) => {
                    console.log({ message })
                    sendMessage(message,(result,error)=>{
                        initTheProcess();
                    });
                });
            });
        });
    });
};



/**
 * function to get the conformation before sending the message.
 * @param {*} message 
 * @param {*} cb 
 */
function messageConformation(message, cb) {
    readline.question(`${JSON.stringify({ message },null, 2)} \n this is the message we are sending are you okay with it? : \n`, ans => {
        if (ans.trim().toLowerCase() === "yes" || ans.trim().toLowerCase() === "y"||ans.trim().toLowerCase() === "") {
            cb(message);
        } else {
            initTheProcess();
        }
    });
}

/**
 * function to get the prompt, for a bot, which will be used while making a call to clint.
 * @param {*} cb 
 */
function getThePrompt(cb) {
    const defaultPrompt=`You are an information collection agent representing a 'acme real estate'  Your task is to call a potential customer who hasn't yet provided essential details. The goal is to gather the following information:

    first of all confirm the name of the person if it's '%name_of_the_person%'

    Locality Preference:
    
    Ask the customer about the preferred locality for renting a house.
    Budget:
    
    Inquire about the budget the customer has allocated for the rental property.
    Move-In Date:
    
    Collect information on the planned move-in date for the new residence.
    Occupancy Type:
    
    Determine if the customer is looking for a house as a family or as an individual (bachelor).
    Pet Ownership:
    
    make it sound natural, ask the customer if they have time to answer this, if no then say , login to our app and feel in the information.
    
    Ask whether the customer has pets.
    To streamline the process, collect this information in a question-and-answer format during the call. After each question, frame the responses into an array in the order mentioned above. For instance, the final array might look like this:`

    readline.question(`enter the prompt for AI caller , in the case of user is not responding in timely manner or press enter , if you want to user default prompt?: \n`, prompt => {
        if(prompt.trim().toLocaleLowerCase()===""){
            prompt=defaultPrompt;
            Logger("will try to send the following prompt , since you haven't entered any",prompt)
        }
        cb(prompt);
    });
}
function getIfMessage(cb) {
    readline.question(`would you like to send a form message : \n`, ans => {
        if (ans.trim().toLowerCase() === "yes" || ans.trim().toLowerCase() === "y") {
            cb();
        } else {
            getIfMessage(cb);
        }
    });
}

function getTheUID(cb) {
    readline.question(`enter the \`uid\` of the receiver : \n`, uid => {
        if (uid === undefined || uid === null || uid.trim().toLowerCase() === "") {
            getTheUID(cb);
        } else {
            cb(uid);
        }
    });
}



//   readline.close();
/**
 * Interactive message
 */


function formMessage(options) {
    const { receiver, prompt } = options;
    const interactiveMessage = {
        "receiver": receiver,
        "receiverType": "user",
        "category": "interactive",
        "type": "form",
        "data": {
            "metaData": {
                "requestId": receiver + "_" + Date.now(),
                "prompt": prompt
            },
            "interactionGoal": {
                "type": "none",
                "elementIds1": []
            },
            "allowSenderInteraction": true,
            "interactiveData": {
                "title": "Tenant information form",
                "formFields": [
                    {
                        "elementType": "textInput",
                        "elementId": "locality",
                        "defaultValue": "",
                        "label": "Locality",
                        "optional": false,
                        "maxLines": 1,
                        "placeholder": {
                            "text": "Enter the locality your searching for"
                        }
                    },
                    {
                        "elementType": "textInput",
                        "elementId": "budget",
                        "defaultValue": "",
                        "label": "Budget",
                        "optional": false,
                        "maxLines": 1,
                        "placeholder": {
                            "text": "Enter budget"
                        }
                    },
                    {
                        "elementType": "textInput",
                        "elementId": "plannedDate",
                        "defaultValue": "",
                        "label": "Planned move-in date",
                        "optional": false,
                        "maxLines": 1,
                        "placeholder": {
                            "text": "Enter planned move-in date"
                        }
                    },
                    {
                        "elementType": "singleSelect",
                        "elementId": "tenantCategory",
                        "optional": false,
                        "label": "Family/bachelor?",
                        "defaultValue": "option1",
                        "options": [
                            {
                                "value": "option1",
                                "label": "Family"
                            },
                            {
                                "value": "option2",
                                "label": "Bachelor"
                            }
                        ]
                    },
                    {
                        "elementType": "singleSelect",
                        "elementId": "ifHavePets",
                        "optional": false,
                        "label": "Have any pets?",
                        "defaultValue": "option1",
                        "options": [
                            {
                                "value": "option1",
                                "label": "Yes"
                            },
                            {
                                "value": "option2",
                                "label": "No"
                            }
                        ]
                    }
                ],
                "submitElement": {
                    "elementType": "button",
                    "elementId": "submitForm",
                    "buttonText": "Submit",
                    "disableAfterInteracted": true,
                    "action": {
                        "actionType": "apiAction",
                        "url": process.env.INTERACTION_CALLBACK_URL,
                        "method": "POST",
                        "payload": {
                            "category": "custom",
                            "type": "prompt",
                            "data": {
                                "customData": {
                                    "text": "form submitted"
                                }
                            }
                        },
                        "headers": {
                            "Content-Type": "application/json",
                            "accept": "application/json",
                            "appId": "249285fabd3e1dbd",
                            "apiKey": "cbad5358018c62a9ba6916da2a130f40b0598b37",
                            "onBehalfOf": "bot_jessica"
                        },
                        "dataKey": "CometChatData"
                    }
                }
            }
        }
    }
    return interactiveMessage;
}









/**
 * Sending the message using `CometChat` message API.
 * @param {*} message 
 * @param {*} cb 
 */
function sendMessage(message, cb) {
    let data = JSON.stringify(message);

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `http://api-${process.env.REGION}.cometchat.io/v3.0/messages?myMentions=1`,
        headers: {
            'appId': process.env.APP_ID,
            'apiKey': process.env.API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'onBehalfOf': process.env.BOT_USER
        },
        data: data
    };

    axios.request(config)
        .then((response) => {

            Logger("message send , which looks like :\t",response.data);
            cb?cb(response.data):"";

        })
        .catch((error) => {
    
            Logger("error in sending the message using `CometChat API` :\t",error.message)
            cb?cb(undefined, error):"";
        });

}

