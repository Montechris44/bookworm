// =========================================================
// Bookworm App - JavaScript
// LocalStorage powered, reactive, no backend required
// =========================================================

(function () {
  'use strict';

  // Storage key
  const STORAGE_KEY = 'bookworm_books';

  // State
  let books = [];
  let searchQuery = '';

  // DOM Elements - Form
  const addBookForm = document.getElementById('add-book-form');
  const bookTitleInput = document.getElementById('book-title');
  const bookAuthorInput = document.getElementById('book-author');
  const bookStatusSelect = document.getElementById('book-status');
  const titleError = document.getElementById('title-error');
  const authorError = document.getElementById('author-error');

  // DOM Elements - Stats
  const totalCountEl = document.getElementById('total-count');
  const readCountEl = document.getElementById('read-count');
  const unreadCountEl = document.getElementById('unread-count');

  // DOM Elements - Search & List
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const bookListEl = document.getElementById('book-list');
  const emptyStateEl = document.getElementById('empty-state');
  const emptyTitleEl = document.getElementById('empty-title');
  const emptySubtitleEl = document.getElementById('empty-subtitle');

  // DOM Elements - Edit Modal
  const editModal = document.getElementById('edit-modal');
  const editBookForm = document.getElementById('edit-book-form');
  const editBookIdInput = document.getElementById('edit-book-id');
  const editBookTitleInput = document.getElementById('edit-book-title');
  const editBookAuthorInput = document.getElementById('edit-book-author');
  const editBookStatusSelect = document.getElementById('edit-book-status');
  const editTitleError = document.getElementById('edit-title-error');
  const editAuthorError = document.getElementById('edit-author-error');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');

  // Helper: Escape HTML to avoid XSS issues
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load books from localStorage
  function loadBooks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        books = JSON.parse(stored);
        if (!Array.isArray(books)) {
          books = [];
        }
      } else {
        books = [];
      }
    } catch (e) {
      console.error('Error reading books from localStorage:', e);
      books = [];
    }
  }

  // Save books to localStorage
  function saveBooks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (e) {
      console.error('Error saving books to localStorage:', e);
      alert('Could not save to local storage. Your browser storage might be full.');
    }
  }

  // Update top counter
  function updateStats() {
    const total = books.length;
    const read = books.filter(b => b.status === 'read').length;
    const unread = total - read;

    totalCountEl.textContent = total;
    readCountEl.textContent = read;
    unreadCountEl.textContent = unread;
  }

  // Render book list & empty states
  function render() {
    updateStats();

    // Filter books based on search query
    const query = searchQuery.trim().toLowerCase();
    const filtered = books.filter(book => {
      if (!query) return true;
      const titleMatch = book.title.toLowerCase().includes(query);
      const authorMatch = book.author.toLowerCase().includes(query);
      return titleMatch || authorMatch;
    });

    // Check empty cases
    if (books.length === 0) {
      // Entire collection is empty
      emptyTitleEl.textContent = 'Your bookshelf is empty!';
      emptySubtitleEl.textContent = 'Add your first book above to start tracking your reading journey.';
      emptyStateEl.style.display = 'block';
      bookListEl.innerHTML = '';
      return;
    }

    if (filtered.length === 0) {
      // Search produced no results
      emptyTitleEl.textContent = 'No matching books found';
      emptySubtitleEl.textContent = `No books matched "${searchQuery.trim()}". Try searching for another title or author.`;
      emptyStateEl.style.display = 'block';
      bookListEl.innerHTML = '';
      return;
    }

    // Hide empty state and show list
    emptyStateEl.style.display = 'none';

    // Render list items
    bookListEl.innerHTML = filtered.map(book => {
      const isRead = book.status === 'read';
      const statusLabel = isRead ? 'Read' : 'Not Read';
      const statusClass = isRead ? 'read' : 'unread';
      const toggleLabel = isRead ? 'Mark as Not Read' : 'Mark as Read';

      return `
        <li class="book-item" data-id="${book.id}">
          <div class="book-info">
            <div class="book-title-row">
              <h3 class="book-title">${escapeHtml(book.title)}</h3>
              <span class="status-badge ${statusClass}" title="Click to toggle status" data-action="toggle-status">
                ${statusLabel}
              </span>
            </div>
            <p class="book-author">by ${escapeHtml(book.author)}</p>
          </div>
          <div class="book-actions">
            <button type="button" class="btn-toggle-status" data-action="toggle-status">
              ${toggleLabel}
            </button>
            <div class="action-buttons-group">
              <button type="button" class="btn-action btn-edit" data-action="edit" aria-label="Edit book">
                ✏️ Edit
              </button>
              <button type="button" class="btn-action btn-delete" data-action="delete" aria-label="Delete book">
                🗑️ Delete
              </button>
            </div>
          </div>
        </li>
      `;
    }).join('');
  }

  // Handle Add Book Form Submit
  addBookForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = bookTitleInput.value.trim();
    const author = bookAuthorInput.value.trim();
    const status = bookStatusSelect.value;

    let hasError = false;

    // Validation
    if (!title) {
      titleError.textContent = 'Please enter a book title.';
      bookTitleInput.focus();
      hasError = true;
    } else {
      titleError.textContent = '';
    }

    if (!author) {
      authorError.textContent = 'Please enter the author\'s name.';
      if (!hasError) bookAuthorInput.focus();
      hasError = true;
    } else {
      authorError.textContent = '';
    }

    if (hasError) return;

    // Create new book object
    const newBook = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      title: title,
      author: author,
      status: status,
      createdAt: new Date().toISOString()
    };

    // Prepend to display newest book first
    books.unshift(newBook);
    saveBooks();

    // Reset form
    bookTitleInput.value = '';
    bookAuthorInput.value = '';
    bookStatusSelect.value = 'unread';
    titleError.textContent = '';
    authorError.textContent = '';

    render();
  });

  // Handle Book List Actions (Delegation: Toggle status, Edit, Delete)
  bookListEl.addEventListener('click', function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const bookItem = target.closest('.book-item');
    if (!bookItem) return;

    const bookId = bookItem.getAttribute('data-id');
    const bookIndex = books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return;

    const book = books[bookIndex];
    const action = target.getAttribute('data-action');

    if (action === 'toggle-status') {
      // Toggle between read and unread
      book.status = book.status === 'read' ? 'unread' : 'read';
      saveBooks();
      render();
    } else if (action === 'edit') {
      openEditModal(book);
    } else if (action === 'delete') {
      // Confirmation required by user request
      const confirmed = window.confirm(`Are you sure you want to delete "${book.title}" by ${book.author}?`);
      if (confirmed) {
        books.splice(bookIndex, 1);
        saveBooks();
        render();
      }
    }
  });

  // Edit Modal Functions
  function openEditModal(book) {
    editBookIdInput.value = book.id;
    editBookTitleInput.value = book.title;
    editBookAuthorInput.value = book.author;
    editBookStatusSelect.value = book.status;

    editTitleError.textContent = '';
    editAuthorError.textContent = '';

    editModal.style.display = 'flex';
    editBookTitleInput.focus();
  }

  function closeEditModal() {
    editModal.style.display = 'none';
    editBookForm.reset();
    editTitleError.textContent = '';
    editAuthorError.textContent = '';
  }

  // Handle Edit Book Form Submit
  editBookForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const id = editBookIdInput.value;
    const title = editBookTitleInput.value.trim();
    const author = editBookAuthorInput.value.trim();
    const status = editBookStatusSelect.value;

    let hasError = false;

    if (!title) {
      editTitleError.textContent = 'Please enter a book title.';
      editBookTitleInput.focus();
      hasError = true;
    } else {
      editTitleError.textContent = '';
    }

    if (!author) {
      editAuthorError.textContent = 'Please enter an author.';
      if (!hasError) editBookAuthorInput.focus();
      hasError = true;
    } else {
      editAuthorError.textContent = '';
    }

    if (hasError) return;

    const bookIndex = books.findIndex(b => b.id === id);
    if (bookIndex !== -1) {
      books[bookIndex].title = title;
      books[bookIndex].author = author;
      books[bookIndex].status = status;
      saveBooks();
      render();
    }

    closeEditModal();
  });

  // Modal close events
  modalCloseBtn.addEventListener('click', closeEditModal);
  modalCancelBtn.addEventListener('click', closeEditModal);

  // Close modal when clicking on backdrop
  editModal.addEventListener('click', function (e) {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && editModal.style.display === 'flex') {
      closeEditModal();
    }
  });

  // Search input event
  searchInput.addEventListener('input', function (e) {
    searchQuery = e.target.value;
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    render();
  });

  // Clear search button
  clearSearchBtn.addEventListener('click', function () {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    render();
    searchInput.focus();
  });

  // Initial load
  loadBooks();
  render();
})();

