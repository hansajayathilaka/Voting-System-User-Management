const express = require('express');
const router = express.Router();
const multer = require("multer");

const checkAuth = require('../middleware/checkAuth');
const UsersControllers = require('../controllers/users');
const upload = multer({ dest: "media/" });


router.get('/validate', checkAuth, UsersControllers.validate);
router.get('/hash', checkAuth, UsersControllers.get_hash);
router.post('/signup', upload.array("files"), UsersControllers.signup_user);
router.get('/:_id', checkAuth, UsersControllers.get_user);
router.delete('/:_id', checkAuth, UsersControllers.delete_user);
router.put('/:_id', checkAuth, UsersControllers.update_user);
router.post('/login',UsersControllers.login_user );

module.exports = router;
