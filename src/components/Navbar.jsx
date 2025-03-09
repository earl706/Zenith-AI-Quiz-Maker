import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpenReader } from "@fortawesome/free-solid-svg-icons";

export default function Navbar({ children }) {
  const [activeItemHover, setActiveItemHover] = useState("");

  const location = window.location.pathname;

  const navigationItems = [
    { navItem: "Dashboard", link: "/" },
    { navItem: "Quizzes", link: "/quizzes" },
    { navItem: "Create Quiz", link: "/create-quiz" },
    { navItem: "Attempts", link: "/attempts" },
    { navItem: "Accuracy", link: "/accuracy" },
    { navItem: "Achievements", link: "/achievements" },
  ];

  useEffect(() => {}, [location]);

  return (
    <div className="flex min-h-screen bg-[#3C6B9F]">
      <aside className="w-[23%] h-[calc(100vh-2rem)] flex sticky flex-col text-blue-900">
        <div className="flex justify-start items-center mb-[75px] text-white mt-[35px] ml-[33px]">
          <div className="flex justify-center items-center w-[60px] h-[60px] mr-[15px] bg-white">
            {/* <FontAwesomeIcon
              icon={faBookOpenReader}
              //   className="w-full h-full"
            /> */}
          </div>
          <span className="text-[30px] text-left font-bold">Zenith</span>
        </div>
        <nav className="flex-grow text-white">
          <ul className="">
            {navigationItems.map((navItem, index) => (
              <li
                key={index}
                onMouseEnter={() => setActiveItemHover(navItem.link)}
                onMouseLeave={() => setActiveItemHover("")}
              >
                <NavLink
                  to={navItem.link}
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center mb-[35px] font-bold text-[18px] transition-all"
                      : "flex items-center mb-[35px] font-thin text-[18px] hover:font-bold transition-all"
                  }
                >
                  <div
                    className={`${
                      navItem.link == location ||
                      activeItemHover == navItem.link
                        ? "bg-white"
                        : "bg-transparent"
                    } w-[10px] h-[40px] rounded-tr-[10px] rounded-br-[10px] mr-[33px] transition-all`}
                  ></div>
                  <div className="flex items-center justify-center h-[30px] w-[30px] mr-[27px] bg-white"></div>
                  {navItem.navItem}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex w-full">
          <NavLink
            to="/login"
            onClick={() => {
              localStorage.clear();
            }}
            className="flex items-center justify-center text-white font-thin hover:font-bold transition-all"
            onMouseEnter={() => setActiveItemHover("settings")}
            onMouseLeave={() => setActiveItemHover("")}
          >
            <div
              className={`${
                activeItemHover == "settings" ? "bg-white" : "bg-transparent"
              } w-[10px] h-[40px] rounded-tr-[10px] rounded-br-[10px] mr-[33px] transition-all`}
            ></div>
            <div className="flex items-center justify-center h-[30px] w-[30px] mr-[27px] bg-white"></div>
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
      <main className="flex-grow mt-[15px] mr-[15px] w-[77%] bg-white rounded-t-[20px]">
        <div className="">{children}</div>
      </main>
    </div>
  );
}
