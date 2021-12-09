import "./App.css";
import axios from "axios";
import { useState } from "react";
import jwt_decode from "jwt-decode";
import Cookies from "js-cookie";

function App() {
  const persistedUser = Cookies.get("user")
    ? JSON.parse(Cookies.get("user"))
    : null;

  const [user, setUser] = useState(persistedUser);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const refreshToken = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_AUTH_SERVER}/api/refresh`,
        { token: user.refreshToken }
      );
      setUser({
        ...user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
      return res.data;
    } catch (err) {
      console.log(err);
    }
  };

  const axiosJWT = axios.create();

  axiosJWT.interceptors.request.use(
    async (config) => {
      let currentDate = new Date();
      const decodedToken = jwt_decode(user.accessToken);
      if (decodedToken.exp * 1000 < currentDate.getTime()) {
        const data = await refreshToken();
        config.headers["authorization"] = "Bearer " + data.accessToken;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_AUTH_SERVER}/api/login`,
        { username, password }
      );
      setUser(res.data);
      Cookies.set("user", JSON.stringify(res.data));
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    setSuccess(false);
    setError(false);
    try {
      await axiosJWT.delete(
        `${process.env.REACT_APP_AUTH_SERVER}/api/users/` + id,
        {
          headers: { authorization: "Bearer " + user.accessToken },
        }
      );
      setSuccess(true);
    } catch (err) {
      setError(true);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosJWT.post(
        `${process.env.REACT_APP_AUTH_SERVER}/api/logout`,
        {
          token: user.refreshToken,
        },
        {
          headers: { authorization: "Bearer " + user.accessToken },
        }
      );
      setUser(null);
      Cookies.delete("user");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">
      {user ? (
        <div className="home">
          <span>
            Welcome to the <b>{user.isAdmin ? "admin" : "user"}</b> dashboard{" "}
            <b>{user.username}</b>.
          </span>
          <span>Delete Users:</span>
          <button className="deleteButton" onClick={() => handleDelete(1)}>
            Delete Sydney
          </button>
          <button className="deleteButton" onClick={() => handleDelete(2)}>
            Delete Ovidiu
          </button>

          <button className="logoutButton" onClick={handleLogout}>
            Logout
          </button>
          {error && (
            <span className="error">
              You are not allowed to delete this user
            </span>
          )}
          {success && (
            <span className="success">User has been deleted successfully</span>
          )}
        </div>
      ) : (
        <div className="login">
          <form onSubmit={handleSubmit}>
            <span className="formTitle">Login</span>
            <input
              type="text"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="submitButton">
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
