import React, { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../hooks/useAuth";
import { getBook, getMyList, addToMyList, removeFromMyList } from "../api/books";

export default function BookDetail() {
  const { id } = useParams();
  const { isAuthenticated, token } = useAuth();
  const [actionError, setActionError] = useState(null);
  const [working, setWorking] = useState(false);

  const { data: book, loading, error } = useFetch(() => getBook(id), [id]);

  const fetchMyList = useCallback(() => {
    if (!isAuthenticated) return Promise.resolve([]);
    return getMyList(token);
  }, [isAuthenticated, token]);

  const { data: myList, refetch: refetchMyList } = useFetch(fetchMyList, [
    isAuthenticated,
    token,
  ]);

  const existingEntry = myList?.find((entry) => entry.bookId === id);

  async function handleToggleSaved() {
    setActionError(null);
    setWorking(true);
    try {
      if (existingEntry) {
        await removeFromMyList(existingEntry.id, token);
      } else {
        await addToMyList(id, token);
      }
      refetchMyList();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div className="page loading-row">Loading...</div>;
  if (error || !book) {
    return (
      <div className="page">
        <div className="form-error">Couldn't find that book.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        &larr; Back to catalog
      </Link>

      <div className="detail-layout">
        <img className="detail-cover" src={book.cover} alt={`Cover of ${book.title}`} />

        <div>
          <div className="detail-genre">{book.genre}</div>
          <h1>{book.title}</h1>
          <p className="detail-author">by {book.author}</p>

          <div className="detail-facts">
            <span>{book.year}</span>
            <span>{book.pages} pages</span>
          </div>

          <p className="detail-blurb">{book.blurb}</p>

          {actionError && <div className="form-error">{actionError}</div>}

          {isAuthenticated ? (
            <button
              className={existingEntry ? "btn btn-danger" : "btn btn-solid"}
              onClick={handleToggleSaved}
              disabled={working}
            >
              {working
                ? "Saving..."
                : existingEntry
                ? "Remove from my list"
                : "Add to my list"}
            </button>
          ) : (
            <p className="auth-switch">
              <Link to="/login">Log in</Link> to save this to your reading list.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
