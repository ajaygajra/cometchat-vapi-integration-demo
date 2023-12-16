# cometchat-vapi-integration-demo
just basic 10 min implementation of cometchat-vapi demo

## Perquisite:
1. nodejs installed on the system ,preferable `node20`.
2. CometChat app (you can visit [this](https://app.cometchat.com) link and can create the ComeChat app).
3. a CometChat user which is a bot user.
4. CometChat users with the metadata as follows.
```JSON
    {
        "contact":"+911234567890"
    }
```
5. you should have ngrok installed in your system.
6. you should also have `vapi` account, you can create from [here](https://vapi.ai).


## Steps to follow.
1. clone the project.
2. run : `npm install`
3. crete a `.env` file from `.env.example` and replace the values.
4. run the ngrok on the port specified in `.env` file
5. create the webhook entry in `Vapi` dashboard as `ngrokdomain/user_call_response`
6. crete a webhook using `CometChat` [dashboard](https://app.cometchat.com) and where add the url `ngrokdomain/after_message`
7. once done run the following command on two terminal instances.


```SHELL
npm run start:webhooks
npm run start:sendMessage
```