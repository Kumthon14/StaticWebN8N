const { BlobServiceClient } = require("@azure/storage-blob");
const multipart = require("parse-multipart-data");

module.exports = async function (context, req) {
    try {
        const storageConnectionString = process.env.STORAGE_CONNECTION_STRING;
        const containerName = "input-files";

        // แยกส่วนของ multipart/form-data
        const boundary = multipart.getBoundary(req.headers['content-type']);
        const parts = multipart.parse(req.body, boundary);

        const fileData = parts.find(part => part.name === 'file');
        const connectionId = parts.find(part => part.name === 'connectionId').data.toString();

        if (!fileData || !connectionId) {
            context.res = { status: 400, body: "File or connectionId is missing." };
            return;
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        // สร้างชื่อไฟล์ใหม่ที่ไม่ซ้ำกัน
        const blobName = `${context.invocationId}-${fileData.filename}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.upload(fileData.data, fileData.data.length, {
            // บันทึก Connection ID ไว้ใน Metadata
            metadata: {
                connectionId: connectionId
            }
        });

        context.res = {
            status: 200,
            body: { message: "File uploaded successfully. Processing...", fileName: blobName }
        };
    } catch (error) {
        context.log.error(error);
        context.res = {
            status: 500,
            body: { message: "An error occurred during file upload." }
        };
    }
};