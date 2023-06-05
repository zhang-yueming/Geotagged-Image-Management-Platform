const {Image} = require('./models/image');
const {ImageMetadata} = require('./models/image_metadata');

Image.hasOne(ImageMetadata, { foreignKey: 'image_id' });
ImageMetadata.belongsTo(Image, { foreignKey: 'image_id' });
