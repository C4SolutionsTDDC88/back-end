const express = require('express');
const router = express.Router();

router.use('/search', require('./search'));
router.use('/case', require('./case'));
router.use('/login', require('./login'));


module.exports = router;