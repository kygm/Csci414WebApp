from flask import Flask, jsonify, render_template, request
from pymongo import MongoClient
from bson import ObjectId
import sqlite3
import time
from functools import wraps

app = Flask(__name__)

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["library"]
books_collection = db["books"]
authors_collection = db["authors"]
reviews_collection = db["reviews"]

# SQLite logging setup
LOG_DB = 'db/books.db'

# Ensure logs table exists
with sqlite3.connect(LOG_DB) as conn:
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            function_name TEXT NOT NULL,
            status TEXT NOT NULL,
            execution_time REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            error_message TEXT
        )
    """)
    conn.commit()

# Helper: convert MongoDB ObjectIds to strings
def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc

# Function to log manually (for catch blocks)
def log_error(func_name, error_message):
    with sqlite3.connect(LOG_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO logs (function_name, status, execution_time, error_message)
            VALUES (?, ?, ?, ?)
        """, (func_name, "error", None, str(error_message)))
        conn.commit()

# Logging decorator
def log_function(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        t1 = time.time()
        try:
            result = func(*args, **kwargs)
            t2 = time.time()
            delta_t = round(t2 - t1, 4)

            # Log success
            with sqlite3.connect(LOG_DB) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO logs (function_name, status, execution_time)
                    VALUES (?, ?, ?)
                """, (func.__name__, "success", delta_t))
                conn.commit()

            return result
        except Exception as e:
            # Log error (no execution_time)
            with sqlite3.connect(LOG_DB) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO logs (function_name, status, execution_time, error_message)
                    VALUES (?, ?, ?, ?)
                """, (func.__name__, "error", None, str(e)))
                conn.commit()
            raise
    return wrapper

# =============================
# BOOK ROUTES
# =============================
@app.route('/api/books', methods=['GET'])
@log_function
def get_all_books():
    search_query = request.args.get('search', '').strip().lower()
    try:
        if search_query:
            books = list(books_collection.find({
                "$or": [
                    {"title": {"$regex": search_query, "$options": "i"}},
                    {"author_name": {"$regex": search_query, "$options": "i"}}
                ]
            }))
        else:
            books = list(books_collection.find())

        book_list = []
        for book in books:
            book_id_str = str(book["_id"])
            ratings = list(reviews_collection.find({"book_id": book_id_str}, {"rating": 1}))

            valid_ratings = []
            for r in ratings:
                try:
                    valid_ratings.append(float(r["rating"]))
                except (ValueError, TypeError, KeyError) as inner_e:
                    log_error("get_all_books", f"Bad rating data: {inner_e}")

            avg_rating = round(sum(valid_ratings) / len(valid_ratings), 1) if valid_ratings else None
            serialized = serialize_doc(book)
            serialized["average_rating"] = avg_rating
            book_list.append(serialized)

        return jsonify({'books': book_list})

    except Exception as e:
        # Log the error inside the catch block
        log_error("get_all_books", e)
        return jsonify({'error': str(e)})

@app.route('/api/add_book', methods=['POST'])
@log_function
def add_book():
    try:
        data = request.get_json()
        result = books_collection.insert_one({
            "title": data.get('title'),
            "publication_year": data.get('publication_year'),
            "author_name": data.get('author_name'),
            "image_url": data.get('image_url')
        })
        return jsonify({'message': 'Book added successfully', 'book_id': str(result.inserted_id)})
    except Exception as e:
        log_error("add_book", e)
        return jsonify({'error': str(e)})

@app.route('/api/delete_book/<book_id>', methods=['DELETE'])
@log_function
def delete_book(book_id):
    try:
        result = books_collection.delete_one({"_id": ObjectId(book_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Book not found'}), 404
        return jsonify({'message': 'Book deleted successfully'})
    except Exception as e:
        log_error("delete_book", e)
        return jsonify({'error': str(e)})

# =============================
# REVIEW ROUTES
# =============================
@app.route('/api/reviews', methods=['GET'])
@log_function
def get_all_reviews():
    try:
        book_id = request.args.get("book_id")
        query = {"book_id": book_id} if book_id else {}
        reviews = list(reviews_collection.find(query))
        return jsonify({'reviews': [serialize_doc(r) for r in reviews]})
    except Exception as e:
        log_error("get_all_reviews", e)
        return jsonify({'error': str(e)})

@app.route('/api/add_review', methods=['POST'])
@log_function
def add_review():
    try:
        data = request.get_json()
        review = {
            "book_id": data.get("book_id"),
            "reviewer_name": data.get("reviewer_name"),
            "rating": data.get("rating"),
            "comment": data.get("comment")
        }
        reviews_collection.insert_one(review)
        return jsonify({'message': 'Review added successfully'})
    except Exception as e:
        log_error("add_review", e)
        return jsonify({'error': str(e)})

# =============================
# LOG ROUTES
# =============================
@app.route('/api/logs', methods=['GET'])
def get_logs():
    try:
        with sqlite3.connect(LOG_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM logs ORDER BY timestamp DESC")
            logs = cursor.fetchall()
            log_list = [
                {
                    "log_id": l[0],
                    "function_name": l[1],
                    "status": l[2],
                    "execution_time": l[3],
                    "timestamp": l[4],
                    "error_message": l[5]
                } for l in logs
            ]
        return jsonify({'logs': log_list})
    except Exception as e:
        log_error("get_logs", e)
        return jsonify({'error': str(e)})

@app.route('/api/logs', methods=['DELETE'])
def delete_logs():
    try:
        with sqlite3.connect(LOG_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM logs")
            conn.commit()
        return jsonify({'message': 'All logs deleted successfully'})
    except Exception as e:
        log_error("delete_logs", e)
        return jsonify({'error': str(e)})

# =============================
# HTML ROUTES
# =============================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/library')
def library():
    return render_template('library.html')

@app.route('/reviews')
def reviews_page():
    return render_template('reviews.html')

@app.route('/about')
def about():
    return render_template('about.html')


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
