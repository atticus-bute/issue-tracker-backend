import express, { json } from 'express';
import debug from 'debug';
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import {
  newId,
  getUsers,
  getUserById,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  connect,
  recordEdit,
  recordRegister,
} from '../../database.js';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';
import e from 'express';
import joi from 'joi';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const router = express.Router();
router.use(express.urlencoded({ extended: false }));
const debugUser = debug('app:UserRouter');
const newUserSchema = joi.object({
  givenName: joi.string().min(1).required(),
  familyName: joi.string().min(1).required(),
  email: joi.string().email().required(),
  password: joi.string().required(),
  role: joi
    .array()
    .items(
      joi.string().valid('developer', 'quality analyst', 'business analyst', 'product manager', 'technical manager')
    )
    .required(),
});
const loginSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});
const updateUserSchema = joi.object({
  givenName: joi.string().min(1),
  familyName: joi.string().min(1),
  fullName: joi.string().min(1),
  email: joi.string().email(),
  password: joi.string(),
  role: joi
    .array()
    .items(
      joi.string().valid('developer', 'quality analyst', 'business analyst', 'product manager', 'technical manager')
    ),
});

async function issueAuthToken(user) {
  const payload = { _id: user._id, email: user.email, role: user.role };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: '1h' };

  const authToken = jwt.sign(payload, secret, options);
  return authToken;
}
function issueAuthCookie(res, authToken) {
  const cookieOptions = { httpOnly: true, maxAge: 1000 * 60 * 60 };
  res.cookie('authToken', authToken, cookieOptions);
}

router.get('/list', async (req, res) => {
  //debugUser(`req.auth = ${JSON.stringify(req.auth)}`);
  if (!req.auth) {
    debugUser(req.auth);
    res.status(401).json({ error: 'Not authorized' });
    return;
  }
  debugUser(`hit list, with query string: ${JSON.stringify(req.query)}}`);
  let { keywords, role, maxAge, minAge, sortBy, pageSize, pageNumber } = req.query;
  let sort = { givenName: 1 };
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
  // debugUser(`pastMaximumDaysOld: ${pastMaximumDaysOld}`);
  // debugUser(`pastMinimumDaysOld: ${pastMinimumDaysOld}`);

  try {
    if (keywords) {
      match.$text = { $search: keywords };
    }

    if (role) {
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
      case 'givenName':
        sort = { givenName: 1, familyName: 1, creationDate: 1 };
        break;
      case 'familyName':
        sort = { familyName: 1, givenName: 1, creationDate: 1 };
        break;
      case 'role':
        sort = { role: 1, givenName: 1, familyName: 1, creationDate: 1 };
        break;
      case 'newest':
        sort = { creationDate: -1 };
        break;
      case 'oldest':
        sort = { creationDate: 1 };
        break;
    }

    pageNumber = parseInt(pageNumber) || 1;
    pageSize = parseInt(pageSize) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    // debugUser(`match: ${JSON.stringify(match)}`);

    const pipeline = [{ $match: match }, { $sort: sort }, { $skip: skip }, { $limit: limit }];
    // debugUser(`pipeline: ${JSON.stringify(pipeline)}`);

    const db = await connect();
    // debugUser('Connected to database');
    const cursor = await db.collection('Users').aggregate(pipeline);
    // debugUser('Got cursor');
    const users = await cursor.toArray();
    res.status(200).json(users);
  } catch (err) {
    debugUser('.get failed');
    res.status(500).json({ error: err });
  }
});

router.get('/me', async (req, res) => {
  debugUser('Getting Current User');
  try {
    if (!req.auth) {
      debugUser(req.auth);
      res.status(401).json({ error: 'No User Logged In' });
      return;
    } else {
      debugUser(`req.auth = ${JSON.stringify(req.auth)}`);
      const id = req.auth._id;
      const user = await getUserById(id);
      if (user) {
        debugUser(user);
        res.status(200).json(user);
      } else {
        debugUser('User not found');
        res.status(404).json({ error: `User id #${id} not found` });
      }
    }
  } catch (err) {
    debugUser('.get failed');
    res.status(500).json({ error: err });
  }
});

router.get('/:userId', validId('userId'), async (req, res) => {
  debugUser('Getting user by id');
  if (!req.auth) {
    debugUser(req.auth);
    res.status(401).json({ error: 'Not authorized' });
    return;
  }
  const id = req.params.userId;
  try {
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
    res.status(500).json({ error: 'Invalid ID' });
  }
});

router.post('/register', validBody(newUserSchema), async (req, res) => {
  const newUser = {
    _id: newId(),
    ...req.body,
    creationDate: new Date(),
  };
  newUser.password = await bcrypt.hash(newUser.password, 10);
  try {
    //debugUser('Try block hit');
    const dbResult = await registerUser(newUser);
    //debugUser('dbResult created');
    if (dbResult.acknowledged == true) {
      const editResult = await recordRegister(newUser, 'Users', 'insert');
      issueAuthCookie(res, await issueAuthToken(newUser));
      debugUser(`User ${newUser._id} added.`);
      res.status(200).json({ message: `User ${newUser._id} was added.` });
    } else {
      debugUser(dbResult);
      res.status(400).json({ message: `User ${newUser._id} was not added` });
    }
  } catch (err) {
    debugUser('.post failed');
    res.status(500).json({ error: err });
  }
});

