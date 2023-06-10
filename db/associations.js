const {Image} = require('./models/image');
const {ImageMetadata} = require('./models/image_metadata');
const {ImageLabel} = require('./models/image_label');  // 导入ImageLabel模型

Image.hasOne(ImageMetadata, {
    foreignKey: 'image_id',
    sourceKey: 'image_id'
});
ImageMetadata.belongsTo(Image, { foreignKey: 'image_id' });

Image.hasMany(ImageLabel, { foreignKey: 'image_id' }); //
ImageLabel.belongsTo(Image, { foreignKey: 'image_id' }); //
