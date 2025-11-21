// =============================
// ✅ Global State
// =============================
const books = [];

// =============================
// ✅ Add a Book (Add Page)
// =============================
function addBook()
{
    const bookTitle = document.getElementById('bookTitle')?.value;
    const publicationYear = document.getElementById('publicationYear')?.value;
    const authorName = document.getElementById('authorName')?.value;
    const imageUrl = document.getElementById('imageUrl')?.value;

    if (!bookTitle || !publicationYear || !authorName)
    {
        alert("❌ Please fill in all required fields!");
        return;
    }

    const bookData = {
        title: bookTitle,
        publication_year: publicationYear,
        author_name: authorName,
        image_url: imageUrl
    };

    fetch('/api/add_book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
    })
        .then(response => response.json())
        .then(data =>
        {
            if (data.message)
            {
                alert(`✅ ${data.message}`);   // Similar to delete success
                window.location.href = "/";   // Redirect to main page
            } else
            {
                alert(`❌ Error: ${data.error}`);
            }
        })
        .catch(error => console.error('Error adding book:', error));
}


// =============================
// ✅ Display Newly Added Books
// =============================
function displayAddedBooks()
{
    const bookList = document.getElementById('bookList');
    if (!bookList) return;

    bookList.innerHTML = '';
    books.forEach(book =>
    {
        const bookElement = document.createElement('div');
        bookElement.style = `
            background:white; margin:10px 0; padding:15px;
            border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.1);
        `;
        bookElement.innerHTML = `
            <h2>Added Successfully: ${book.title}</h2>
            <p>Author: ${book.author_name}</p>
            <p>Publication Year: ${book.publication_year}</p>
            ${book.image_url
                ? `<img src="${book.image_url}" alt="Book Image"
                        style="max-width:100%; height:auto; border-radius:5px;">`
                : ''}
        `;
        bookList.appendChild(bookElement);
    });
}

// =============================
// ✅ Delete a Book
// =============================
function deleteBook(bookId, bookTitle)
{
    if (!confirm(`Are you sure you want to delete "${bookTitle}"?`)) return;

    fetch(`/api/delete_book/${bookId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data =>
        {
            if (data.message)
            {
                alert(`✅ ${data.message}`);
                showAllBooks(); // refresh bookshelf
            } else
            {
                alert(`❌ Error: ${data.error}`);
            }
        })
        .catch(error => console.error('Error deleting book:', error));
}

// =============================
// ✅ Display All Books (Main Page)
// =============================
function showAllBooks()
{
    fetch('/api/books')
        .then(response => response.json())
        .then(data => renderBookCards(data.books))
        .catch(error => console.error('Error fetching all books:', error));
}

// =============================
// ✅ Search Books (DB-backed)
// =============================
function searchBooks()
{
    const query = document.getElementById('searchInput')?.value || '';
    fetch(`/api/books?search=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => renderBookCards(data.books))
        .catch(error => console.error('Error searching books:', error));
}

// =============================
// ✅ Helper: Render Book Cards (with Average Rating)
// =============================
function renderBookCards(bookArray)
{
    const bookList = document.getElementById('allbooks');
    if (!bookList) return;

    bookList.innerHTML = '';

    if (!bookArray.length)
    {
        bookList.innerHTML = '<p style="text-align:center; color:#555;">No books found.</p>';
        return;
    }

    bookArray.forEach(book =>
    {
        const avgRating = book.average_rating ? parseFloat(book.average_rating).toFixed(1) : 'No ratings yet';
        const ratingDisplay = book.average_rating
            ? `<p>⭐ Average Rating: <strong>${avgRating}/5</strong></p>`
            : `<p style="color:#777;">⭐ No ratings yet</p>`;

        const bookElement = document.createElement('div');
        bookElement.className = 'book-card';
        bookElement.innerHTML = `
            ${book.image_url
                ? `<img src="${book.image_url}" alt="Book Image">`
                : `<img src="https://via.placeholder.com/180x240?text=No+Image" alt="No Image">`}
            <div class="book-info">
                <h3>${book.title}</h3>
                <p>Author: ${book.author_name || 'Unknown'}</p>
                <p>Year: ${book.publication_year}</p>
                ${ratingDisplay}
                <button style="
                    background:#e74c3c;color:white;border:none;
                    padding:8px 12px;border-radius:6px;cursor:pointer;
                    margin-top:10px;"
                    onclick="deleteBook('${book._id}', '${book.title.replace(/'/g, "\\'")}')">
                    🗑️ Delete
                </button>
            </div>
        `;
        bookList.appendChild(bookElement);
    });
}


// =============================
// ✅ Auto-load Books if on Main Page
// =============================
document.addEventListener('DOMContentLoaded', () =>
{
    if (document.getElementById('allbooks'))
    {
        showAllBooks();
    }
});

// =============================
// ✅ Load Books into Review Dropdown
// =============================
function loadBooksForReview()
{
    fetch('/api/books')
        .then(response => response.json())
        .then(data =>
        {
            const dropdown = document.getElementById('reviewBook');
            if (!dropdown) return;
            data.books.forEach(book =>
            {
                const option = document.createElement('option');
                option.value = book._id;  // MongoDB _id
                option.textContent = book.title;
                dropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error loading books:', error));
}

// =============================
// ✅ Add a Review
// =============================
function addReview()
{
    const bookId = document.getElementById('reviewBook')?.value;
    const reviewerName = document.getElementById('reviewerName')?.value;
    const rating = document.getElementById('rating')?.value;
    const comment = document.getElementById('comment')?.value;

    if (!bookId || !reviewerName || !rating || !comment)
    {
        alert("❌ Please fill in all fields before submitting!");
        return;
    }

    const reviewData = {
        book_id: bookId,
        reviewer_name: reviewerName,
        rating: rating,
        comment: comment
    };

    fetch('/api/add_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
    })
        .then(response => response.json())
        .then(data =>
        {
            if (data.message)
            {
                alert(`✅ ${data.message}`);
                loadAllReviews(); // refresh list
            } else
            {
                alert(`❌ Error: ${data.error}`);
            }
        })
        .catch(error => console.error('Error adding review:', error));
}

// =============================
// ✅ Display All Reviews
// =============================
function loadAllReviews()
{
    fetch('/api/reviews')
        .then(response => response.json())
        .then(data => renderReviewCards(data.reviews))
        .catch(error => console.error('Error fetching reviews:', error));
}

function renderReviewCards(reviewArray)
{
    const reviewList = document.getElementById('reviewList');
    if (!reviewList) return;
    reviewList.innerHTML = '';

    if (!reviewArray.length)
    {
        reviewList.innerHTML = '<p style="text-align:center;color:#777;">No reviews yet.</p>';
        return;
    }

    reviewArray.forEach(review =>
    {
        const div = document.createElement('div');
        div.style = `
            background:white; margin:10px 0; padding:15px;
            border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.1);
        `;
        div.innerHTML = `
            <h3>⭐ ${review.rating}/5</h3>
            <p><strong>${review.reviewer_name}</strong></p>
            <p>${review.comment}</p>
        `;
        reviewList.appendChild(div);
    });
}

// =============================
// ✅ Auto-load when on Reviews Page
// =============================
document.addEventListener('DOMContentLoaded', () =>
{
    if (document.getElementById('reviews-section'))
    {
        loadBooksForReview();
        loadAllReviews();
    }
});

