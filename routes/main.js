require('dotenv').config();
const express = require('express');
const path = require('path');
const { uploadToS3 } = require('../utils/s3Util');  // update with your actual path
const imageUtil = require('../utils/ImageUtil'); // 根据实际情况更改路径

const uuid = require('uuid');
const { Image } = require('../db/models/image');
const { ImageMetadata } = require('../db/models/image_metadata');


const multer = require('multer');
const {Op, Sequelize} = require("sequelize");

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

        // 根据条件查询图片
        let whereClause = {};
        if(req.query.bgndate || req.query.enddate){
            whereClause.timestamp = {};
            if (req.query.bgndate) {
                const bgndate = new Date(req.query.bgndate);
                whereClause.timestamp[Op.gte] = bgndate;
            }
            if (req.query.enddate) {
                const enddate = new Date(req.query.enddate);
                whereClause.timestamp[Op.lte] = enddate;
            }
        }
        // 添加额外的查询参数
        if(req.query.country) {
            whereClause.country = req.query.country;
        }
        if(req.query.administrative_area_level_1) {
            whereClause.administrative_area_level_1 = req.query.administrative_area_level_1;
        }
        if(req.query.administrative_area_level_2) {
            whereClause.administrative_area_level_2 = req.query.administrative_area_level_2;
        }
        if(req.query.city) {
            whereClause.city = req.query.city;
        }
        if(req.query.street) {
            whereClause.street = req.query.street;
        }
        if(req.query.postal_code) {
            whereClause.postal_code = req.query.postal_code;
        }


        const images = await Image.findAll({
            include: [{
                model: ImageMetadata,
                //required: false,
                where: whereClause
            }],
            order: [
                ['update_time', 'DESC']
            ]
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



//init location autocomplete
router.get('/initLocation', async (req, res) => {
    try {
        let key = req.query.key.toLowerCase();
        let results = await ImageMetadata.findAll({
            attributes: ['country', 'administrative_area_level_1', 'administrative_area_level_2', 'city', 'street', 'postal_code'],
            where: {
                [Op.or]: [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('country')), 'LIKE', `%${key}%`),
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('administrative_area_level_1')), 'LIKE', `%${key}%`),
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('administrative_area_level_2')), 'LIKE', `%${key}%`),
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('city')), 'LIKE', `%${key}%`),
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('street')), 'LIKE', `%${key}%`),
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('postal_code')), 'LIKE', `%${key}%`)
                ]
            },
            group: ['country', 'administrative_area_level_1', 'administrative_area_level_2', 'city', 'street', 'postal_code'] // 去重
        });

        let formattedResults = results.map(result => {
            let data = result.dataValues;
            let locationArray = [data.country, data.administrative_area_level_1, data.administrative_area_level_2, data.city, data.street];
            let nonEmptyData = locationArray.filter(item => item); // 移除为空的项
            let resultString = nonEmptyData.join(', ');
            if (data.postal_code) {
                resultString += ' (' + data.postal_code + ')';
            }

            // 创建一个包含所有字段和拼接的字符串的对象
            let item = {
                resultString: resultString,
                country: data.country,
                administrative_area_level_1: data.administrative_area_level_1,
                administrative_area_level_2: data.administrative_area_level_2,
                city: data.city,
                street: data.street,
                postal_code: data.postal_code
            };

            return item;
        });

        // 去重
        formattedResults = Array.from(new Set(formattedResults.map(JSON.stringify))).map(JSON.parse);

        res.json(formattedResults);
    } catch (err) {
        res.status(400).json({ "message": err.message });
    }
});




module.exports = router;