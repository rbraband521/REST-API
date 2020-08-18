'use strict';
const express = require('express');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const router = express.Router();
const User = require('./models').User;
const Course = require('./models').Course;
const { check, validationResult } = require('express-validator');

// function to wrap each route in try/catch blocks. Saves time and coding space
function asyncHandler(cb) {
    return async(req, res, next) => {
        try{
            await cb(req, res, next)
        } catch(error){
            next(error);
          }
    }
}

const authenticateUser = async (req, res, next) => {
    try {
        let message = null;
        const credentials = auth(req);
        if (credentials) {
            const allUsers = await User.findAll({ attributes: ['id','emailAddress', 'password']});
            const user = allUsers.find( u => u.emailAddress === credentials.name);
            if (user) {
                const authenticated = bcryptjs 
                    .compareSync(credentials.pass, user.password);
                if (authenticated) {
                    req.currentUser = user;
                    } else {
                        message = `Authentication failure for user email address: ${user.emailAddress}`;
                    }
                } else {
                message = `User not found: ${credentials.name}`;
            }
        } else {
            message = 'Auth header not found';
        };
        if (message) {
            console.warn(message);
            res.status(401).json({ message: "Access Denied" });
        } else {
            next();
        };
    } catch (error) {
        throw error;
    };
};

/*****USER ROUTES******/
/*****Returns the currently authenticated user STATUS: 200 *****/
router.get('/users', authenticateUser, (req, res) => {
    const user = req.currentUser;

    res.json({
      Username: user.emailAddress,
      password: user.password,
    });
});

/***** Creates a user, sets Location header to '/' and returns no content STATUS: 201 *****/
router.post('/users', [
    check('firstName')
        .exists()
        .withMessage('Please provide a value for "firstName"'),
    check('password')
        .exists()
        .withMessage('Please provide a value for "password"'),
    ], async (req, res) => {  
        const errors = validationResult(req);
        let user;
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({ errors: errorMessages });
        } else {
            try {
                user = await User.create( {
                    id: null,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    emailAddress: req.body.emailAddress,
                    password: bcryptjs.hashSync(req.body.password)
                })
                res.status(201).location('/').end();
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }
    }
);

/*****COURSE ROUTES*****/

/***** Returns a list of courses(including the user that owns each course) STAUTS: 200 *****/
router.get('/courses', async (req, res) => {
    try {
    const courses = await Course.findAll({
        include: {
            model: User,
            as: 'user',
            attributes: ["id", "firstName", "lastName", "emailAddress" ]
        },
        attributes: ["id", "title", "description", "estimatedTime", "materialsNeeded"]
    });
    res.json(courses);
    res.status(200).end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/***** Returns  the course(including the user that owns the course) for the provided course ID STATUS: 200 *****/
router.get('/courses/:id', async (req, res) => {
    try {
        const courseId = req.params.id;
        const courses = await Course.findByPk(courseId, {
            include: {
                model: User,
                as: 'user',
                attributes: ["id", "firstName", "lastName", "emailAddress" ]
            },
            attributes: ["id", "title", "description", "estimatedTime", "materialsNeeded"]
        });
        res.json(courses);
        res.status(200).end();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
});

/***** Creates a course, sets the Location header to the URL for the course, and returns no content STATUS: 201 *****/
router.post('/courses',
//  [
//     check('firstName')
//         .exists()
//         .withMessage('Please provide a value for "firstName"'),
//     check('password')
//         .exists()
//         .withMessage('Please provide a value for "password"'),
//     ], 
    async (req, res) => {  
        const errors = validationResult(req);
        let course = req.body;
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({ errors: errorMessages });
        } else {
            try {
                course = await Course.create( {
                    userId: req.body.userId,
                    title: req.body.title,
                    description: req.body.description,
                    estimatedTime: req.body.estimatedTime,
                    materialsNeeded: req.body.materialsNeeded,
                })
                res.status(201).location('/').end();
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }
    }
);;

/***** Updates a course, returns no content STATUS: 204 *****/
router.put('/courses/:id', authenticateUser, (async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({ errors: errorMessages });
    }
    const user = req.currentUser;
    const course = await Course.findByPk(req.params.id);
    console.log(course.userId);
    if(course.userId === user.id) {
        try {
            await course.update({
                userId: req.currentUser.id,
                title: req.body.title,
                description: req.body.description,
                estimatedTime: req.body.estimatedTime,
                materialsNeeded: req.body.materialsNeeded,
            })
            res.status(204).end();
        } catch(error) {
            res.status(400).json({ message: error.message });
        }
    } else {
        res.status(403).json({ message: "Access Denied: You do not have proper authorization"});
    }
}));

// if(course.userId !== req.currentUser.id) {
//     res.status(403).json({message: "Access Denied"});
// }
// if (!errors.isEmpty()) {
//     const errorMessages = errors.array().map(error => error.msg);
//     return res.status(400).json({ errors: errorMessages });

/***** Deletes a course, returns no content STATUS: 204 *****/
router.delete('/courses/:id', authenticateUser, asyncHandler (async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({ errors: errorMessages });
    }
    const user = req.currentUser;
    const course = await Course.findByPk(req.params.id);
    if(course.userId === user.id) {
        await course.destroy();
        res.status(204).location('/').end()
    } else {
        res.status(403).json({ message: "Access Denied: You do not have proper authorization to perform this action" });
    }
}));


module.exports = router;