const { sequelize, Sequelize } = require('../database');
const { DataTypes } = Sequelize;
const {Image} = require('./Image'); // Image模型

const ImageMetadata = sequelize.define('ImageMetadata', {
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Image, // 这是你的Image模型
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
    timestamps: false, // 防止Sequelize自动添加createdAt和updatedAt字段
    tableName: 'image_metadata', // 显式声明表名
});


module.exports = {
    ImageMetadata
};