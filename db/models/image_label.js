const { sequelize, Sequelize } = require('../database');
const { DataTypes } = Sequelize;
const {Image} = require('./Image'); // Image Model

const ImageLabel = sequelize.define('ImageLabel', {
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Image, // Image model
            key: 'image_id'
        }
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    score: {
        type: DataTypes.FLOAT
    }
}, {
    sequelize,
    modelName: 'ImageLabel',
    timestamps: false, // prevent Sequelize from adding createdAt,updatedAt
    tableName: 'image_label', //
});

module.exports = {
    ImageLabel
};
