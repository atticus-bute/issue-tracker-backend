import express from 'express';
const router = express.Router();

import debug from 'debug';
import e from 'express';
const debugBug = debug('app:BugRouter');

import {
  getBugs,
  getBugById,
  createBug,
  updateBug,
  classifyBug,
  assignBug,
  closeBug,
  addComment,
  listComments,
  getComment,
  listTestCases,
  getTestCase,
  newTestCase,
  updateTestCase,
  deleteTestCase,
  connect,
} from '../../database.js';
import { nanoid } from 'nanoid';
import joi from 'joi';
import { validId } from '../../middleware/validId.js';
import { validBody } from '../../middleware/validBody.js';

const newBugSchema = joi.object({
  title: joi.string().min(1).required(),
  description: joi.string().min(1).required(),
  stepsToReproduce: joi.string().min(1).required(),
  createdBy: joi.string().min(1).required(),
});
const updateBugSchema = joi.object({
  title: joi.string().min(1),
  description: joi.string().min(1),
  stepsToReproduce: joi.string().min(1)
});
const classifyBugSchema = joi.object({
  classification: joi
    .string()
    .min(1)
    .valid('Syntax Error', 'Logic Error', 'Runtime Error', 'Semantic Error')
    .required(),
});
const closeBugSchema = joi.object({
  closed: joi.boolean().required(),
});
const commentSchema = joi.object({
  author: joi.string().min(1).required(),
  comment: joi.string().min(1).required(),
});
const testCaseSchema = joi.object({
  passed: joi.boolean().required(),
});
router.use(express.urlencoded({ extended: false }));
//List all bugs
router.get('/list', async (req, res) => {
  debugBug(`hit list, with query string: ${JSON.stringify(req.query)}}`);
  let { keywords, classification, maxAge, minAge, closed, sortBy, pageSize, pageNumber } = req.query;
  let sort = {creationDate: 1};
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
  debugBug(`pastMaximumDaysOld: ${pastMaximumDaysOld}`);
  debugBug(`pastMinimumDaysOld: ${pastMinimumDaysOld}`);
  try {
    if (keywords) {
      match.$text = { $search: keywords };
    }

    if (classification) {
      match.classification = classification;
    }

    if (closed !== undefined) {
      match.closed = closed;
    }

    if (maxAge && minAge) {
      match.creationDate = { $lte: pastMinimumDaysOld, $gte: pastMaximumDaysOld };
    } else if (minAge) {
      match.creationDate = { $lte: pastMinimumDaysOld };
    } else if (maxAge) {
      match.creationDate = { $gte: pastMaximumDaysOld };
    }

    switch(sortBy) {
      case 'newest':
        sort = {creationDate: -1};
        break;
      case 'oldest':
        sort = {creationDate: 1};
        break;
      case 'title':
        sort = {title: 1, creationDate: -1};
        break;
      case 'classification':
        sort = {classification: 1, creationDate: -1};
        break;
      case 'assignedTo':
        sort = {assignedTo: 1, creationDate: -1};
        break;
      case 'createdBy':
        sort = {createdBy: 1, creationDate: -1};
        break;
      default:
        sort = {creationDate: -1};
        break;
    }

    pageNumber = parseInt(pageNumber) || 1;
    pageSize = parseInt(pageSize) || 10;
    const skip = (pageNumber - 1) * pageSize;
    const limit = pageSize;

    debugBug(`match: ${JSON.stringify(match)}`);

    const pipeline = [
      { $match: match },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ];
    const db = await connect();
    const cursor = await db.collection('Bugs').aggregate(pipeline);
    const bugs = await cursor.toArray();
    res.status(200).json(bugs);
  } catch (err) {
    debugBug('.get failed');
    res.status(500).json({ error: 'Bugs not found' });
  }
});
//List bug by id
router.get('/:bugId', validId('bugId'), async (req, res) => {
  const bugId = req.bugId;
  try {
    const bug = await getBugById(bugId);
    if (bug) {
      debugBug('Bug found');
      //debugBug(bug);
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
//List comments by bug id
router.get('/:bugId/comment/list', validId('bugId'), async (req, res) => {
  const bugId = req.bugId;
  try {
    const comments = await listComments(bugId);
    if (comments) {
      debugBug('Comments found');
      res.status(200).json(comments);
    } else {
      debugBug('Comments not found');
      res.status(404).json({ error: `Bug id #${bugId} comments not found` });
    }
  } catch (err) {
    debugBug('.get failed');
    res.status(500).json({ error: `Bug id #${bugId} not found` });
  }
});
//List test cases by bug id
router.get('/:bugId/test/list', validId('bugId'), async (req, res) => {
  const bugId = req.bugId;
  try {
    const testCases = await listTestCases(bugId);
    if (testCases) {
      debugBug('Test Cases found');
      res.status(200).json(testCases);
    } else {
      debugBug('Test Cases not found');
      res.status(404).json({ error: `Bug id #${bugId} test cases not found` });
    }
  } catch (err) {
    debugBug('.get failed');
    res.status(500).json({ error: `Bug id #${bugId} not found` });
  }
});
//List comment by bug id and comment id
router.get('/:bugId/comment/:commentId', validId('bugId'), validId('commentId'), async (req, res) => {
  const bugId = req.bugId;
  const commentId = req.params.commentId;
  try {
    const comment = await getComment(bugId, commentId);
    if (comment) {
      debugBug('Comment found');
      debugBug('Comment found');
      res.status(200).json(comment);
    } else {
      debugBug('Comment not found');
      res.status(404).json({ error: `Comment id #${commentId} not found` });
    }
  } catch (err) {
    debugBug('.get failed');
    res.status(500).json({ error: `Bug id #${bugId} not found` });
  }
});
//List test case by bug id and test case id
router.get('/:bugId/test/:testCaseId', validId('bugId'), validId('testCaseId'), async (req, res) => {
  const bugId = req.bugId;
  const testCaseId = req.params.testCaseId;
  try {
    const testCase = await getTestCase(bugId, testCaseId);
    if (testCase) {
      debugBug('Test Case found');
      res.status(200).json(testCase);
    } else {
      debugBug('Test Case not found');
      res.status(404).json({ error: `Test Case id #${testCaseId} not found` });
    }
  } catch (err) {
    debugBug('.get failed');
    res.status(500).json({ error: `Bug id #${bugId} not found` });
  }
});
//Create new bug
router.post('/new', validBody(newBugSchema), async (req, res) => {
  //FIXME: create new bug and send response as JSON
  debugBug('hit new');
  const newBug = req.body;
  try {
    const dbResult = await createBug(newBug);
    if (dbResult.acknowledged == true) {
      debugBug('Bug created');
      res.status(200).json({ message: `Bug id #${newBug._id} was added` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: dbResult });
    }
  } catch (err) {
    debugBug('.post failed');
    res.status(500).json({ error: err });
  }
});
//Update existing bug
router.put('/:bugId', validId('bugId'), validBody(updateBugSchema), async (req, res) => {
  //FIXME: update existing bug and send response as JSON
  const bugId = req.params.bugId;
  const updatedBug = req.body;
  try {
    const dbResult = await updateBug(bugId, updatedBug);
    if (dbResult.acknowledged == true) {
      debugBug('Bug updated');
      res.status(200).json({ message: `Bug id #${bugId} was updated` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: dbResult });
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({ error: 'Bug not found' });
  }
});
//Classify bug
router.put('/:bugId/classify', validId('bugId'), validBody(classifyBugSchema), async (req, res) => {
  //FIXME: classify bug and send response as JSON
  const bugId = req.params.bugId;
  const classification = req.body;
  try {
    const dbResult = await classifyBug(bugId, classification);
    if (dbResult.acknowledged == true) {
      debugBug('Bug classified');
      res.status(200).json({ message: `Bug id #${bugId} was classified as ${classification.classification}` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: 'Bug not found' });
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({ message: 'Bug not found' });
  }
});
//Assign bug
router.put('/:bugId/assign', validId('bugId'), validId('req.body.assignedToUserId'), async (req, res) => {
  //FIXME: assign bug to a user and send response as JSON
  const bugId = req.params.bugId;
  const assignedTo = req.body;
  debugBug(assignedTo);
  try {
    const dbResult = await assignBug(bugId, assignedTo.assignedToUserId);
    debugBug(dbResult);
    if (dbResult.acknowledged == true) {
      debugBug('Bug assigned');
      res.status(200).json({ message: `Bug id #${bugId} was assigned` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: 'Bug or user not found' });
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({ message: 'Bug or user not found' });
  }
});
//Close bug
router.put('/:bugId/close', validId('bugId'), validBody(closeBugSchema), async (req, res) => {
  //FIXME: close bug and send response as JSON
  const bugId = req.bugId;
  const closed = req.body.closed;
  try {
    const dbResult = await closeBug(bugId, closed);
    if (dbResult.acknowledged == true) {
      debugBug('Bug closed');
      res.status(200).json({ message: `Bug id #${bugId} was closed` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: 'Bug not found' });
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({ message: 'Bug not found' });
  }
});
//Add comment to bug
router.put('/:bugId/comment/new', validId('bugId'), validBody(commentSchema), async (req, res) => {
  const bugId = req.params.bugId;
  const comment = req.body;
  try {
    debugBug('Try block hit');
    const dbResult = await addComment(bugId, comment.comment, comment.author);
    debugBug(dbResult);
    if (dbResult.acknowledged == true) {
      debugBug('Comment added');
      res.status(200).json({ message: `Comment was added` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: 'Bug not found' });
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({ message: 'Bug not found' });
  }
});
//Add test-case to bug
router.put('/:bugId/test/new', validId('bugId'), validBody(testCaseSchema), async (req, res) => {
  const bugId = req.params.bugId;
  const testCase = req.body;
  try {
    debugBug('Try block hit');
    const dbResult = await newTestCase(bugId, testCase.passed);
    debugBug(dbResult);
    if (dbResult.acknowledged == true) {
      debugBug('Test Case added');
      res.status(200).json({ message: `Test Case was added` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: 'Bug not found' });
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({ message: 'Bug not found' });
  }
});
//Update test case
router.put('/:bugId/test/:testId', validId('bugId'), validId('testId'), validBody(testCaseSchema), async (req, res) => {
  const bugId = req.bugId;
  const testCaseId = req.testId;
  const testCase = req.body;
  debugBug(`The test case is ${testCase.passed}`);
  try {
    debugBug('Try block hit');
    const dbResult = await updateTestCase(bugId, testCaseId, testCase);
    debugBug(dbResult);
    if (dbResult.modifiedCount == 1) {
      debugBug('Test Case updated');
      res.status(200).json({ message: `Test Case was updated` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: 'Bug not found' });
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({ message: 'Bug not found' });
  }
});
//Delete test case
router.delete('/:bugId/test/:testId', validId('bugId'), validId('testId'), async (req, res) => {
  const bugId = req.bugId;
  const testId = req.testId;
  try {
    debugBug('Try block hit');
    const dbResult = await deleteTestCase(bugId, testId);
    debugBug(dbResult);
    if (dbResult.acknowledged == true) {
      debugBug('Test Case deleted');
      res.status(200).json({ message: `Test Case was deleted` });
    } else {
      debugBug(dbResult);
      res.status(400).json({ message: 'Bug not found' });
    }
  } catch (err) {
    debugBug('.put failed');
    res.status(500).json({ message: 'Bug not found' });
  }
});
export { router as bugRouter };
