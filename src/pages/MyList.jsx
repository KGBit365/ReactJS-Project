import React, { useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../hooks/useAuth";
import { getBooks, getMyList, removeFromMyList } from "../api/books";

export default function MyList() {
  const { token, user } = useAuth();

  const fetchBooks = useCallback(() => getBooks(), []);
  const fetchEntries = useCallback(() => getMyList(token), [token]);

  const { data: books, loading: booksLoading } = useFetch(fetchBooks, []);
  const {
    data: entries,
    loading: entriesLoading,
    error,
    refetch,
  } = useFetch(fetchEntries, [token]);

  const savedBooks = useMemo(() => {
    if (!books || !entries) return [];
    return entries
      .map((entry) => {
        const book = books.find((b) => b.id === entry.bookId);
        return book ? { entryId: entry.id, ...book } : null;
      })
      .filter(Boolean);
  }, [books, entries]);

  async function handleRemove(entryId) {
    await removeFromMyList(entryId, token);
    refetch();
  }

  const loading = booksLoading || entriesLoading;

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-eyebrow">Signed in as {user?.name}</div>
        <h1>Your reading list.</h1>
        <p>Titles you've set aside from the catalog. Remove anything you've read.</p>
      </section>

      {loading && <div className="loading-row">Loading your list...</div>}
      {error && <div className="form-error">{error}</div>}

      {!loading && !error && savedBooks.length === 0 && (
        <div className="empty-state">
          Nothing saved yet. Browse the <Link to="/">catalog</Link> and add a book.
        </div>
      )}

      {!loading &&
        savedBooks.map((book) => (
          <div className="mylist-row" key={book.entryId}>
            <div>
              <Link to={`/books/${book.id}`} className="mylist-title">
                {book.title}
              </Link>
              <div className="mylist-author">{book.author}</div>
            </div>
            <button className="btn btn-quiet" onClick={() => handleRemove(book.entryId)}>
              Remove
            </button>
          </div>
        ))}
    </div>
  );
}
