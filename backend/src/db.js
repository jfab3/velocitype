import { MongoClient } from 'mongodb';

let db;

async function connectToDB(callback) {
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    db = client.db('velocitype-db');
    callback();
}

export { db, connectToDB };