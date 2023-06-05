require('dotenv').config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");



const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});


async function uploadToS3(key, file) {
    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
    };
    const command = new PutObjectCommand(params);

    try {
        return await s3Client.send(command);
    } catch (err) {
        console.error(err);
    }
}


module.exports = { uploadToS3 };
