import {
  faAnglesRight,
  faUpDownLeftRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

export default function QuizzesPage() {
  const [userName, setUsername] = useState("Earl Benedict C. Dumaraog");
  const [userID, setUserID] = useState("2021309235");

  const newest = [0, 1, 2].map(() => ({
    quiz_title: "Quiz Title",
    date_created: "2/8/24",
    questions: 25,
    attempts: 21,
  }));

  const most_attempted = [0, 1, 2].map(() => ({
    quiz_title: "Quiz Title",
    date_created: "2/8/24",
    questions: 25,
    attempts: 21,
  }));

  const quizList = [0, 1, 2].map(() => ({
    tag_color: "#00CA4E",
    quiz_title: "Quiz Title",
    date_created: "December 28, 1928",
    flashcard: true,
    public: false,
    random_question_order: false,
    attempts: 23,
  }));

  return (
    <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
      <div className="flex justify-between items-center mb-[40px]">
        <div className="flex justify-between items-center w-[67%]">
          <div className="flex flex-col gap-0">
            <div className="text-[13px]">
              <span className="text-[#A0A0A0]">Pages / </span>
              <span>Quizzes</span>
            </div>
            <span className="text-[#3C6B9F] text-[40px] font-extrabold">
              Quizzes
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

      <div className="flex gap-[40px]">
        <div className="flex flex-col w-[67%]">
          <div className="flex items-center justify-between mb-[35px]">
            <span className="text-[15px] font-semibold mr-[40px]">
              Filter by:
            </span>
            <div className="flex justify-between gap-[20px] w-[84%]">
              <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
                <span className="font-semibold text-[12px] mr-[5px] text-[#364656]">
                  Time
                </span>
                <div className="h-[13px] w-[13px] bg-white"></div>
              </button>
              <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
                <span className="font-semibold text-[12px] mr-[5px] text-[#364656]">
                  Questions
                </span>
                <div className="h-[13px] w-[13px] bg-white"></div>
              </button>
              <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
                <span className="font-semibold text-[12px] mr-[5px] text-[#364656]">
                  Type
                </span>
                <div className="h-[13px] w-[13px] bg-white"></div>
              </button>
              <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
                <span className="font-semibold text-[12px] mr-[5px] text-[#364656]">
                  Mathematical
                </span>
                <div className="h-[13px] w-[13px] bg-white"></div>
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-[20px]">
            {quizList.map((quiz, index) => (
              <div
                className="flex items-center justify-between bg-[#EFF7FF] rounded-[20px] p-[20px] drop-shadow-lg"
                key={index}
              >
                <div className="w-[210px] h-[210px] bg-gray-300 mr-[20px] rounded-[20px]"></div>
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
                          {quiz.date_created}
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
                  <button className="cursor-pointer flex items-center w-full px-[10px] py-[3px] rounded-full bg-[#00CA4E] hover:bg-[#00CA4E]">
                    <span className="font-bold text-[12px] text-white text-center">
                      Attempt
                    </span>
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
                  <div className="w-[80px] h-[80px] bg-gray-300 mr-[13px] rounded-[20px]"></div>
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
                          <span>{quiz.date_created}</span>
                          <span>{quiz.questions}</span>
                          <span>{quiz.attempts}</span>
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
            {most_attempted.map((quiz, index) => (
              <div
                className="flex items-center justify-between bg-[#EFF7FF] rounded-[20px] p-[9px] drop-shadow-lg"
                key={index}
              >
                <div className="flex items-center w-[80%]">
                  <div className="w-[80px] h-[80px] bg-gray-300 mr-[13px] rounded-[20px]"></div>
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
                          <span>{quiz.date_created}</span>
                          <span>{quiz.questions}</span>
                          <span>{quiz.attempts}</span>
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
