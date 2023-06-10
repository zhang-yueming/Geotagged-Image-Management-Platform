require('dotenv').config();
const express = require('express');
const path = require('path');
const { uploadToS3 } = require('../utils/s3Util');
const imageUtil = require('../utils/ImageUtil');

const uuid = require('uuid');
const { Image } = require('../db/models/image');
const { ImageMetadata } = require('../db/models/image_metadata');
const {ImageLabel} = require('../db/models/image_label');
const { format, startOfDay, endOfDay } = require('date-fns');


const multer = require('multer');
const {Op, Sequelize} = require("sequelize");
const {sequelize} = require("../db/database");

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
        /** Generate a new filename with UUID */
        const extension = file.originalname.split('.').pop();
        const s3FilePath = 'image/'+`${uuid.v4()}.${extension}`;

        /** Start label detection and EXIF data parsing in parallel */
        const [labels, metadata] = await Promise.all([
            imageUtil.getLabelsFromImage(file),
            imageUtil.getExifData(file)
        ]);

        /** Upload to S3 and create a new Image record in parallel */
        const [uploadResult, newImage] = await Promise.all([
            uploadToS3(s3FilePath, file),
            Image.create({
                image_name: file.originalname,
                bucket_key: s3FilePath
            })
        ]);

        /** Prepare label data */
        const labelData = labels.map(label => ({
            image_id: newImage.image_id,
            label: label.description,
            score: label.score
        }));

        if (metadata) {
            /** Create new ImageLabel records and ImageMetadata in parallel */
            metadata.image_id = newImage.image_id;
            await Promise.all([
                ImageLabel.bulkCreate(labelData),
                ImageMetadata.create(metadata)
            ]);
        } else {
            /** Create new ImageLabel records only */
            await ImageLabel.bulkCreate(labelData);
        }

        console.log(`Image uploaded: ${file.originalname}`);
        return res.status(200).json({ "imageId": newImage.imageId, });
    } catch (err) {
        console.log(`Upload error: ${file.originalname}`);
        res.status(400).json({ "message": err.message });
    }
});




// Query image
router.get('/getImages', async (req, res) => {
    try {
        const bucketName = process.env.S3_BUCKET;

        // 第一步：如果labels数组长度>=1，先查出所有满足条件的image_id
        let imageIds = [];
        if(req.query.labels && Array.isArray(req.query.labels) && req.query.labels.length > 0){
            const labels = req.query.labels;
            const imageLabels = await ImageLabel.findAll({
                attributes: ['image_id'],
                where: {
                    label: {
                        [Op.in]: labels
                    },
                },
                group: ['image_id'],
                having: Sequelize.where(Sequelize.fn('COUNT', Sequelize.col('image_id')), '>=', labels.length)
            });
            imageIds = imageLabels.map(imageLabel => imageLabel.image_id);

            if(imageIds.length == 0){
                return res.status(200).json({ "data": [] });
            }
        }

        // 构建第二次查询的条件
        let whereClause = {};
        // if(req.query.bgndate || req.query.enddate){
        //     whereClause.timestamp = {};
        //     if (req.query.bgndate) {
        //         const bgndate = new Date(req.query.bgndate);
        //         whereClause.timestamp[Op.gte] = bgndate;
        //     }
        //     if (req.query.enddate) {
        //         const enddate = new Date(req.query.enddate);
        //         whereClause.timestamp[Op.lte] = enddate;
        //     }
        // }

        if(req.query.bgndate || req.query.enddate){
            whereClause.timestamp = {};
            if (req.query.bgndate) {
                const bgndate = format(new Date(req.query.bgndate), 'yyyy-MM-dd');
                whereClause.timestamp[Op.gte] = startOfDay(new Date(bgndate));
            }
            if (req.query.enddate) {
                const enddate = format(new Date(req.query.enddate), 'yyyy-MM-dd');
                whereClause.timestamp[Op.lte] = endOfDay(new Date(enddate));
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
        if(imageIds.length > 0) {
            whereClause.image_id = {
                [Op.in]: imageIds
            };
        } else {
            // 如果没有imageIds满足条件，那么就不添加该查询条件
            delete whereClause.image_id;
        }


        // 第二步：使用满足条件的image_id进行查询
        // 建立一个新对象，将whereClause内容拷贝过来
        let whereClauseForImageMetadata = { ...whereClause };

        // 删除image_id属性
        if ('image_id' in whereClauseForImageMetadata) {
            delete whereClauseForImageMetadata['image_id'];
        }

        const images = await Image.findAll({
            distinct: true,
            include: [
                {
                    model: ImageMetadata,
                    required: true,
                    where: whereClauseForImageMetadata
                },
                {
                    model: ImageLabel,
                    required: false,  // 不是所有图片都有label，所以这里设为false
                }
            ],
            where: whereClause.image_id ? {
                // 这个过滤条件应用到Image模型上
                image_id: whereClause.image_id
            } : {},
            order: [
                ['update_time', 'DESC']
            ]
        });

        const imageData = images.map(image => {
            const key = image.bucket_key;
            const url = `https://${bucketName}.s3.amazonaws.com/${key}`;
            const metadata = image.ImageMetadatum.dataValues;  // 获取元数据
            const labels = image.ImageLabels.map(label => label.label);  // 获取所有标签
            return { url, metadata, labels };
        });

        return res.status(200).json({ "data": imageData });

    }//try
    catch (err) {
        res.status(400).json({ "message": err.message });
    }//catch
});



//init location autocomplete list
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


//init label autocomplete list
router.get('/labels', async (req, res) => {
    const searchQuery = req.query.q;
    const page = req.query.page || 1;
    const limit = 30;
    const offset = (page - 1) * limit;

    const labels = await ImageLabel.findAll({
        attributes: ['label'], // 只选取 'label' 列
        group: 'label',  // 根据 'label' 列进行分组
        where: {
            [Op.or]: [
                Sequelize.where(Sequelize.fn('lower', Sequelize.col('label')), 'LIKE', `%${searchQuery}%`),
            ]
        },
        limit: limit,
        offset: offset
    });

    const items = labels.map(label => ({ text: label.label }));
    res.json({ items: items, total_count: labels.length });

});



module.exports = router;