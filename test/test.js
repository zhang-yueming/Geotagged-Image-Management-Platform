const fs = require('fs');
const ExifParser = require('exif-parser');
const axios = require('axios');

// Read image file
const buffer = fs.readFileSync('C:/Users/Zhang Yueming/Desktop/IMG-3942.jpg');


function hasExifData(imagePath) {
    try {
        const buffer = fs.readFileSync(imagePath);
        const parser = ExifParser.create(buffer);
        const result = parser.parse();
        // 如果没有抛出错误，说明图片包含EXIF信息
        return true;
    } catch (error) {
        // 如果解析过程中抛出了错误，那么我们可以假定这个图片不包含EXIF信息
        return false;
    }
}
console.log(hasExifData('C:/Users/Zhang Yueming/Desktop/IMG-3942.jpg'));












// Create a parser
const parser = ExifParser.create(buffer);

// Parse the EXIF data
const result = parser.parse();

console.log(result.tags.GPSLatitude, result.tags.GPSLongitude);

// Use your own API Key
const apiKey = 'AIzaSyAGapUUWkc-nqjrpfAgOoaMscFVc-_UkAk';

// The latitude and longitude you got from the image
const lat = result.tags.GPSLatitude;
const lon = result.tags.GPSLongitude;

axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`)
    .then(response => {
        let result = response.data.results[0];

        let country = null, administrative_area_level_1 = null, administrative_area_level_2 = null, administrative_area_level_3 = null, city = null,
            sublocality = null, street = null, postal_code = null, premise = null, subpremise = null;

        for (let i = 0; i < result.address_components.length; i++) {
            if (result.address_components[i].types.indexOf('country') !== -1) {
                country = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('administrative_area_level_1') !== -1) {
                administrative_area_level_1 = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('administrative_area_level_2') !== -1) {
                administrative_area_level_2 = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('administrative_area_level_3') !== -1) {
                administrative_area_level_3 = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('locality') !== -1) {
                city = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('sublocality') !== -1) {
                sublocality = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('route') !== -1) {
                street = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('postal_code') !== -1) {
                postal_code = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('premise') !== -1) {
                premise = result.address_components[i].long_name;
            }
            if (result.address_components[i].types.indexOf('subpremise') !== -1) {
                subpremise = result.address_components[i].long_name;
            }
        }

        console.log({
            country: country,
            administrative_area_level_1: administrative_area_level_1,
            administrative_area_level_2: administrative_area_level_2,
            administrative_area_level_3: administrative_area_level_3,
            city: city,
            sublocality: sublocality,
            street: street,
            postal_code: postal_code,
            premise: premise,
            subpremise: subpremise
        });
    }).catch(error => {
    console.log(error);
});




