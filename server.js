/* eslint-disable no-undef */
import * as dotenv from 'dotenv';
dotenv.config();
import debug from 'debug';
const debugMain = debug('app:Server');
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { userRouter } from './routes/api/user.js';
import { bugRouter } from './routes/api/bug.js';
import { ping, connect, newId } from './database.js';
import cookieParser from 'cookie-parser';
import { authMiddleware } from '@merlin4/express-auth';
import cors from 'cors';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//create our web server
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors({origin: ['http://localhost:5173', 'https://bute-issuetracker-frontend.uc.r.appspot.com'], credentials: true}));
app.use(cookieParser());
app.use(
  authMiddleware(process.env.JWT_SECRET, 'authToken', {
    httpOnly: true,
    maxAge: 1000 * 60 * 60
  })
);
app.use(express.json());
app.use('/api/users', userRouter);
app.use('/api/bugs', bugRouter);
app.use(express.static('public'));


//register routes
app.get('/', (req, res) => {
  debugMain('Home Route hit');
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

//Register Error Handlers
app.use((req, res) => {
  debugMain(`Sorry, couldn't find ${req.originalUrl}`);
  res.status(404).json({ error: `Sorry, couldn't find ${req.originalUrl}` });
});

//Add listener for requests
const port = process.env.PORT || 5001;

app.listen(port, () => {
  debugMain(`Listening on port http://localhost:${port}`);
});
debugMain('test');
ping();
