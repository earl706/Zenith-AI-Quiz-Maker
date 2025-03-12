import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAnglesRight,
  faBullseye,
  faChartPie,
  faHourglass,
  faUpDownLeftRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import zenithLogoDark from "/src/assets/ZENITH - LOGO DARK.png";
import AttemptAccuracyDoughnutGraph from "../components/AttemptAccuracyDoughnutGraph";

const quizList = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => ({
  quiz_title: "Quiz Title",
  date_created: "December 28, 1928",
  questions: 25,
  attempts: 23,
}));

const attempts = [0, 1, 2].map(() => ({
  quiz_title: "Quiz Title",
  date_created: "2/8/24",
  duration: "8 mins 3 secs",
  ratio: "83/100",
  accuracy: "83%",
}));

const achievements = [
  "First Steps",
  "Quiz Enthusiast",
  "Quiz Master",
  "Daily Streak",
  "Consistency",
].map((num) => ({
  name: num,
}));

export default function Dashboard() {
  const [userName, setUsername] = useState("Earl Benedict C. Dumaraog");
  const [userID, setUserID] = useState("2021309235");

  useEffect(() => {}, []);

  return (
    <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
      <div className="flex justify-between items-center mb-[40px]">
        <div className="flex justify-between items-center w-[67%]">
          <div className="flex flex-col gap-0">
            <div className="text-[13px]">
              <span className="text-[#6F8055]">Pages / </span>
              <span className="font-semibold">Dashboard</span>
            </div>
            <span className="text-[#6F8055] text-[40px] font-extrabold">
              Dashboard
            </span>
          </div>
          <div className="flex justify-end gap-[20px]">
            <div className="h-[35px] w-[35px] bg-gray-300 rounded-full"></div>
            <div className="h-[35px] w-[35px] bg-gray-300 rounded-full"></div>
          </div>
        </div>
        <div className="flex justify-end gap-[12px]">
          <div className="flex flex-col justify-start items-end">
            <span className="text-[13px]">{userName}</span>
            <span className="text-[10px] text-[#A1A1A1]">{userID}</span>
          </div>
          <div className="h-[40px] w-[40px] bg-gray-300 rounded-full"></div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-[40px] w-[67%]">
        <span className="text-[15px] font-semibold mr-[40px]">Filter by:</span>
        <div className="flex justify-between gap-[20px] w-[84%]">
          <button className="flex items-center justify-center text-[#6F8055] px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
            <span className="font-semibold text-[12px] mr-[5px]">Time</span>
            <div className="flex items-center justify-center h-[13px] w-[13px]">
              <FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
            </div>
          </button>
          <button className="flex items-center justify-center text-[#6F8055] px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
            <span className="font-semibold text-[12px] mr-[5px]">
              Questions
            </span>
            <div className="flex items-center justify-center h-[13px] w-[13px]">
              <FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
            </div>
          </button>
          <button className="flex items-center justify-center text-[#6F8055] px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
            <span className="font-semibold text-[12px] mr-[5px]">Attempts</span>
            <div className="flex items-center justify-center h-[13px] w-[13px]">
              <FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
            </div>
          </button>
          <button className="flex items-center justify-center text-[#6F8055] px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
            <span className="font-semibold text-[12px] mr-[5px]">
              Mathematical
            </span>
            <div className="flex items-center justify-center h-[13px] w-[13px]">
              <FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
            </div>
          </button>
          <button className="flex items-center justify-center text-[#6F8055] px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
            <span className="font-semibold text-[12px] mr-[5px]">
              Identification
            </span>
            <div className="flex items-center justify-center h-[13px] w-[13px]">
              <FontAwesomeIcon icon={faAngleDown} className="h-[7px] w-[7px]" />
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[20px] mb-[30px]">
        {quizList.map((quiz, index) => (
          <div
            className="flex items-center  bg-[#EFF7FF] rounded-[20px] p-[10px] drop-shadow-lg"
            key={index}
          >
            <div className="w-[80px] h-[80px] mr-[15px] rounded-[20px]">
              <img src={zenithLogoDark} alt="" />
            </div>
            <div className="flex flex-col w-[1/2]">
              <div className="text-[15px] font-semibold mb-[5px]">
                <span>{quiz.quiz_title}</span>
              </div>
              <div className="flex">
                <div className="text-[10px] mr-[15px]">
                  <div className="flex flex-col font-light gap-[5px]">
                    <span>Created</span>
                    <span>Questions</span>
                    <span>Attempts</span>
                  </div>
                </div>
                <div className="text-[10px]">
                  <div className="flex flex-col font-semibold gap-[5px]">
                    <span>{quiz.date_created}</span>
                    <span>{quiz.questions}</span>
                    <span>{quiz.attempts}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end justify-center gap-[10px] h-full w-[16%] text-gray-700">
              <button className="flex items-center justify-center cursor-pointer h-[15px] w-[15px] bg-[#FF605C] rounded-full font-bold">
                <FontAwesomeIcon icon={faXmark} className="h-[7px] w-[7px]" />
              </button>

              <button className="flex items-center justify-center cursor-pointer h-[15px] w-[15px] bg-[#FFBD44] rounded-full font-bold">
                <FontAwesomeIcon
                  icon={faUpDownLeftRight}
                  className="h-[7px] w-[7px]"
                />
              </button>
              <button className="flex items-center justify-center cursor-pointer h-[15px] w-[15px] bg-[#00CA4E] rounded-full font-bold">
                <FontAwesomeIcon
                  icon={faAnglesRight}
                  className="h-[7px] w-[7px]"
                />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full text-center text-[13px] mb-[50px]">
        <span className="cursor-pointer hover:underline transition-all">
          View All Quizzes
        </span>
      </div>
      <div className="grid grid-cols-3 gap-[20px] mb-[30px]">
        {attempts.map((attempt) => (
          <div className="flex items-center bg-[#EFF7FF] rounded-[20px] p-[20px] drop-shadow-lg">
            <div className="flex flex-col gap-[10px] w-1/2">
              <div className="text-[13px]">
                <span className="font-bold">{attempt.quiz_title}</span>
                <span className="text-[#A0A0A0] font-extralight">
                  {" "}
                  | {attempt.date_created}
                </span>
              </div>
              <div className="flex items-center justify-start">
                <div className="flex items-center justify-center w-[15px] h-[15px] rounded-full mr-[5px]">
                  <FontAwesomeIcon
                    icon={faHourglass}
                    className="h-[7px] w-[7px]"
                  />
                </div>
                <span className="font-bold text-[12px]">
                  {attempt.duration}
                </span>
              </div>
              <div className="flex items-center justify-start">
                <div className="flex items-center justify-center w-[15px] h-[15px] rounded-full mr-[5px]">
                  <FontAwesomeIcon
                    icon={faBullseye}
                    className="h-[7px] w-[7px]"
                  />
                </div>
                <span className="font-bold text-[12px]">{attempt.ratio}</span>
              </div>
              <div className="flex items-center justify-start">
                <div className="flex items-center justify-center w-[15px] h-[15px] rounded-full mr-[5px]">
                  <FontAwesomeIcon
                    icon={faChartPie}
                    className="h-[7px] w-[7px]"
                  />
                </div>
                <span className="font-bold text-[12px]">
                  {attempt.accuracy}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end w-1/2">
              <div className="w-[100px] h-[100px] rounded-full">
                <AttemptAccuracyDoughnutGraph />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full text-center text-[13px] mb-[30px]">
        <span className="cursor-pointer hover:underline transition-all">
          View All Attempts
        </span>
      </div>
    </div>
  );
}
