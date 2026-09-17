import React, { useMemo, useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { getBooks } from "../api/books";
import BookCard from "../components/BookCard";

export default function Home() {
  const { data: books, loading, error } = useFetch(getBooks, []);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");

  const genres = useMemo(() => {
    if (!books) return [];
    return Array.from(new Set(books.map((b) => b.genre))).sort();
  }, [books]);

  const filtered = useMemo(() => {
    if (!books) return [];
    return books.filter((b) => {
      const matchesGenre = genre === "all" || b.genre === genre;
      const haystack = `${b.title} ${b.author}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      return matchesGenre && matchesQuery;
    });
  }, [books, query, genre]);

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-eyebrow">The catalog</div>
        <h1>Books worth setting time aside for.</h1>
        <p>
          A small, hand-picked shelf. Browse the catalog, open a title for the
          full record, and keep a personal reading list once you're signed in.
        </p>
      </section>

      <div className="filter-row">
        <input
          type="text"
          placeholder="Search by title or author"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="all">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading-row">Loading the shelf...</div>}

      {error && (
        <div className="form-error">
          Couldn't reach the catalog API. Is the server running on port 4000?
          <br />
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">No books match that search.</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="book-grid">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
