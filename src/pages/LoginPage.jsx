import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function LoginPage({ performLogin }) {
  const { login, refreshToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const login_response = await login(username, password);
      if (login_response.status == 200 || login_response.statusText == "OK") {
        performLogin();
        navigate("/");
      }
      setLoading(false);
      return login_response;
    } catch (err) {
      setLoading(false);
      return err;
    }
  };

  const handleSavedLogin = async (refresh_token) => {
    try {
      setLoading(true);
      const login_response = await refreshToken(refresh_token);
      const lastPath = localStorage.getItem("lastPath");
      if (login_response.status == 200 || login_response.statusText == "OK") {
        localStorage.setItem(
          "zenithQuizMakerAccessToken",
          login_response.data.access
        );
        performLogin();
        const lastPathArray = lastPath.split("/");
        if (lastPathArray[2] == "attempt") {
          navigate(`/quiz/${lastPathArray[3]}/`);
        } else {
          navigate(`${lastPath}`);
        }
      }
      setLoading(false);
      return login_response;
    } catch (err) {
      setLoading(false);
      return err;
    }
  };

  useEffect(() => {
    if (localStorage.getItem("zenithQuizMakerAccessToken")) {
      handleSavedLogin(localStorage.getItem("zenithQuizMakerRefreshToken"));
    }
  }, []);
  return (
    <div
      className={
        loading
          ? "flex items-center justify-center w-full h-screen bg-[#6F8055] blur-3xl transition-all"
          : "flex items-center justify-center w-full h-screen bg-[#6F8055] transition-all"
      }
    >
      <div className="w-full max-w-md p-8 space-y-4 bg-[#EFF7FF] rounded-[20px] drop-shadow-lg">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label
              className={
                username != ""
                  ? "transition block mb-1 text-sm font-bold text-gray-700"
                  : "transition block mb-1 text-sm font-bold text-transparent"
              }
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              placeholder="Username"
              className="transition w-full text-[14px] p-2 border-b border-gray-300 focus:border-black outline-none"
              required
            />
          </div>

          <div className="mb-[20px]">
            <label
              className={
                password != ""
                  ? "transition block mb-2 mt-5 text-sm font-bold text-gray-700"
                  : "transition block mb-2 mt-5 text-sm font-bold text-transparent"
              }
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              placeholder="Password"
              className="transition w-full text-[14px] p-2 border-b border-gray-300 focus:border-black outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="cursor-pointer transition w-full px-4 py-2 mt-5 text-white bg-[#3C6B9F] font-bold rounded-full hover:bg-[#1C4B7F]"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
