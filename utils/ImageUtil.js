const axios = require('axios');
const ExifParser = require('exif-parser');
const { Client } = require('@googlemaps/google-maps-services-js');
const vision = require('@google-cloud/vision');
const path = require('path');  // 引入 Node.js 的 path 模块

class ImageUtils {

    // call Google vision API to get label info
    static async getLabelsFromImage(file) {
        const client = new vision.ImageAnnotatorClient({
            keyFilename: path.join(__dirname, '../studious-optics-388905-554dfafd7d7d.json')
        });

        const [result] = await client.labelDetection({
            image: { content: file.buffer.toString('base64') }
        });

        const labels = result.labelAnnotations;
        return labels;

    }




    static async getExifData(file) {
        try {
            // const response = await axios.get(imageUrl, {responseType: 'arraybuffer'});
            // const buffer = Buffer.from(file.data, 'binary');
            const buffer = file.buffer;
            const parser = ExifParser.create(buffer);
            const result = parser.parse();

            if (!result) {
                return null;
            }

            const {tags} = result;
            const data = {};

            if (tags.DateTimeOriginal) {
                data.timestamp = new Date(tags.DateTimeOriginal * 1000);
            }

            if (tags.GPSLatitude && tags.GPSLongitude) {
                data.latitude = tags.GPSLatitude;
                data.longitude = tags.GPSLongitude;

                const geoData = await ImageUtils.getGeoData(data.latitude, data.longitude);
                Object.assign(data, geoData);
            }

            return data;
        } catch (error) {
            console.error(`Error in parsing image EXIF data: ${error}`);
            return null;
        }
    }



    static async getGeoData(lat, lon) {
        const client = new Client({});
        try {
            const response = await client.reverseGeocode({
                params: {
                    latlng: { lat, lng: lon },
                    key: process.env.GOOGLE_MAP_API_KEY,
                }
            });

            const { results } = response.data;
            const addressComponents = results[0].address_components;
            const geoData = ImageUtils.extractGeoData(addressComponents);
            return geoData;
        } catch (error) {
            console.error(`Error in getting geo data: ${error}`);
            return null;
        }
    }

    static extractGeoData(components) {
        const geoData = {};

        for (let component of components) {
            const componentType = component.types[0];

            switch (componentType) {
                case 'country':
                    geoData.country = component.long_name;
                    break;
                case 'administrative_area_level_1':
                    geoData.administrative_area_level_1 = component.long_name;
                    break;
                case 'administrative_area_level_2':
                    geoData.administrative_area_level_2 = component.long_name;
                    break;
                case 'locality': // city
                    geoData.city = component.long_name;
                    break;
                case 'route': // street
                    geoData.street = component.long_name;
                    break;
                case 'postal_code':
                    geoData.postal_code = component.long_name;
                    break;
                default:
                    break;
            }
        }
        return geoData;
    }
}

module.exports = ImageUtils;
