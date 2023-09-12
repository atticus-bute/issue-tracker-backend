import express from 'express';
const router = express.Router();

import debug from 'debug';
import e from 'express';
const debugBug = debug('app:BugRouter');

import { nanoid } from 'nanoid';

router.use(express.urlencoded({ extended: false }));

const bugsArray = [
  {title:'example', description:'lorem ipsum...', stepsToReproduce:'lorem ipsum...', bugId:1, creationTime:Date()}
];

router.get('/list', (req, res) => {
  debugBug('bug list route hit');
  res.json(bugsArray);
});

router.get('/:bugId', (req, res) => {
  const bugId = req.params.bugId;
  const bug = bugsArray.find((bug) => bug.bugId == bugId);
  //FIXME: get bug from bugsArray and send response as JSON
  if (bug) {
    res.status(200).json(bug);
  } else {
    res.status(404).json({ error: `Bug id #${bugId} not found` });
  }
});

router.post('/new', (req, res) => {
  //FIXME: create new bug and send response as JSON
  debugBug('hit new');
  const newBug = req.body;
  if (newBug.title && newBug.description && newBug.stepsToReproduce) {
    newBug.bugId = nanoid();
    newBug.creationTime = Date();
    bugsArray.push(newBug);
    res.status(200).json({message: `New bug ${newBug.title} reported!`});
  } else {
    res.status(400).json({error: 'Missing fields required.'});
  }
});

router.put('/:bugId', (req, res) => {
  //FIXME: update existing bug and send response as JSON
});

router.put('/:bugId/classify', (req, res) => {
  //FIXME: classify bug and send response as JSON
});

router.put('/:bugId/assign', (req, res) => {
  //FIXME: assign bug to a user and send response as JSON
});

router.put('/:bugId/close', (req, res) => {
  //FIXME: close bug and send response as JSON
});

export {router as bugRouter};