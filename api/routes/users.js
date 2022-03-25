const express = require('express');
const router = express.Router();

const checkAuth = require('../middleware/checkAuth');
const UsersControllers = require('../controllers/users');


router.get('/hash', checkAuth, UsersControllers.get_hash);
router.post('/signup', UsersControllers.signup_user);
router.get('/:_id', checkAuth, UsersControllers.get_user);
router.delete('/:_id', checkAuth, UsersControllers.delete_user);
router.put('/:_id', checkAuth, UsersControllers.update_user);

module.exports = router;
