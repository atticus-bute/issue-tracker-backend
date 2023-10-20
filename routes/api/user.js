import express from 'express';
const router = express.Router();

import debug from 'debug';
const debugUser = debug('app:UserRouter');

import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { getUsers, getUserById, registerUser, loginUser, updateUser, deleteUser, connect } from '../../database.js';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';
import e from 'express';
import joi from 'joi';
import { ObjectId } from 'mongodb';
const newUserSchema = joi.object({
  givenName: joi.string().min(1).required(),
  familyName: joi.string().min(1).required(),
  email: joi.string().email().required(),
  password: joi.string().required(),
  role: joi.array().items(joi.string().valid('developer', 'quality analyst', 'business analyst', 'product manager', 'technical manager')).required()
});
const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required()
});
const updateUserSchema = joi.object({
  givenName: joi.string().min(1),
  familyName: joi.string().min(1),
  fullName: joi.string().min(1),
  email: joi.string().email(),
  password: joi.string(),
  role: joi.array().items(joi.string().valid('developer', 'quality analyst', 'business analyst', 'product manager', 'technical manager'))
});

router.use(express.urlencoded({ extended: false }));

//FIXME: use this array to store user data in for now
//we will replace this with a database in a later assignment

router.get('/list', async(req, res) => {
  debugUser(`hit list, with query string: ${JSON.stringify(req.query)}}`);
  let { keywords, role, maxAge, minAge, sortBy, pageSize, pageNumber } = req.query;
  let sort = {givenName: 1};
  let match = {};
  const today = new Date(); // Get current date and time
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0); // Remove time from Date
  const pastMaximumDaysOld = new Date(today);
  pastMaximumDaysOld.setDate(pastMaximumDaysOld.getDate() - maxAge); // Set pastMaximumDaysOld to today minus maxAge
  const pastMinimumDaysOld = new Date(today);
  pastMinimumDaysOld.setDate(pastMinimumDaysOld.getDate() - minAge); // Set pastMinimumDaysOld to today minus minAge
  debugUser(`pastMaximumDaysOld: ${pastMaximumDaysOld}`);
  debugUser(`pastMinimumDaysOld: ${pastMinimumDaysOld}`);

  try{
    if(keywords){
      match.$text = {$search: keywords};
    }

    if(role){
      match.role = role;
    }

    if (maxAge && minAge) {
      match.creationDate = { $lte: pastMinimumDaysOld, $gte: pastMaximumDaysOld };
    } else if (minAge) {
      match.creationDate = { $lte: pastMinimumDaysOld };
    } else if (maxAge) {
      match.creationDate = { $gte: pastMaximumDaysOld };
    }

    switch (sortBy) {
      case 'givenName': sort = {givenName: 1, familyName :1, creationDate: 1}; break;
      case 'familyName': sort = {familyName: 1, givenName: 1, creationDate: 1}; break;
      case 'role': sort = {role: 1, givenName: 1, familyName: 1, creationDate: 1}; break;
      case 'newest': sort = {creationDate: -1}; break;
      case 'oldest': sort = {creationDate: 1}; break;
    }
    debugUser(sort);

    pageNumber = parseInt(pageNumber) || 1;
    pageSize = parseInt(pageSize) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    debugUser(`match: ${JSON.stringify(match)}`);

    const pipeline = [
      { $match: match },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ];
    debugUser(`pipeline: ${JSON.stringify(pipeline)}`);

    const db = await connect();
    debugUser('Connected to database');
    const cursor = await db.collection('Users').aggregate(pipeline);
    debugUser('Got cursor');
    const users = await cursor.toArray();
    res.status(200).json(users);
  } catch (err) {
    debugUser('.get failed');
    res.status(500).json({error: err});
  }
});

router.get('/:userId', validId('userId'), async (req, res) => {
  debugUser('Getting user by id');
  const id = req.params.userId;
  try{
    const user = await getUserById(id);
    if (user) {
      debugUser('User found');
      res.status(200).json(user);
    } else {
      debugUser('User not found');
      res.status(404).json({ error: `User id #${id} not found` });
    }
  } catch (err) {
    debugUser('.get failed');
    res.status(500).json({error: 'Invalid ID'});
  }
});

router.post('/register', validBody(newUserSchema), async (req, res) => {
  //FIXME: register new user and send response as JSON
  const newUser = req.body;
  newUser.password = await bcrypt.hash(newUser.password, 10);
try {
  debugUser('Try block hit');
  const dbResult = await registerUser(newUser);
  debugUser('dbResult created');
  if(dbResult.acknowledged == true){
    debugUser('User registered')
    res.status(200).json({message:`User ${newUser._id} was added`});
  } else {
    debugUser(dbResult);
    res.status(400).json({message:dbResult});
  }
} catch (err) {
  debugUser('.post failed');
  res.status(500).json({error: err});
}
});

router.post('/login', async (req, res) => {
  //FIXME: check user's email and password and send response as JSON
  const loginAttempt = req.body;
  debugUser(loginAttempt);
  try{
    debugUser('Try block hit');
    const dbResult = await loginUser(loginAttempt);
    if(dbResult){
      debugUser(`User ${dbResult.fullName} logged in`)
      res.status(200).json({message:`User ${dbResult._id} was logged in`});
    } else {
      debugUser(dbResult);
      res.status(400).json({message:'Invalid email or password'});
    }
  } catch (err) {
    debugUser('.post failed');
    res.status(500).json({error: err});
  }
});

router.put('/:userId', validId('userId'), validBody(updateUserSchema), async (req, res) => {
  //FIXME: update existing user and send response as JSON
  const id = req.params.userId;
  const updatedUser = req.body;
  updatedUser.password = await bcrypt.hash(updatedUser.password, 10);
  try {
    debugUser('Try block hit');
    const dbResult = await updateUser(id, updatedUser);
    if(dbResult.modifiedCount == 1){
      debugUser('User updated');
      res.status(200).json({message:`User ${id} was updated`});
      } else {
        debugUser('User not updated');
        res.status(400).json({message:`Unable to update user ${id}`});
      }
  } catch (err) {
    debugUser(`User ${id} not found`);
    res.status(500).json({error: `User ${id} not found`});
  }
});

router.delete('/:userId', validId('userId'), async (req, res) => {
  const id = req.params.userId;
  try{
    const dbResult = await deleteUser(id);
    if(dbResult.deletedCount == 1){
      debugUser('User deleted');
      res.status(200).json({message:`User ${id} was deleted`});
    } else {
      debugUser('User not deleted');
      res.status(400).json({message:`Unable to delete user ${id}`});
    }
  } catch(err) {
    debugUser(`User ${id} not found`);
    res.status(500).json({error: `User ${id} not found`});
  }
});

export { router as userRouter };
