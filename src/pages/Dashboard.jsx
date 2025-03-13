import React, { useContext, useEffect, useState } from "react";
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
import Header from "../components/Header";
import { AuthContext } from "../context/AuthContext";
import { NavLink } from "react-router-dom";
import LoadingComponent from "../components/LoadingComponent";

export default function Dashboard() {
  const { getQuizList, getUserData } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [scoresHistory, setScoresHistory] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [userData, setUserData] = useState({
    attempts: [],
    birthday: null,
    date_joined: "",
    email: "",
    full_name: "",
    gender: null,
    groups: [],
    id: 0,
    is_active: false,
    is_staff: false,
    is_superuser: false,
    is_verified: false,
    last_login: "",
    password: "",
    phone_number: "",
    user_permissions: [],
  });

  const [quizList, setQuizList] = useState([]);

  const initialQuizList = async () => {
    try {
      // setLoading(true);
      const quizlist_response = await getQuizList();
      setQuizList(Array.from(quizlist_response.data.data));
      // setLoading(false);
      return quizlist_response;
    } catch (err) {
      // setLoading(false);
      return err;
    }
  };

  const formatTimeInSeconds = (time) => {
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = time % 60;
    return {
      hrs: hrs,
      mins: mins,
      secs: secs,
    };
  };

  const initializeUserData = async () => {
    try {
      setLoading(true);
      const user_data_response = await getUserData();
      setAttempts(Array.from(user_data_response.data.attempts));
      setScoresHistory(Array.from(user_data_response.data.scores_history));
      setUserData(user_data_response.data.user);
      setLoading(false);
      return user_data_response;
    } catch (err) {
      setLoading(false);
      return err;
    }
  };

  useEffect(() => {
    initialQuizList();
    initializeUserData();
  }, []);

  useEffect(() => {
    console.log(loading);
  }, [loading]);

  return (
    <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
      <Header page={"Dashboard"} />

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
        {loading ? (
          <div className="col-span-3">
            <div className="flex justify-center items-center w-full">
              <LoadingComponent size={12} light={true} />
            </div>
          </div>
        ) : (
          quizList.map((quiz, index) => (
            <div
              className="flex items-center  bg-[#EFF7FF] rounded-[20px] p-[10px] drop-shadow-lg"
              key={index}
            >
              <div className="w-[80px] h-[80px] mr-[15px] rounded-[20px]">
                <img src={zenithLogoDark} alt="" />
              </div>
              <div className="flex flex-col w-[60%]">
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
                      <span>
                        {new Date(quiz.date_created).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </span>
                      <span>{quiz.questions.length}</span>
                      <span>{quiz.attempts.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center gap-[10px] h-full w-[25%] text-gray-700">
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
          ))
        )}
      </div>
      <div className="w-full text-center text-[13px] mb-[50px]">
        <NavLink to="/quizzes">
          <span className="cursor-pointer hover:underline transition-all">
            View All Quizzes
          </span>
        </NavLink>
      </div>

      <div className="grid grid-cols-3 gap-[20px] mb-[30px]">
        {loading ? (
          <div className="col-span-3">
            <div className="flex justify-center items-center w-full">
              <LoadingComponent size={12} light={true} />
            </div>
          </div>
        ) : (
          attempts.map((attempt, index) => (
            <div
              className="flex items-center bg-[#EFF7FF] rounded-[20px] p-[20px] drop-shadow-lg"
              key={index}
            >
              <div className="flex flex-col gap-[10px] w-1/2">
                <div className="text-[13px]">
                  <span className="font-bold">{attempt.quiz.quiz_title}</span>
                  <span className="text-[#A0A0A0] font-extralight">
                    {" "}
                    | {new Date(attempt.attempt_datetime).toLocaleDateString()}
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
                  <span className="font-bold text-[12px]">
                    {attempt.score.accuracy
                      ? attempt.score.accuracy
                      : "Unfinished"}
                  </span>
                </div>
                <div className="flex items-center justify-start">
                  <div className="flex items-center justify-center w-[15px] h-[15px] rounded-full mr-[5px]">
                    <FontAwesomeIcon
                      icon={faChartPie}
                      className="h-[7px] w-[7px]"
                    />
                  </div>
                  <span className="font-bold text-[12px]">
                    {attempt.score_accuracy
                      ? attempt.score_accuracy
                      : "Unfinished"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end w-1/2">
                <div className="w-[100px] h-[100px] rounded-full">
                  <AttemptAccuracyDoughnutGraph data_points={[83, 17]} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="w-full text-center text-[13px] mb-[30px]">
        <NavLink to="/attempts">
          <span className="cursor-pointer hover:underline transition-all">
            View All Attempts
          </span>
        </NavLink>
      </div>
    </div>
  );
}
