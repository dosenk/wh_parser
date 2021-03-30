var express = require('express');
var router = express.Router();
const connectController = require('../controller/connect.controller');

router.get('/', connectController.getQr);

module.exports = router;