router.post('/login', validBody(loginSchema), async (req, res) => {
  const loginAttempt = req.body;
  debugUser(loginAttempt);
  try {
    //debugUser('Try block hit');
    const resultUser = await loginUser(loginAttempt);
    if (resultUser && (await bcrypt.compare(loginAttempt.password, resultUser.password))) {
      const authToken = await issueAuthToken(resultUser);
      issueAuthCookie(res, authToken);
      debugUser(`User ${resultUser.fullName} logged in`);
      res.status(200).json({ message: `Welcome ${resultUser.fullName}! Your auth token is ${authToken}` });
    } else {
      debugUser(resultUser);
      res.status(400).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    debugUser('.post failed');
    res.status(500).json({ error: err });
  }
});
router.put('/me', validBody(updateUserSchema), async (req, res) => {
  if (!req.auth) {
    debugUser(req.auth);
    res.status(401).json({ error: 'Not authorized' });
    return;
  }
  debugUser('Updating Current User');
  const updatedUser = req.body;
  if (updatedUser.password) {
    updatedUser.password = await bcrypt.hash(updatedUser.password, 10);
  }
  updatedUser.lastUpdatedOn = new Date();
  updatedUser.lastUpdatedBy = req.auth;
  try {
    debugUser('Try block hit');
    const dbResult = await updateUser(req.auth._id, updatedUser);
    if (dbResult.modifiedCount == 1) {
      debugUser('User updated');
      const newUser = await getUserById(req.auth._id);
      let editLog = '';
      if (req.body.password) {
        editLog = `User updated password. `;
      }
      if (req.body.fullName) {
        editLog += `Full name = ${req.body.fullName}. `;
      }
      if (req.body.givenName) {
        editLog += `Given name = ${req.body.givenName}. `;
      }
      if (req.body.familyName) {
        editLog += `Family name = ${req.body.familyName}. `;
      }
      if (req.body.role) {
        editLog += `Role = ${req.body.role}. `;
      }
      const editResult = await recordEdit(newUser, 'Users', 'update', editLog, req.auth);
      const authToken = await issueAuthToken(newUser);
      issueAuthCookie(res, authToken);
      debugUser(`User ${newUser.fullName} logged in`);
      res.status(200).json({ message: `User ${req.auth._id} was updated` });
    } else {
      debugUser('User not updated');
      res.status(400).json({ message: `Unable to update user ${id}` });
    }
  } catch (err) {
    debugUser(`User ${id} not found`);
    res.status(500).json({ error: `User ${id} not found` });
  }
});
router.put('/:userId', validId('userId'), validBody(updateUserSchema), async (req, res) => {
  if (!req.auth) {
    debugUser(req.auth);
    res.status(401).json({ error: 'Not authorized' });
    return;
  }
  debugUser('Updating user by id');
  const id = req.params.userId;
  const updatedUser = req.body;
  if (updatedUser.password) {
    updatedUser.password = await bcrypt.hash(updatedUser.password, 10);
  }
  updatedUser.lastUpdatedOn = new Date();
  updatedUser.lastUpdatedBy = req.auth;
  try {
    debugUser('Try block hit');
    const dbResult = await updateUser(id, updatedUser);
    if (dbResult.modifiedCount == 1) {
      debugUser('User updated');
      const newUser = await getUserById(id);
      let editLog = '';
      if (req.body.password) {
        editLog = `User updated password. `;
      }
      if (req.body.fullName) {
        editLog += `Full name = ${req.body.fullName}. `;
      }
      if (req.body.givenName) {
        editLog += `Given name = ${req.body.givenName}. `;
      }
      if (req.body.familyName) {
        editLog += `Family name = ${req.body.familyName}. `;
      }
      if (req.body.role) {
        editLog += `Role = ${req.body.role}. `;
      }
      const editResult = await recordEdit(newUser, 'Users', 'update', editLog, req.auth);
      if (newUser._id == req.auth._id) {
        const authToken = await issueAuthToken(newUser);
        issueAuthCookie(res, authToken);
        debugUser(`User ${newUser.fullName} logged in`);

      }
      res.status(200).json({ message: `User ${id} was updated` });
    } else {
      debugUser('User not updated');
      res.status(400).json({ message: `Unable to update user ${id}` });
    }
  } catch (err) {
    debugUser(`User ${id} not found`);
    res.status(500).json({ error: `User ${id} not found` });
  }
});
router.delete('/:userId', validId('userId'), async (req, res) => {
  if (!req.auth) {
    debugUser(req.auth);
    res.status(401).json({ error: 'Not authorized' });
    return;
  }
  debugUser('Deleting user by id');
  const id = req.params.userId;
  try {
    const newUser = await getUserById(id);
    const name = newUser.fullName;
    const dbResult = await deleteUser(id);
    if (dbResult.deletedCount == 1) {
      debugUser('User deleted');
      const editResult = await recordEdit(name, 'Users', 'delete', 'deleted user', req.auth);
      debugUser('editResult created');
      res.status(200).json({ message: `User ${id} was deleted` });
    } else {
      debugUser('User not deleted');
      res.status(400).json({ message: `Unable to delete user ${id}` });
    }
  } catch (err) {
    debugUser(`User ${id} not found`);
    res.status(500).json({ error: `User ${id} not found` });
  }
});

export { router as userRouter };
