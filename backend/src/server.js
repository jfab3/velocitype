import express from 'express';
import { db, connectToDB } from './db.js';

const app = express();
app.use(express.json());

app.get('/api/documents/:docId', async (req, res) => {
    const { docId } = req.params;    
    const document = await db.collection('documents').findOne({ docId });
    
    res.json(document);
});

app.put('/api/documents/:docId/save', async (req, res) => {
    const { docId } = req.params;
    const { html } = req.body;

    let document = await db.collection('documents').findOneAndUpdate({ docId }, 
        { $set: { html: html } },
        { returnDocument: "after" }
    );
    
    if (!document) {
        await db.collection('documents').insertOne({ docId: docId, html: html });
        document = await db.collection('documents').findOne({ docId });
    }

    res.send(`The document with id ${docId} now has the html ${document.html}.`);
});

connectToDB(() => {
    console.log('Succesfully connected to database');
    app.listen(8000, () => {
        console.log('Server is listening on port 8000');
    });
})
