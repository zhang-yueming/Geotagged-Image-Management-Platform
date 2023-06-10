const express = require('express');
const path = require("path");
const router = express.Router();

const rootPath = path.dirname(require.main.filename);

// router.get('/', function(req, res, next) {
//     res.send('Hello World!');
// });

router.get('/', function(req, res, next) {
    res.sendFile( path.join(rootPath, 'views', 'index.html'));
});

module.exports = router;
