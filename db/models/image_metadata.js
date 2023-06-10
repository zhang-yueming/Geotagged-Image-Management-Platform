const { sequelize, Sequelize } = require('../database');
const { DataTypes } = Sequelize;
const {Image} = require('./Image'); //

const ImageMetadata = sequelize.define('ImageMetadata', {
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Image, //
            key: 'image_id'
        }
    },
    timestamp: {
        type: DataTypes.DATE
    },
    latitude: {
        type: DataTypes.DOUBLE
    },
    longitude: {
        type: DataTypes.DOUBLE
    },
    country: {
        type: DataTypes.STRING
    },
    administrative_area_level_1: {
        type: DataTypes.STRING
    },
    administrative_area_level_2: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING
    },
    street: {
        type: DataTypes.STRING
    },
    postal_code: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    modelName: 'ImageMetadata',
    timestamps: false, // prevent Sequelize from adding createdAt,updatedAt
    tableName: 'image_metadata', //
});


module.exports = {
    ImageMetadata
};