require('dotenv').config();
const express = require('express');
const path = require('path');
const { uploadToS3 } = require('../utils/s3Util');  // update with your actual path
const imageUtil = require('../utils/ImageUtil'); // 根据实际情况更改路径

const uuid = require('uuid');
const { Image } = require('../db/models/image');
const { ImageMetadata } = require('../db/models/image_metadata');


const multer = require('multer');
const {Op} = require("sequelize");

let upload = multer({
    dest: 'uploads/',  // dest设置上传文件的存放路径，这个路径需要预先创建
    storage: multer.memoryStorage()
});

const router = express.Router();
const rootPath = path.dirname(require.main.filename);



router.get('/', function(req, res, next) {
    res.sendFile( path.join(rootPath, 'views', 'main.html'));
});


//upload image
router.post('/uploadImg', upload.single('file'), async (req, res) => {
    console.log("call to /uploadImg...");
    const file = req.file;
    try {
        /** Generate a new filename with UUID*/
        const extension = file.originalname.split('.').pop();
        const s3FilePath = 'image/'+`${uuid.v4()}.${extension}`;

        /** Upload to S3 */
        const uploadResult = await uploadToS3(s3FilePath, file);

        /** Parse Image */
        // const s3FileUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${s3FilePath}`;
        const metadata = await imageUtil.getExifData(file);

        /** Save db record */
        const newImage = await Image.create({
            image_name: file.originalname,
            bucket_key: s3FilePath
        });

        if (metadata) {
            await ImageMetadata.create({
                image_id: newImage.image_id,
                timestamp: metadata.timestamp,
                latitude: metadata.latitude,
                longitude: metadata.longitude,
                country: metadata.country,
                administrative_area_level_1: metadata.administrative_area_level_1,
                administrative_area_level_2: metadata.administrative_area_level_2,
                city: metadata.city,
                street: metadata.street,
                postal_code: metadata.postal_code
            });
        }

        console.log(`Image uploaded: ${file.originalname}`);
        return res.status(200).json({ "imageId": newImage.imageId,});
    }//try
    catch (err) {
        console.log(`Upload error: ${file.originalname}`);
        res.status(400).json({ "message": err.message });
    }//catch
});


// Query image
router.get('/getImages', async (req, res) => {
    try {
        const bucketName = process.env.S3_BUCKET;

        //根据条件查询图片
        let whereClause = {};
        if(req.query.date){
            const date = new Date(req.query.date);
            whereClause.timestamp = {
                [Op.gte]: date,
                [Op.lte]: date
            };
        }

        const images = await Image.findAll({
            include: [{
                model: ImageMetadata,
                where: whereClause
            }]
        });

        const imageUrls = images.map(image => {
            const key = image.bucket_key;
            return `https://${bucketName}.s3.amazonaws.com/${key}`;
        });
        return res.status(200).json({ "urls": imageUrls});
    }//try
    catch (err) {
        res.status(400).json({ "message": err.message });
    }//catch
});


module.exports = router;