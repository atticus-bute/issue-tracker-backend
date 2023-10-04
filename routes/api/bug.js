import express from 'express';
const router = express.Router();

import debug from 'debug';
import e from 'express';
const debugBug = debug('app:BugRouter');

import { getBugs, getBugById, createBug, updateBug, classifyBug, assignBug, closeBug } from '../../database.js';
import { nanoid } from 'nanoid';

router.use(express.urlencoded({ extended: false }));

router.get('/list', async (req, res) => {
  try {
    const bugs = await getBugs();
    res.status(200).json(bugs);
  } catch (err) {
    debugBug('.get failed');
    res.status(500).json({ error: 'Bugs not found' });
  }
});

router.get('/:bugId', async (req, res) => {
  const bugId = req.params.bugId;
  try{
    const bug = await getBugById(bugId);
    if (bug) {
      debugBug('Bug found');
      res.status(200).json(bug);
    } else {
      debugBug('Bug not found');
      res.status(404).json({ error: `Bug id #${bugId} not found` });
    }
  } catch (err) {
    debugBug('.get failed');
    res.status(500).json({ error: `Bug id #${bugId} not found` });
  }
});

router.post('/new', async (req, res) => {
  //FIXME: create new bug and send response as JSON
  debugBug('hit new');
  const newBug = req.body;
  try {
    const dbResult = await createBug(newBug);
    if(dbResult.acknowledged == true){
      debugBug('Bug created');
      res.status(200).json({message:`Bug id #${newBug._id} was added`});
    } else {
      debugBug(dbResult);
      res.status(400).json({message:dbResult});
    }
  } catch (err) {
    debugBug('.post failed');
    res.status(500).json({error: err});
  }
});

router.put('/:bugId', async (req, res) => {
  //FIXME: update existing bug and send response as JSON
  const bugId = req.params.bugId;
  const updatedBug = req.body;
  try {
    const dbResult = await updateBug(bugId, updatedBug);
    if(dbResult.acknowledged == true){
      debugBug('Bug updated');
      res.status(200).json({message:`Bug id #${bugId} was updated`});
    } else {
      debugBug(dbResult);
      res.status(400).json({message:dbResult});
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({error: 'Bug not found'});
  }
});

router.put('/:bugId/classify', async (req, res) => {
  //FIXME: classify bug and send response as JSON
  const bugId = req.params.bugId;
  const classification = req.body; 
  try {
    const dbResult = await classifyBug(bugId, classification);
    if(dbResult.acknowledged == true){
      debugBug('Bug classified');
      res.status(200).json({message:`Bug id #${bugId} was classified as ${classification.classification}`});
    } else {
      debugBug(dbResult);
      res.status(400).json({message:'Bug not found'});
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({message:'Bug not found'});
  }
});

router.put('/:bugId/assign', async (req, res) => {
  //FIXME: assign bug to a user and send response as JSON
  const bugId = req.params.bugId;
  const assignedTo = req.body;
  debugBug(assignedTo);
  try{
    const dbResult = await assignBug(bugId, assignedTo.assignedToUserId);
    debugBug(dbResult);
    if(dbResult.acknowledged == true){
      debugBug('Bug assigned');
      res.status(200).json({message:`Bug id #${bugId} was assigned`});
    } else {
      debugBug(dbResult);
      res.status(400).json({message:'Bug or user not found'});
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({message:'Bug or user not found'});
  }
});

router.put('/:bugId/close', async (req, res) => {
  //FIXME: close bug and send response as JSON
  const bugId = req.params.bugId;
  const closed = req.body.closed;
  try {
    const dbResult = await closeBug(bugId, closed);
    if(dbResult.acknowledged == true){
      debugBug('Bug closed');
      res.status(200).json({message:`Bug id #${bugId} was closed`});
    } else {
      debugBug(dbResult);
      res.status(400).json({message:'Bug not found'});
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({message:'Bug not found'});
  }
});

export {router as bugRouter};