const { WebPubSubServiceClient } = require("@azure/web-pubsub");

module.exports = async function (context, req) {
    const signalRConnectionString = process.env.AzureSignalRConnectionString;
    const hubName = "summarizer";

    const { connectionId, downloadUrl } = req.body;

    if (!connectionId || !downloadUrl) {
         context.res = { status: 400, body: "connectionId or downloadUrl is missing." };
         return;
    }

    let serviceClient = new WebPubSubServiceClient(signalRConnectionString, hubName);

    // ส่งข้อความไปที่ Connection ID ที่ระบุเท่านั้น
    await serviceClient.sendToConnection(connectionId, {
        type: 'summaryComplete',
        url: downloadUrl
    });

    context.res = {
        status: 200,
        body: "Notification sent."
    };
};