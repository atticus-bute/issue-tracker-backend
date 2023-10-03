import express from 'express';
const router = express.Router();

import debug from 'debug';
const debugUser = debug('app:UserRouter');

import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { getUsers, getUserById, registerUser, loginUser, updateUser, deleteUser } from '../../database.js';
import e from 'express';
import { ObjectId } from 'mongodb';

router.use(express.urlencoded({ extended: false }));

//FIXME: use this array to store user data in for now
//we will replace this with a database in a later assignment

router.get('/list', async(req, res) => {
  debugUser('Getting all users');
  try{
    const users = await getUsers();
    res.status(200).json(users);
  } catch (err) {
    debugUser('.get failed');
    res.status(500).json({error: err});
  }
});

router.get('/:userId', async (req, res) => {
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
    res.status(500).json({error: err});
  }
});

router.post('/register', async (req, res) => {
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

router.put('/:userId', async (req, res) => {
  //FIXME: update existing user and send response as JSON
  const id = req.params.userId;
  const updatedUser = req.body;
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

router.delete('/:userId', async (req, res) => {
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
