const { body } = require('express-validator');

const name = body('name')
  .isLength({ min: 3, max: 60 })
  .withMessage('Name must be between 3 and 60 characters');

const address = body('address')
  .optional().isLength({ max: 400 }).withMessage('Address max 400 chars');

const password = body('password')
  .isLength({ min: 8, max: 16 })
  .withMessage('Password must be 8-16 chars')
  .matches(/[A-Z]/).withMessage('Password must have an uppercase letter')
  .matches(/[^A-Za-z0-9]/).withMessage('Password must have a special character');

const email = body('email').isEmail().withMessage('Invalid email');

module.exports = { name, address, password, email };
