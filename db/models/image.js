const { sequelize, Sequelize } = require('../database');
const { DataTypes } = Sequelize;

const Image = sequelize.define('Image', {
    image_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1,
    },
    update_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    image_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    bucket_key: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    sequelize,
    modelName: 'Image',
    timestamps: false, // prevent Sequelize from adding createdAt,updatedAt
    tableName: 'image', //
});

module.exports = {
    Image
};