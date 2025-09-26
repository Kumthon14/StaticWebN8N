const { WebPubSubServiceClient } = require("@azure/web-pubsub");

module.exports = async function (context, req) {
    // ดึง Connection String ของ SignalR และ Storage จาก Environment Variables
    const signalRConnectionString = process.env.SIGNALR_CONNECTION_STRING;
    const hubName = "summarizer"; // ตั้งชื่อ Hub ของเรา

    if (!signalRConnectionString) {
        context.res = { status: 500, body: "AzureSignalRConnectionString is not set." };
        return;
    }

    let serviceClient = new WebPubSubServiceClient(signalRConnectionString, hubName);
    let token = await serviceClient.getClientAccessToken();

    context.res = {
        body: {
            url: token.url
        }
    };
};