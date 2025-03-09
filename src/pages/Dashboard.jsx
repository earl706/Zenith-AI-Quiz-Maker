import React, { useEffect } from "react";

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
  useEffect(() => {
    console.log(quizList);
  }, []);

  return (
    <div className="px-[30px] pt-[18px] pb-[30px]">
      <div className="flex justify-between items-center mb-[40px]">
        <div className="flex flex-col gap-0">
          <div className="text-[13px]">
            <span className="text-[#A0A0A0]">Pages / </span>
            <span>Dashboard</span>
          </div>
          <span className="text-[#3C6B9F] text-[40px] font-extrabold">
            Dashboard
          </span>
        </div>
        <div className="flex justify-end gap-[20px]">
          <div className="h-[35px] w-[35px] bg-gray-300 rounded-full"></div>
          <div className="h-[35px] w-[35px] bg-gray-300 rounded-full"></div>
        </div>
        <div className="flex justify-end gap-[12px]">
          <div className="flex flex-col justify-start items-end">
            <span className="text-[13px]">Earl Benedict C. Dumaraog</span>
            <span className="text-[10px] text-[#A1A1A1]">2021309235</span>
          </div>
          <div className="h-[40px] w-[40px] bg-gray-300 rounded-full"></div>
        </div>
      </div>

      <div className="flex items-center mb-[40px]">
        <span className="text-[15px] font-semibold mr-[40px]">Filter by:</span>
        <div className="flex gap-[40px]">
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
              Attempts
            </span>
            <div className="h-[13px] w-[13px] bg-white"></div>
          </button>
          <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
            <span className="font-semibold text-[12px] mr-[5px] text-[#364656]">
              Mathematical
            </span>
            <div className="h-[13px] w-[13px] bg-white"></div>
          </button>
          <button className="flex items-center justify-center px-[15px] py-[10px] bg-[#EFF7FF] rounded-full cursor-pointer">
            <span className="font-semibold text-[12px] mr-[5px] text-[#364656]">
              Identification
            </span>
            <div className="h-[13px] w-[13px] bg-white"></div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[20px] mb-[30px]">
        {quizList.map((quiz, index) => (
          <div
            className="flex items-center  bg-[#EFF7FF] rounded-[20px] p-[10px] drop-shadow-lg"
            key={index}
          >
            <div className="w-[80px] h-[80px] bg-gray-300 mr-[15px] rounded-[20px]"></div>
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
                    <span>{quiz.questions}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between h-full w-[16%]">
              <div className="h-[25px] w-[25px] bg-[#FF605C] rounded-full"></div>
              <div className="h-[25px] w-[25px] bg-[#FFBD44] rounded-full"></div>
              <div className="h-[25px] w-[25px] bg-[#00CA4E] rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full text-center text-[13px] mb-[50px]">
        <span className="cursor-pointer hover:underline transition-all">
          View All Quizzes
        </span>
      </div>
      <div className="grid grid-cols-3 gap-[20px]">
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
                <div className="w-[15px] h-[15px] rounded-full bg-gray-300 mr-[5px]"></div>
                <span className="font-bold text-[12px]">
                  {attempt.duration}
                </span>
              </div>
              <div className="flex items-center justify-start">
                <div className="w-[15px] h-[15px] rounded-full bg-gray-300 mr-[5px]"></div>
                <span className="font-bold text-[12px]">{attempt.ratio}</span>
              </div>
              <div className="flex items-center justify-start">
                <div className="w-[15px] h-[15px] rounded-full bg-gray-300 mr-[5px]"></div>
                <span className="font-bold text-[12px]">
                  {attempt.accuracy}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end w-1/2">
              <div className="w-[100px] h-[100px] bg-gray-300 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
