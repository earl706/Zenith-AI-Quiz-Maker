import {
  faAngleDown,
  faAngleRight,
  faAnglesRight,
  faUpDownLeftRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import zenithLogoDark from "/src/assets/ZENITH - LOGO DARK.png";
import Header from "../components/Header";
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function QuizzesPage() {
  const { getQuizList } = useContext(AuthContext);
  const [quizList, setQuizList] = useState([]);
  const [newest, setNewest] = useState([]);
  const [mostAttempted, setMostAttempted] = useState([]);

  const initializeQuizzes = async () => {
    try {
      const quizList_response = await getQuizList();
      console.log(quizList_response.data);
      setQuizList(Array.from(quizList_response.data.data));
      setNewest(Array.from(quizList_response.data.newest));
      setMostAttempted(Array.from(quizList_response.data.most_attempted));
      return quizzes;
    } catch (err) {
      return err;
    }
  };

  useEffect(() => {
    initializeQuizzes();
  }, []);

  return (
    <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
      <Header page={"Quizzes"} />

      <div className="flex gap-[40px]">
        <div className="flex flex-col w-[67%]">
          <div className="flex items-center justify-between mb-[35px]">
            <span className="text-[15px] font-semibold mr-[40px]">
              Filter by:
            </span>
            <div className="flex justify-between gap-[20px] w-[84%]">
              <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] text-[#6F8055] rounded-full cursor-pointer">
                <span className="font-semibold text-[12px] mr-[5px]">Time</span>
                <div className="flex items-center justify-center h-[13px] w-[13px]">
                  <FontAwesomeIcon
                    icon={faAngleDown}
                    className="h-[7px] w-[7px]"
                  />
                </div>
              </button>
              <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] text-[#6F8055] rounded-full cursor-pointer">
                <span className="font-semibold text-[12px] mr-[5px]">
                  Questions
                </span>
                <div className="flex items-center justify-center h-[13px] w-[13px]">
                  <FontAwesomeIcon
                    icon={faAngleDown}
                    className="h-[7px] w-[7px]"
                  />
                </div>
              </button>
              <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] text-[#6F8055] rounded-full cursor-pointer">
                <span className="font-semibold text-[12px] mr-[5px]">Type</span>
                <div className="flex items-center justify-center h-[13px] w-[13px]">
                  <FontAwesomeIcon
                    icon={faAngleDown}
                    className="h-[7px] w-[7px]"
                  />
                </div>
              </button>
              <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] text-[#6F8055] rounded-full cursor-pointer">
                <span className="font-semibold text-[12px] mr-[5px]">
                  Mathematical
                </span>
                <div className="flex items-center justify-center h-[13px] w-[13px]">
                  <FontAwesomeIcon
                    icon={faAngleDown}
                    className="h-[7px] w-[7px]"
                  />
                </div>
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-[20px]">
            {quizList.map((quiz, index) => (
              <div
                className="flex items-center justify-between bg-[#EFF7FF] rounded-[20px] p-[20px] drop-shadow-lg"
                key={index}
              >
                <div className="w-[210px] h-[210px] mr-[20px] rounded-[20px]">
                  <img src={zenithLogoDark} alt="" />
                </div>
                <div className="flex flex-col w-[47%]">
                  <div className="text-[20px] font-bold mb-[9px]">
                    <span>{quiz.quiz_title}</span>
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <div className="flex items-center">
                      <span className="w-[100px] text-left text-[12px]">
                        Tag Color
                      </span>
                      <div className="flex items-center w-[170px] text-left">
                        <div
                          className={`rounded-full w-[20px] h-[20px] mr-[10px]`}
                          style={{ backgroundColor: `${quiz.tag_color}` }}
                        ></div>
                        <span className="text-[14px] font-semibold">
                          {quiz.tag_color}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-[100px] text-left text-[12px]">
                        Created
                      </span>
                      <div className="flex items-center w-[170px] text-left">
                        <span className="text-[14px] font-semibold">
                          {new Date(quiz.date_created).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-[100px] text-left text-[12px]">
                        Public
                      </span>
                      <div className="flex items-center w-[170px] text-left">
                        <div
                          className={`rounded-full w-[20px] h-[20px] mr-[10px]`}
                          style={{ backgroundColor: `${quiz.tag_color}` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-[100px] text-left text-[12px]">
                        Quiz Type
                      </span>
                      <div className="flex items-center w-[170px] text-left">
                        <span className="text-[14px] font-semibold">
                          {quiz.flashcard ? "Flashcard" : "List"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-[100px] text-left text-[12px]">
                        Attempts
                      </span>
                      <div className="flex items-center w-[170px] text-left">
                        <span className="text-[14px] font-semibold">
                          {quiz.attempts}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-[100px] text-left text-[12px]">
                        Randomized
                      </span>
                      <div className="flex items-center w-[170px] text-left">
                        <div
                          className={`rounded-full w-[20px] h-[20px] mr-[10px]`}
                          style={{ backgroundColor: `${quiz.tag_color}` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between h-full w-[14%]">
                  <div className="flex items-start justify-between gap-[10px] w-full text-gray-700">
                    <button className="flex items-center justify-center cursor-pointer h-[20px] w-[20px] bg-[#FF605C] rounded-full font-bold">
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="h-[7px] w-[7px]"
                      />
                    </button>

                    <button className="flex items-center justify-center cursor-pointer h-[20px] w-[20px] bg-[#FFBD44] rounded-full font-bold">
                      <FontAwesomeIcon
                        icon={faUpDownLeftRight}
                        className="h-[7px] w-[7px]"
                      />
                    </button>
                    <button className="flex items-center justify-center cursor-pointer h-[20px] w-[20px] bg-[#00CA4E] rounded-full font-bold">
                      <FontAwesomeIcon
                        icon={faAnglesRight}
                        className="h-[7px] w-[7px]"
                      />
                    </button>
                  </div>
                  <button className="cursor-pointer flex items-center justify-evenly w-full px-[10px] py-[3px] rounded-full bg-[#00CA4E] hover:bg-[#00CA4E]">
                    <span className="font-bold text-[12px] text-white text-center mr-[5px]">
                      Attempt
                    </span>
                    <div className="flex items-center justify-center w-[5px] h-[5px] text-white">
                      <FontAwesomeIcon
                        icon={faAngleRight}
                        className="w-[7px] h-[7px]"
                      />
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-[29%]">
          <span className="text-[16px] font-bold mb-[20px]">Newest</span>
          <div className="flex flex-col gap-[20px] w-full mb-[40px]">
            {newest.map((quiz, index) => (
              <div
                className="flex items-center justify-between bg-[#EFF7FF] rounded-[20px] p-[9px] drop-shadow-lg"
                key={index}
              >
                <div className="flex items-center w-[80%]">
                  <div className="w-[80px] h-[80px]  mr-[13px] rounded-[20px]">
                    <img src={zenithLogoDark} alt="" />
                  </div>
                  <div className="flex flex-col w-[1/2]">
                    <div className="text-[15px] font-semibold mb-[5px]">
                      <span>{quiz.quiz_title}</span>
                    </div>
                    <div className="flex">
                      <div className="text-[10px] mr-[5px]">
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
                </div>

                <div className="flex flex-col items-end justify-center gap-[10px] h-full w-[20%] text-gray-700">
                  <button className="flex items-center justify-center cursor-pointer h-[15px] w-[15px] bg-[#FF605C] rounded-full font-bold">
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="h-[7px] w-[7px]"
                    />
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
          <span className="text-[16px] font-bold mb-[20px]">
            Most Attempted
          </span>
          <div className="flex flex-col gap-[20px] w-full">
            {mostAttempted.map((quiz, index) => (
              <div
                className="flex items-center justify-between bg-[#EFF7FF] rounded-[20px] p-[9px] drop-shadow-lg"
                key={index}
              >
                <div className="flex items-center w-[80%]">
                  <div className="w-[80px] h-[80px] mr-[13px] rounded-[20px]">
                    <img src={zenithLogoDark} alt="" />
                  </div>
                  <div className="flex flex-col w-[1/2]">
                    <div className="text-[15px] font-semibold mb-[5px]">
                      <span>{quiz.quiz_title}</span>
                    </div>
                    <div className="flex">
                      <div className="text-[10px] mr-[5px]">
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
                </div>

                <div className="flex flex-col items-end justify-center gap-[10px] h-full w-[20%] text-gray-700">
                  <button className="flex items-center justify-center cursor-pointer h-[15px] w-[15px] bg-[#FF605C] rounded-full font-bold">
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="h-[7px] w-[7px]"
                    />
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
        </div>
      </div>
    </div>
  );
}
