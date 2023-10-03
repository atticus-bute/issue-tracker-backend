import express from 'express';
const router = express.Router();

import debug from 'debug';
import e from 'express';
const debugBug = debug('app:BugRouter');

import { nanoid } from 'nanoid';

router.use(express.urlencoded({ extended: false }));

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
  let idFound = false;
  let toUpdate;
  for (const bug of bugsArray) {
    if (bug.bugId == req.params.bugId) {
      toUpdate = bug;
      idFound = true;
      break;
    }
  }
  if (idFound) {
    if (req.body.title) {
      toUpdate.title = req.body.title;
    }
    if (req.body.description) {
      toUpdate.description = req.body.description;
    }
    if (req.body.stepsToReproduce) {
      toUpdate.stepsToReproduce = req.body.stepsToReproduce;
    }
    toUpdate.lastUpdated = Date();
    res.status(200).json({message: `Bug id #${req.params.bugId} updated!`});
  } else {
    res.status(404).json({ error: `Bug id #${req.params.bugId} not found.`});
  }
});

router.put('/:bugId/classify', (req, res) => {
  //FIXME: classify bug and send response as JSON
  let idFound = false;
  let toClassify;
  for (const bug of bugsArray) {
    if (bug.bugId == req.params.bugId) {
      toClassify = bug;
      idFound = true;
      break;
    }
  }
  if (idFound) {
    if (req.body.classification) {
      toClassify.classification = req.body.classification;
      toClassify.classifiedOn = Date();
      toClassify.lastUpdated = Date();
      res.status(200).json({message: `Bug id #${req.params.bugId} classified!`});
    } else {
      res.status(400).json({error: 'Missing classification field.'});
    }
  } else {
    res.status(404).json({ error: `Bug id #${req.params.bugId} not found.`});
  }
});

router.put('/:bugId/assign', (req, res) => {
  //FIXME: assign bug to a user and send response as JSON
  let idFound = false;
  let toAssign;
  for (const bug of bugsArray) {
    if (bug.bugId == req.params.bugId) {
      toAssign = bug;
      idFound = true;
      break;
    }
  }
  if (idFound) {
    if (req.body.assignedToUserId && req.body.assignedToUserName) {
      toAssign.assignedToUserId = req.body.assignedToUserId;
      toAssign.assignedToUserName = req.body.assignedToUserName;
      toAssign.assignedOn = Date();
      toAssign.lastUpdated = Date();
      res.status(200).json({message: `Bug id #${req.params.bugId} assigned!`});
    } else {
      res.status(400).json({error: 'Missing required field.'});
    }
  } else {
    res.status(404).json({ error: `Bug id #${req.params.bugId} not found.`});
  }
});

router.put('/:bugId/close', (req, res) => {
  //FIXME: close bug and send response as JSON
  let idFound = false;
  let toClose;
  for (const bug of bugsArray) {
    if (bug.bugId == req.params.bugId) {
      toClose = bug;
      idFound = true;
      break;
    }
  }
  if (idFound) {
    if (req.body.closed) {
      toClose.closed = req.body.closed;
      toClose.closedOn = Date();
      toClose.lastUpdated = Date();
      res.status(200).json({message: `Bug id #${req.params.bugId} closed!`});
    } else {
      res.status(400).json({error: 'Missing required field.'});
    }
  } else {
    res.status(404).json({ error: `Bug id #${req.params.bugId} not found.`});
  }
});

export {router as bugRouter};