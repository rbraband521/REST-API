'use strict';
const express = require('express');
const bcryptjs = require('bcryptjs');
const router = express.Router();
const User = require('./models').User;
const { check, validationResult } = require('express-validator');

//function to wrap each route in try/catch blocks. Saves time and coding space
function asyncHandler(cb) {
    return async(req, res, next) => {
        try{
            await cb(req, res, next)
        } catch(error){
            next(error);
          }
    }
}



const nameValidator = check('name')
  .exists({ checkNull: true, checkFalsy: true })
  .withMessage('Please provide a value for "name"');

/*****USER ROUTES******/
const users = [];
/*****Returns the currently authenticated user STATUS: 200 *****/
router.get('/users', asyncHandler,(async(req, res) => {
    res.json(users);
}));

/***** Creates a user, sets Location header to '/' and returns no content STATUS: 201 *****/
router.post('/users', [
    check('name')
        .exists()
        .withMessage('Please provide a value for "name"'),
    check('username')
        .exists()
        .withMessage('Please provide a value for "username"'),
    check('password')
        .exists()
        .withMessage('Please provide a value for "password"'),
    ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({ errors: errorMessages });
    }
    //Get the user from the request body
    const user = req.body;
    // Hash the new user's password.
    user.password = bcryptjs.hashSync(user.password);
    //Add the user to the 'users' array
    users.push(user);
    //Set the status to 201, created and end the response
    res.status(201).end();
});

/*****COURSE ROUTES*****/

/***** Returns a list of courses(including the user that owns each course) STAUTS: 200 *****/
router.get('/courses', (req, res) => {

});

/***** Returns  the course(including the user that owns the course) for the provided course ID STATUS: 200 *****/
router.get('/courses/:id', (req, res) => {

});

/***** Creates a course, sets the Location header to the URL for the course, and returns no content STATUS: 201 *****/
router.post('/courses', (req, res) => {

});

/***** Updates a course, returns no content STATUS: 204 *****/
router.put('/courses/:id', (req, res) => {

});

/***** Deletes a course, returns no content STATUS: 204 *****/
router.delete('/courses/:id', (req, res) => {

});


module.exports = router;