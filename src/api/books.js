import { request } from "./client";

export function getBooks() {
  return request("/api/books");
}

export function getBook(id) {
  return request(`/api/books/${id}`);
}

export function getMyList(token) {
  return request("/api/mylist", { token });
}

export function addToMyList(bookId, token) {
  return request("/api/mylist", { method: "POST", body: { bookId }, token });
}

export function removeFromMyList(entryId, token) {
  return request(`/api/mylist/${entryId}`, { method: "DELETE", token });
}
