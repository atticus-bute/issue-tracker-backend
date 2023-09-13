import express from 'express';
const router = express.Router();

import debug from 'debug';
const debugUser = debug('app:UserRouter');

import { nanoid } from 'nanoid';

router.use(express.urlencoded({ extended: false }));

//FIXME: use this array to store user data in for now
//we will replace this with a database in a later assignment
const usersArray = [
  { email: 'jagbra@mail.com', password: 'crss', fullName: 'Atticus Bute', givenName:'Atticus', familyName: 'Bute', role:'Admin', userId: 1, creationTime: Date() },
  { email: 'eagud@mail.com', password: 'eagud', fullName: 'Evan Gudmestad', givenName:'Evan', familyName: 'Gudmestad', role:'Admin', userId: nanoid(), creationTime: Date() },
  { email: 'metroandroid@mail.com', password: 'morphball', fullName: 'Samus Aran', givenName:'Samus', familyName: 'Aran', role:'User', userId: nanoid(), creationTime: Date() },
  { email: 'vector@mail.com', password: 'yeshallbeasgods', fullName: 'Shion Uzuki', givenName:'Shion', familyName: 'Uzuki', role:'User', userId: nanoid(), creationTime: Date() },
  { email: 'halberd@mail.com', password: 'galaxia', fullName: 'Meta Knight', givenName:'Meta', familyName: 'Knight', role:'User', userId: nanoid(), creationTime: Date() }
];

router.get('/list', (req, res) => {
  debugUser('getting all users');
  res.status(200).json(usersArray);
});

router.get('/:userId', (req, res) => {
  debugUser('getting user by id');
  //reads the userId from the URL and stores it in a variable
  const userId = req.params.userId;
  //get the user from usersArray and send response as JSON
  const user = usersArray.find((user) => user.userId == userId);
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).json({ error: `Sorry, couldn't find user with id ${userId}` });
  }
});

router.post('/register', (req, res) => {
  //FIXME: register new user and send response as JSON
  const newUser = req.body;
  let validEmail = true;
  if (newUser.email && newUser.password && newUser.fullName && newUser.givenName && newUser.familyName && newUser.role) {
    for (const user of usersArray) {
      let i = 0;
      if (user.email == newUser.email) {
        validEmail = false;
        res.status(400).json({ error: 'Email already registered' });
        break;
      }
      i++;
    }
    if (validEmail) {
      newUser.userId = nanoid();
      newUser.creationTime = Date();
      usersArray.push(newUser);
      res.status(200).json({message: `New user ${newUser.fullName} registered!`});
    }
  } else {
    if (!newUser.email) {
      res.status(400).json({ error: 'Please enter an email' });
    }
    if (!newUser.password) {
      res.status(400).json({ error: 'Please enter a password' });
    }
    if (!newUser.fullName) {
      res.status(400).json({ error: 'Please enter your full name' });
    }
    if (!newUser.givenName) {
      res.status(400).json({ error: 'Please enter your given name' });
    }
    if (!newUser.familyName) {
      res.status(400).json({ error: 'Please enter your family name' });
    }
    if (!newUser.role) {
      res.status(400).json({ error: 'Please enter your role' });
    }
  }
});

router.post('/login', (req, res) => {
  //FIXME: check user's email and password and send response as JSON
  const loginAttempt = req.body;
  if(loginAttempt.email && loginAttempt.password) {
    let toLogin;
    let validLogin = false;
    for (const user of usersArray) {
      if (user.email == loginAttempt.email && user.password == loginAttempt.password) {
        toLogin = user;
        res.status(200).json({message: `Welcome back ${toLogin.fullName}!`});
        validLogin = true;
        break;
      }
    }
    if (!validLogin) {
      res.status(404).json({ error: 'Invalid email or password. Please try again.' });
    }
  } else {
    res.status(400).json({ error: 'Please enter an email and password.' });
  }
});

router.put('/:userId', (req, res) => {
  //FIXME: update existing user and send response as JSON
  let idFound = false;
  let toUpdate;
  for (const user of usersArray) {
    if (user.userId == req.params.userId) {
      toUpdate = user;
      idFound = true;
      break;
    }
  }
  if (idFound) {
    if (req.body.email) {
      toUpdate.email = req.body.email;
    }
    if (req.body.password) {
      toUpdate.password = req.body.password;
    }
    if (req.body.fullName) {
      toUpdate.fullName = req.body.fullName;
    }
    if (req.body.givenName) {
      toUpdate.givenName = req.body.givenName;
    }
    if (req.body.familyName) {
      toUpdate.familyName = req.body.familyName;
    }
    if (req.body.role) {
      toUpdate.role = req.body.role;
    }
    toUpdate.lastUpdated = Date();
    res.status(200).json({message: `User ${toUpdate.fullName} updated!`});
  } else {
    res.status(404).json({ error: `User #${req.params.userId} not found.`});
  }
});

router.delete('/:userId', (req, res) => {
  //FIXME: delete user and send response as JSON
  let idFound = false;
  let toDelete;
  for (const user of usersArray) {
    if (user.userId == req.params.userId) {
      toDelete = user;
      idFound = true;
      break;
    }
  }
  if (!idFound) {
  res.json({ error: `User #${req.params.userId} not found.` });
  } else {
    usersArray.splice(usersArray.indexOf(toDelete), 1);
    res.status(200).json({message: `User ${toDelete.fullName} deleted!`});
  }
});

export { router as userRouter };
