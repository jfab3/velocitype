import { MongoClient } from 'mongodb';

let db;

async function connectToDB(callback) {
    const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    await client.connect();
    db = client.db('velocitype-db');
    callback();
}

export { db, connectToDB };