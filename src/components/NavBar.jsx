import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          Reading <span>Nook</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Catalog
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/mylist" className={({ isActive }) => (isActive ? "active" : "")}>
              My List
            </NavLink>
          )}
        </nav>

        <div className="nav-user">
          {isAuthenticated ? (
            <>
              <span className="nav-name">{user.name}</span>
              <button className="btn-link" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-link">
                Log in
              </NavLink>
              <NavLink to="/register" className="btn btn-solid">
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
