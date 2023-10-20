import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();


import { MongoClient, ObjectId } from "mongodb";
import debug from 'debug';
const debugDb = debug('app:Database');

/** Generate/Parse an ObjectId */
const newId = (str) => new ObjectId(str);

/** Global variable storing the open connection, do not use it directly. */
let _db = null;

/** Connect to the database */
async function connect() {
  if (!_db) {
    const dbUrl = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const client = await MongoClient.connect(dbUrl);
    _db = client.db(dbName);
    debugDb('Connected.');
  }
  return _db;
}

/** Connect to the database and verify the connection */
async function ping() {
  const db = await connect();
  await db.command({ ping: 1 });
  debugDb('Ping.');
}

// FIXME: add more functions here
//User Functions
async function getUsers() {
  debugDb('Getting all users');
  const db = await connect();
  const users = await db.collection('Users').find({}).toArray();
  return users;
}
async function getUserById(id) {
  debugDb('Getting user by id');
  const db = await connect();
  const user = await db.collection('Users').findOne({_id: newId(id)});
  if (user.password) {

  return user;
}
};
async function registerUser(newUser) {
  debugDb('Registering user');
  const db = await connect();
  let valid = true;
  let errorStr = '';
  if(!newUser.email){
    valid = false;
    errorStr += `Missing field: email, `;
  } else if (await db.collection('Users').findOne({email: newUser.email})) {
    valid = false;
    errorStr += `Email already registered.`;
  }
  if(!newUser.password){
    valid = false;
    errorStr += `Missing field: password, `;
  }
  if(!newUser.fullName){
    newUser.fullName = `${newUser.givenName} ${newUser.familyName}`;
  }
  if(!newUser.givenName){
    valid = false;
    errorStr += `Missing field: firstName, `;
  }
  if(!newUser.familyName){
    valid = false;
    errorStr += `Missing field: lastName, `;
  }
  if(!newUser.role){
    valid = false;
    errorStr += `Missing field: role, `;
  };
  if (valid) {
    newUser._id = new ObjectId();
    newUser.creationDate = new Date();
    const user = await db.collection('Users').insertOne(newUser);
    return user;
  } else {
    return errorStr;
  }
};
async function loginUser(loginAttempt) {
  debugDb('Logging in user');
  const db = await connect();
  const user = await db.collection('Users').findOne({email: loginAttempt.email});
  if(user) {
    debugDb('User found');
    if(await bcrypt.compare(loginAttempt.password, user.password)) {
      debugDb('Password correct');
      return user;
    } else {
      debugDb('Password incorrect');
      return false;
    }
  } else {
    debugDb('User not found');
    return false;
  }
};
async function updateUser(id, updatedUser) {
  debugDb('Updating user');
  const db = await connect();
  const user = await db.collection('Users').findOne({_id: newId(id)});
  if (updatedUser.password) {
    user.password = updatedUser.password;
  }
  if (updatedUser.fullName) {
    user.fullName = updatedUser.fullName;
  }
  if (updatedUser.givenName) {
    user.givenName = updatedUser.givenName;
  }
  if (updatedUser.familyName) {
    user.familyName = updatedUser.familyName;
  }
  if (updatedUser.role) {
    user.role = updatedUser.role;
  }
  const result = await db.collection('Users').updateOne({ _id:new ObjectId(id) }, {$set:{...updatedUser}});
  debugDb(user);
  return result;
};
async function deleteUser(id) {
  debugDb('Deleting user');
  const db = await connect();
  const user = await db.collection('Users').findOne({_id: newId(id)});
  if (!user) {
    return false;
  }
  const result = await db.collection('Users').deleteOne({_id: newId(id)});
  return result;
};
//Bug Functions
async function getBugs() {
  debugDb('Getting all bugs');
  const db = await connect();
  const bugs = await db.collection('Bugs').find({}).toArray();
  return bugs;
}
async function getBugById(id) {
  debugDb('Getting bug by id');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(id)});
  return bug;
}
async function createBug(newBug) {
  debugDb('Creating bug');
  const db = await connect();
  let valid = true;
  let errorStr = '';
  if(!newBug.title){
    valid = false;
    errorStr += `Missing field: title, `;
  }
  if(!newBug.description){
    valid = false;
    errorStr += `Missing field: description, `;
  }
  if(!newBug.stepsToReproduce){
    valid = false;
    errorStr += `Missing field: stepsToReproduce, `;
  }
  if(valid)  {
    newBug._id = new ObjectId();
    newBug.creationDate = new Date();
    newBug.comments = [];
    newBug.testCases = [];
    debugDb(`New bug: ${JSON.stringify(newBug)}`)
    const bug = await db.collection('Bugs').insertOne(newBug);
    return bug;
  } else {
    return errorStr;
  }
}
async function updateBug(id, updatedBug) {
  debugDb('Updating bug');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(id)});
  if (!bug) {
    return false;
  }
  if (updatedBug.title) {
    bug.title = updatedBug.title;
  }
  if (updatedBug.description) {
    bug.description = updatedBug.description;
  }
  if (updatedBug.stepsToReproduce) {
    bug.stepsToReproduce = updatedBug.stepsToReproduce;
  }
  bug.lastUpdated = new Date();
  const result = await db.collection('Bugs').updateOne({ _id:new ObjectId(id) }, {$set:{...bug}});
  return result;
}
async function classifyBug(id, classification) {
  debugDb('Classifying bug');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(id)});
  if (!bug) {
    return false;
  }
  if (classification.classification) {
    bug.classification = classification.classification;
    bug.classifiedOn = new Date();
    bug.lastUpdated = new Date();
  } else {
    return false;
  }
  const result = await db.collection('Bugs').updateOne({ _id:new ObjectId(id) }, {$set:{...bug}});
  return result;
}
async function assignBug(id, assignedToUserId) {
  debugDb('Assigning bug');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(id)});
  const assignedUser = await db.collection('Users').findOne({_id: newId(assignedToUserId)});
  debugDb(bug);
  if (!bug || !assignedUser) {
    return false;
  }
  if (assignedToUserId) {
    bug.assignedToUserId = assignedUser._id;
    bug.assignedToUserName = assignedUser.fullName;
    bug.assignedOn = new Date();
    bug.lastUpdated = new Date();
    const result = await db.collection('Bugs').updateOne({ _id:new ObjectId(id) }, {$set:{...bug}});
    debugDb(result);
    return result;
  } else {
    return false;
  }
}
async function addComment(id, comment, author) {
  debugDb('Adding comment');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(id)});
  if (!bug) {
    return false;
  }
  if (comment && author) {
    debugDb(`${comment}, ${author}`)
    let newComment = {};
    newComment._id = new ObjectId();
    newComment.comment = comment;
    newComment.author = author;
    newComment.date = new Date();
    bug.comments.push(newComment);
  } else {
    return false;
  }
  debugDb('Result next');
  const result = await db.collection('Bugs').updateOne({ _id:new ObjectId(id) }, {$set:{...bug}});
  return result;
}
async function listComments(id) {
  debugDb('Getting comments');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(id)});
  debugDb`The comments are: ${bug.comments}`
  return bug.comments;
}
async function getComment(bugId, commentId) {
  debugDb('Getting comment');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(bugId)});
  if (!bug) {
    return false;
  }
  const comment = bug.comments.find(comment => comment._id == commentId);
  if (!comment) {
    return false;
  }
  return comment;
}
async function listTestCases(bugId) {
  debugDb('Getting test cases');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(bugId)});
  debugDb(bug);
  if (!bug) {
    return false;
  }
  const testCases = bug.testCases;
  debugDb(testCases);
  return testCases;
}
async function getTestCase(bugId, testCaseId) {
  debugDb('Getting test case');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(bugId)});
  if (!bug) {
    return false;
  }
  const testCase = bug.testCases.find(testCase => testCase._id == testCaseId);
  debugDb(testCase);
  if (!testCase) {
    return false;
  }
  return testCase;
}
async function newTestCase(bugId, testCase) {
  debugDb('Creating test case');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(bugId)});
  if (!bug) {
    return false;
  }
  if (testCase || testCase == false) {
    const newTestCase = {};
    newTestCase.passed = testCase;
    newTestCase._id = new ObjectId();
    newTestCase.date = new Date();
    debugDb(newTestCase);
    bug.testCases.push(newTestCase);
    debugDb('test case pushed');
  } else {
    return false;
  }
  const result = await db.collection('Bugs').updateOne({ _id:new ObjectId(bugId) }, {$set:{...bug}});
  return result;
}
async function updateTestCase(bugId, testCaseId, updatedTestCase) {
  debugDb(`Updated test case ${testCaseId} for bug ${bugId} with ${updatedTestCase}`);
  const db = await connect();
  updatedTestCase._id = new ObjectId();
  updatedTestCase.date = new Date();
  const dbResult = await db.collection('Bugs').updateOne(
    {_id:{$eq:bugId}, 'testCases._id': {$eq:testCaseId}},
    {$set: {'testCases.$': updatedTestCase }}
  );
  debugDb(dbResult);
  return dbResult;
}
async function deleteTestCase(bugId, testCaseId) {
  debugDb('Deleting test case');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(bugId)});
  bug.testCases = bug.testCases.filter(testCase => testCase._id != testCaseId);
  const result = await db.collection('Bugs').updateOne({ _id:new ObjectId(bugId) }, {$set:{...bug}});
  return result;
}
async function closeBug(id, status) {
  debugDb('Closing bug');
  const db = await connect();
  const bug = await db.collection('Bugs').findOne({_id: newId(id)});
  debugDb(bug);
  if (!bug) {
    return false;
  }
  if (status || status == false) {
    bug.closed = status;
    bug.closedOn = new Date();
    bug.lastUpdated = new Date();
  } else {
    return false;
  }
  const result = await db.collection('Bugs').updateOne({ _id:new ObjectId(id) }, {$set:{...bug}});
  return result;
}
// export functions
export { connect, ping, newId, getUsers, getUserById, registerUser, loginUser, updateUser, deleteUser, getBugs, getBugById, createBug, updateBug, classifyBug, assignBug, closeBug, addComment, listComments, getComment, listTestCases, getTestCase, newTestCase, updateTestCase, deleteTestCase };

// test the database connection
ping();