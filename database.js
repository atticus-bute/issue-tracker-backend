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
}};

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
    valid = false;
    errorStr += `Missing field: fullName, `;
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
    newUser.creationDate = Date();
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
  const result = await db.collection('Users').deleteOne({_id: newId(id)});
  return result;
};
// export functions
export { connect, ping, newId, getUsers, getUserById, registerUser, loginUser, updateUser, deleteUser}

// test the database connection
ping();