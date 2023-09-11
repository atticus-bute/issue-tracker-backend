import express from 'express';
const router = express.Router();

import debug from 'debug';
const debugUser = debug('app:UserRouter');

router.use(express.urlencoded({ extended: false }));

//FIXME: use this array to store user data in for now
//we will replace this with a database in a later assignment
const usersArray = [
  { name: 'Atticus', userId: 1 },
  { name: 'Evan', userId: 2 },
  { name: 'Shion', userId: 3 },
  { name: 'Samus', userId: 4 },
];

router.get('/list', (req, res) => {
  debugUser('getting all users');
  res.status(200).json(usersArray);
});

router.get('/:userId', (req, res) => {
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
  if (newUser.email && newUser.password && newUser.fullName && givenName && familyName && role) {
    for (const user in usersArray) {
      if (user.email == newUser.email) {
        validEmail = false;
        res.status(400).json({ error: 'Email already registered' });
        break;
      }
    }
    if (validEmail) {
    usersArray.push(newUser);
    res.status(200).json(newUser);
    }
  } else {
    if (!email) {
      res.status(400).json({ error: 'Please enter an email' });
    }
    if (!password) {
      res.status(400).json({ error: 'Please enter a password' });
    }
    if (!fullName) {
      res.status(400).json({ error: 'Please enter your full name' });
    }
    if (!givenName) {
      res.status(400).json({ error: 'Please enter your given name' });
    }
    if (!familyName) {
      res.status(400).json({ error: 'Please enter your family name' });
    }
    if (!role) {
      res.status(400).json({ error: 'Please enter your role' });
    }
  }
});

router.post('/login', (req, res) => {
  //FIXME: check user's email and password and send response as JSON
});

router.put('/:userId', (req, res) => {
  //FIXME: update existing user and send response as JSON
});

router.delete('/:userId', (req, res) => {
  //FIXME: delete user and send response as JSON
});

export { router as userRouter };
