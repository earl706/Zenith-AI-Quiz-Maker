import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faBookOpenReader,
  faBox,
  faBullseye,
  faGear,
  faPen,
  faQuestion,
  faRightFromBracket,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import zenithLogoLight from "/src/assets/ZENITH - LOGO LIGHT.png";

export default function Navbar({ children }) {
  const [activeItemHover, setActiveItemHover] = useState("");

  const location = window.location.pathname;

  const navigationItems = [
    { navItem: "Dashboard", link: "/", icon: faBox },
    { navItem: "Quizzes", link: "/quizzes", icon: faQuestion },
    { navItem: "Create Quiz", link: "/create-quiz", icon: faAdd },
    { navItem: "Attempts", link: "/attempts", icon: faPen },
    // { navItem: "Accuracy", link: "/accuracy", icon: faBullseye },
    // { navItem: "Achievements", link: "/achievements", icon: faTrophy },
  ];

  useEffect(() => {}, [location]);

  return (
    <div className="flex min-h-screen bg-[#6F8055]">
      <aside className="w-[23%] h-[calc(100vh-2rem)] flex fixed flex-col text-blue-900 pr-[40px]">
        <div className="flex justify-start items-center mb-[75px] text-white mt-[35px] ml-[33px]">
          <div className="flex justify-center items-center w-[60px] h-[60px] mr-[30px]">
            <img src={zenithLogoLight} alt="" />
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
                      ? "flex items-center mb-[35px] font-bold text-[14px] transition-all"
                      : "flex items-center mb-[35px] font-thin text-[14px] hover:font-bold transition-all"
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
                  <div
                    className={`flex items-center justify-center mr-[27px] ${
                      navItem.link == location ||
                      activeItemHover == navItem.link
                        ? "text-white h-[40px] w-[40px]"
                        : "text-gray-300 h-[30px] w-[30px]"
                    } transition-all`}
                  >
                    <FontAwesomeIcon
                      icon={navItem.icon}
                      className="w-full h-full"
                    />
                  </div>
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
            <div
              className={`flex items-center justify-center h-[30px] w-[30px] mr-[27px] ${
                activeItemHover == "settings" ? "text-white" : "text-gray-300"
              } `}
            >
              <FontAwesomeIcon
                icon={faRightFromBracket}
                className="w-full h-full"
              />
            </div>
            <span>Logout</span>
          </NavLink>
        </div>
      </aside>
      <main className="flex-grow mt-[15px] mr-[15px] w-[77%] bg-white rounded-t-[20px] ml-[300px] transition-all">
        <div className="transition-all">{children}</div>
      </main>
    </div>
  );
}
