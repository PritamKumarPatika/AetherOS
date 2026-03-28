"""
MongoDB Database Connection.
Provides operations matching the previous JSON-based Collection class to ensure
backward compatibility across all models in AetherOS.
Falls back to JSON file storage if MongoDB is unavailable.
"""
import copy
import uuid
from datetime import datetime
import os
import json
from pathlib import Path
from pymongo import MongoClient

# Try MongoDB first, fall back to JSON storage
mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
db = None
USE_MONGO = True

try:
    # Try connecting to MongoDB with a short timeout
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client["aetheros"]
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"⚠️ MongoDB unavailable: {e}. Using JSON file storage.")
    USE_MONGO = False
    
    # Create data directory for JSON storage
    DATA_DIR = Path(__file__).parent / "data"
    DATA_DIR.mkdir(exist_ok=True)

class Collection:
    def __init__(self, name: str):
        self.name = name
        if USE_MONGO:
            self.collection = db[name]
            self.storage_type = "mongo"
        else:
            self.file_path = DATA_DIR / f"{name}.json"
            self.storage_type = "json"
            self._ensure_file()
    
    def _ensure_file(self):
        """Ensure JSON file exists"""
        if not self.file_path.exists():
            self.file_path.write_text(json.dumps([]))
    
    def _load_json(self) -> list:
        """Load data from JSON file"""
        try:
            return json.loads(self.file_path.read_text())
        except:
            return []
    
    def _save_json(self, data: list):
        """Save data to JSON file"""
        self.file_path.write_text(json.dumps(data, indent=2))
    
    def _matches_query(self, doc: dict, query: dict) -> bool:
        """Check if document matches query"""
        for key, value in query.items():
            if key not in doc:
                return False
            if isinstance(value, dict):
                # Simple query operators
                for op, op_value in value.items():
                    if op == "$eq" and doc[key] != op_value:
                        return False
                    elif op == "$ne" and doc[key] == op_value:
                        return False
            elif doc[key] != value:
                return False
        return True

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
        
        if self.storage_type == "mongo":
            self.collection.insert_one(doc)
        else:
            data = self._load_json()
            data.append(doc)
            self._save_json(data)
        
        return doc

    def find(self, query: dict | None = None) -> list[dict]:
        if query is None:
            query = {}
        
        if self.storage_type == "mongo":
            return list(self.collection.find(query))
        else:
            data = self._load_json()
            return [doc for doc in data if self._matches_query(doc, query)]

    def find_one(self, query: dict) -> dict | None:
        if self.storage_type == "mongo":
            return self.collection.find_one(query)
        else:
            for doc in self._load_json():
                if self._matches_query(doc, query):
                    return doc
            return None

    def update_one(self, query: dict, update: dict) -> dict:
        """Update a document - returns result object with matched_count"""
        update_body = copy.deepcopy(update)
        
        if self.storage_type == "mongo":
            # Check if any MongoDB update operators are used
            has_operators = any(k.startswith("$") for k in update_body)
            if has_operators:
                if "$set" not in update_body:
                    update_body["$set"] = {}
                update_body["$set"]["updated_at"] = datetime.utcnow().isoformat()
                res = self.collection.update_one(query, update_body)
            else:
                update_body["updated_at"] = datetime.utcnow().isoformat()
                res = self.collection.update_one(query, {"$set": update_body})
            return res
        else:
            # JSON file storage
            data = self._load_json()
            matched_count = 0
            for doc in data:
                if self._matches_query(doc, query):
                    matched_count += 1
                    # Handle $set operator
                    if "$set" in update_body:
                        for key, value in update_body["$set"].items():
                            doc[key] = value
                    else:
                        for key, value in update_body.items():
                            doc[key] = value
                    doc["updated_at"] = datetime.utcnow().isoformat()
            
            if matched_count > 0:
                self._save_json(data)
            
            # Return object with matched_count for compatibility
            class Result:
                def __init__(self, count):
                    self.matched_count = count
            return Result(matched_count)

    def delete_one(self, query: dict) -> dict:
        if self.storage_type == "mongo":
            res = self.collection.delete_one(query)
            return res
        else:
            data = self._load_json()
            original_len = len(data)
            data = [doc for doc in data if not self._matches_query(doc, query)]
            deleted_count = original_len - len(data)
            if deleted_count > 0:
                self._save_json(data)
            
            class Result:
                def __init__(self, count):
                    self.deleted_count = count
            return Result(deleted_count)

    def count(self, query: dict | None = None) -> int:
        if query is None:
            query = {}
        
        if self.storage_type == "mongo":
            return self.collection.count_documents(query)
        else:
            return len(self.find(query))

def get_collection(name: str) -> Collection:
    return Collection(name)
