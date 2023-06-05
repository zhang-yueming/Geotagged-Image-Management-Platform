require('dotenv').config();
require('./db/associations');  // 引入关联定义

const express = require('express');
const app = express();
const port = process.env.PORT

app.use(express.static('views'));  //Specify the static files folder


const multer = require('multer');
const upload = multer();



const indexRouter = require('./routes/index');
const mainRouter = require('./routes/main');
const {sequelize} = require("./db/database");

app.use('/', indexRouter);
app.use('/main', mainRouter);
// app.post('/api/uploadImg', upload.none(), main.uploadImg)


app.listen(port, () => {
    sequelize.sync();
    console.log(`Express app listening on port ${port}`);
});
