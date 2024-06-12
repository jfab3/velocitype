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
    if (uid && uid === documentOwnerId) {
        res.json(document);
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
        // document exists but has no owner
        await db.collection('documents').updateOne({ docId }, 
            { $set: { html: html, docOwnerId: uid } }
        );
    } else if (uid && uid === document.docOwnerId) {
        // document exists and the owner is the same as the requesting user
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
