"""
MongoDB Database Connection.
Provides operations matching the previous JSON-based Collection class to ensure
backward compatibility across all models in AetherOS.
"""
import copy
import uuid
from datetime import datetime
import os
from pymongo import MongoClient

# Connect to the MongoDB instance via environment variable or default to local
mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(mongo_uri)
db = client["aetheros"]

class Collection:
    def __init__(self, name: str):
        self.collection = db[name]

    def insert_one(self, doc: dict) -> dict:
        doc = copy.deepcopy(doc)
        
        # Preserve backwards compatibility with string UUIDs
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
            
        now = datetime.utcnow().isoformat()
        if "created_at" not in doc:
            doc["created_at"] = now
        if "updated_at" not in doc:
            doc["updated_at"] = now
            
        self.collection.insert_one(doc)
        return doc

    def find(self, query: dict | None = None) -> list[dict]:
        if query is None:
            query = {}
        # Return a list of dictionaries as previous JSON DB did
        return list(self.collection.find(query))

    def find_one(self, query: dict) -> dict | None:
        return self.collection.find_one(query)

    def update_one(self, query: dict, update: dict) -> bool:
        update_body = copy.deepcopy(update)
        # Check if any MongoDB update operators are used ($set, $push, $pull, etc.)
        has_operators = any(k.startswith("$") for k in update_body)
        if has_operators:
            # Ensure updated_at is set alongside any operators
            if "$set" not in update_body:
                update_body["$set"] = {}
            update_body["$set"]["updated_at"] = datetime.utcnow().isoformat()
            res = self.collection.update_one(query, update_body)
        else:
            # If no operators, previous JSON DB acts like a dict.update()
            update_body["updated_at"] = datetime.utcnow().isoformat()
            res = self.collection.update_one(query, {"$set": update_body})
            
        return res.matched_count > 0

    def delete_one(self, query: dict) -> bool:
        res = self.collection.delete_one(query)
        return res.deleted_count > 0

    def count(self, query: dict | None = None) -> int:
        if query is None:
            query = {}
        return self.collection.count_documents(query)

def get_collection(name: str) -> Collection:
    return Collection(name)
