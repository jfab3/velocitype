import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import express from 'express';
import sanitizeHtml from 'sanitize-html';
import 'dotenv/config';
import { db, connectToDB } from './db.js';
import { ObjectId } from 'mongodb';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(fs.readFileSync(process.env.FIREBASE_CREDENTIALS_FILE));
admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const allowedHtml = { 
    allowedTags: ['div', 'span', 'br'],
    allowedAttributes: { 'span': ["style", "class"] },
    allowedStyles: { 'p': { 'font-size': [/^\d+rem$/] } }
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
})


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
        const cleanHtml = sanitizeHtml(document.html, allowedHtml);
        document.html = cleanHtml;
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

app.get('/api/documents', async (req, res) => {
    const limit = parseInt(req.query.limit) || 0; 
    const cursorId = req.query.cursorId;
    const { uid } = req.user;

    let cursor;
    if (uid && cursorId) {
        cursor = await db.collection('documents').find({ docOwnerId: uid, _id: { $lt: new ObjectId(cursorId) } }).sort({ _id: -1 }).limit(limit);
    } else if (uid) {
        cursor = await db.collection('documents').find({ docOwnerId: uid }).sort({ _id: -1 }).limit(limit);
    }

    if (cursor) {
        const cursorHasNext = await cursor.hasNext();
        const documents = await cursor.toArray();
        for (const document of documents) {
            const cleanHtml = sanitizeHtml(document.html, allowedHtml);
            document.html = cleanHtml;
        }
        res.json({ documents, cursorId: documents[documents.length - 1]?._id, cursorHasNext });
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

app.put('/api/documents/:docId', async (req, res) => {
    const { docId } = req.params;
    const { uid } = req.user;
    let { html } = req.body;
    html = sanitizeHtml(html, allowedHtml);
    
    let document = await db.collection('documents').findOne({ docId });

    if (!document && !html) {
        // Do not create a new document if it is empty
        return res.status(200).send('Request to save an empty document was ignored.');
    } else if (!document && html) {
        // Create a new document if it is non-empty
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

app.delete('/api/documents/:docId', async (req, res) => {
    const { docId } = req.params;
    const { uid } = req.user;

    await db.collection('documents').deleteOne({ docId: docId, docOwnerId: uid });
    res.send();
});

const PORT = process.env.PORT || 8000;

connectToDB(() => {
    console.log('Succesfully connected to database');
    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
})
