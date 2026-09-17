import React from "react";
import { Link } from "react-router-dom";

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-meta-row">
        <span>{book.genre}</span>
        <span>{book.year}</span>
      </div>
      <h3>{book.title}</h3>
      <p className="book-author">{book.author}</p>
      <p className="book-blurb">{book.blurb}</p>
    </Link>
  );
}
