
const books = [];

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


function showAllBooks()
{
    fetch('/api/books')
        .then(response => response.json())
        .then(data => renderBookCards(data.books))
        .catch(error => console.error('Error fetching all books:', error));
}

function searchBooks()
{
    const query = document.getElementById('searchInput')?.value || '';
    fetch(`/api/books?search=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => renderBookCards(data.books))
        .catch(error => console.error('Error searching books:', error));
}

let currentEditingBookId = null;

function editBookForm(book)
{
    currentEditingBookId = book._id;
    document.getElementById('modalTitle').value = book.title;
    document.getElementById('modalYear').value = book.publication_year;
    document.getElementById('modalAuthor').value = book.author_name;
    document.getElementById('modalImage').value = book.image_url || '';
    document.getElementById('editBookModal').style.display = 'flex';
}

// Close modal
document.getElementById('closeModal').addEventListener('click', () =>
{
    document.getElementById('editBookModal').style.display = 'none';
});

// Save changes
document.getElementById('saveModalBtn').addEventListener('click', () =>
{
    if (!currentEditingBookId) return;

    const updatedBook = {
        title: document.getElementById('modalTitle').value,
        publication_year: document.getElementById('modalYear').value,
        author_name: document.getElementById('modalAuthor').value,
        image_url: document.getElementById('modalImage').value
    };

    fetch(`/api/edit_book/${currentEditingBookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBook)
    })
        .then(res => res.json())
        .then(data =>
        {
            if (data.message)
            {
                alert(`✅ ${data.message}`);
                document.getElementById('editBookModal').style.display = 'none';
                showAllBooks();
            } else
            {
                alert(`❌ Error: ${data.error}`);
            }
        })
        .catch(err => console.error('Error editing book:', err));
});

// Close modal on click outside content
window.addEventListener('click', e =>
{
    if (e.target === document.getElementById('editBookModal'))
    {
        e.target.style.display = 'none';
    }
});


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

        // Add Edit button with proper click handler
        const editBtn = document.createElement('button');
        editBtn.style = `
            background:#3498db;color:white;border:none;
            padding:8px 12px;border-radius:6px;cursor:pointer;
            margin-top:10px; margin-left:5px;
        `;
        editBtn.textContent = '✏️ Edit';
        editBtn.addEventListener('click', () => editBookForm(book));

        bookElement.querySelector('.book-info').appendChild(editBtn);
    });
}


document.addEventListener('DOMContentLoaded', () =>
{
    if (document.getElementById('allbooks'))
    {
        showAllBooks();
    }
});


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

function submitEditBook(bookId)
{
    const updatedBook = {
        title: document.getElementById('editTitle')?.value,
        publication_year: document.getElementById('editYear')?.value,
        author_name: document.getElementById('editAuthor')?.value,
        image_url: document.getElementById('editImage')?.value
    };

    fetch(`/api/edit_book/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBook)
    })
        .then(response => response.json())
        .then(data =>
        {
            if (data.message)
            {
                alert(`✅ ${data.message}`);
                showAllBooks();
            } else
            {
                alert(`❌ Error: ${data.error}`);
            }
        })
        .catch(error => console.error('Error editing book:', error));
}



document.addEventListener('DOMContentLoaded', () =>
{
    if (document.getElementById('reviews-section'))
    {
        loadBooksForReview();
        loadAllReviews();
    }
});

