import fs from 'fs';
import admin from 'firebase-admin';
import express from 'express';
import { db, connectToDB } from './db.js';

const credentials = JSON.parse(fs.readFileSync('./credentials.json'));
admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
    const { authtoken } = req.headers;

    if (authtoken) {
        try {
            req.user = await admin.auth().verifyIdToken(authtoken);
        } catch (e) {
            return res.sendStatus(400);
        }
    }

    req.user = req.user || {};

    next();
});

app.get('/api/documents/:docId', async (req, res) => {
    const { docId } = req.params;
    const { uid } = req.user;
    const document = await db.collection('documents').findOne({ docId });
    
    const documentOwnerId = document && document.docOwnerId;

    if (!document) {
        // Document does not exist
        // Do not send any HTML to load
        res.send();
    } else if (uid && uid === documentOwnerId) {
        // Document exists and the requesting user is authorized to view it
        // Send the document HTML content
        res.json(document);
    } else if (documentOwnerId) {
        // Document exists and has an owner, but the requesting user is not authorized to view it
        // Notify the user they cannot view the document
        res.sendStatus(403);
    } else {
        // Document exists but does not have an owner
        // Do not send any HTML to load
        res.send();
    }
});

app.get('/api/user/documents', async (req, res) => {
    const { uid } = req.user;
    
    if (uid) {
        const documents = await db.collection('documents').find({ docOwnerId: uid }).toArray();
        res.json(documents);
    } else {
        res.send();
    }
});

// Should I move this above the first route as well?
app.use((req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
});

app.put('/api/documents/:docId/save', async (req, res) => {
    const { docId } = req.params;
    const { uid } = req.user;
    const { html } = req.body;

    let document = await db.collection('documents').findOne({ docId });

    if (!document) {
        await db.collection('documents').insertOne({ docId: docId, docOwnerId: uid, html: html });
    } else if (uid && !document.docOwnerId) {
        // Document exists but has no owner
        await db.collection('documents').updateOne({ docId }, 
            { $set: { html: html, docOwnerId: uid } }
        );
    } else if (uid && uid === document.docOwnerId) {
        // Document exists and the requesting user is authorized to view it
        await db.collection('documents').updateOne({ docId }, 
            { $set: { html: html } }
        );
    }

    res.send(`The document with id ${docId} now has the html ${html}.`);
});

connectToDB(() => {
    console.log('Succesfully connected to database');
    app.listen(8000, () => {
        console.log('Server is listening on port 8000');
    });
})
