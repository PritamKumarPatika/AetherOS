from bson import ObjectId
import json
from datetime import datetime

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if isinstance(doc, dict):
        return {k: serialize_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif isinstance(doc, datetime):
        return doc.isoformat()
    return doc

def serialize_docs(docs):
    """Convert MongoDB cursor/list to JSON-serializable list"""
    if hasattr(docs, '__iter__') and not isinstance(docs, (str, dict)):
        return [serialize_doc(doc) for doc in docs]
    return serialize_doc(docs)
