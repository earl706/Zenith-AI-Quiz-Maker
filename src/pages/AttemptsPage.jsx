import React, { useState } from "react";
import AttemptAccuracyDoughnutGraph from "../components/AttemptAccuracyDoughnutGraph";

const attempts = [0, 1, 2].map(() => ({
  quiz_title: "Quiz Title",
  date_created: "2/8/24",
  duration: "8 mins 3 secs",
  ratio: "83/100",
  accuracy: "83%",
  mathematical: 4,
  identification: 4,
}));

const recent_attempts = [
  {
    quiz_title: "Quiz Title",
    date: "2/8/25",
    ratio: "50/50",
    questions: "50/50",
  },
  {
    quiz_title: "Quiz Title",
    date: "2/8/25",
    ratio: "50/50",
    questions: "50/50",
  },
  {
    quiz_title: "Quiz Title",
    date: "2/8/25",
    ratio: "50/50",
    questions: "50/50",
  },
];
const most_accurate_attempts = [
  {
    quiz_title: "Quiz Title",
    date: "2/8/25",
    ratio: "50/50",
    questions: "50/50",
  },
  {
    quiz_title: "Quiz Title",
    date: "2/8/25",
    ratio: "50/50",
    questions: "50/50",
  },
  {
    quiz_title: "Quiz Title",
    date: "2/8/25",
    ratio: "50/50",
    questions: "50/50",
  },
];

export default function AttemptsPage() {
  const [userName, setUsername] = useState("Earl Benedict C. Dumaraog");
  const [userID, setUserID] = useState("2021309235");

  return (
    <>
      <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
        <div className="flex justify-between items-center mb-[40px]">
          <div className="flex justify-between items-center w-[67%]">
            <div className="flex flex-col gap-0">
              <div className="text-[13px]">
                <span className="text-[#6F8055]">Pages / </span>
                <span className="font-semibold">Create Quiz</span>
              </div>
              <span className="text-[#6F8055] text-[40px] font-extrabold">
                Create Quiz
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
          <div className="flex flex-col w-[67%] gap-[20px]">
            {attempts.map((attempt, index) => (
              <div
                className="flex flex-col w-full rounded-[20px] bg-[#EFF7FF] px-[30px] py-[20px] drop-shadow-lg"
                key={index}
              >
                <span className="w-full text-center text-[20px] font-bold mb-[10px]">
                  {attempt.quiz_title}
                </span>
                <div className="flex w-full items-center">
                  <div className="flex flex-col gap-[13px] w-1/2">
                    <div className="flex gap-[30px] items-center text-[16px]">
                      <div className="w-1/2 text-[#646464]">Duration</div>
                      <div className="w-1/2 font-bold">{attempt.duration}</div>
                    </div>
                    <div className="flex gap-[30px] items-center text-[16px]">
                      <div className="w-1/2 text-[#646464]">Ratio</div>
                      <div className="w-1/2 font-bold">{attempt.ratio}</div>
                    </div>
                    <div className="flex gap-[30px] items-center text-[16px]">
                      <div className="w-1/2 text-[#646464]">Percentage</div>
                      <div className="w-1/2 font-bold">{attempt.accuracy}</div>
                    </div>
                    <div className="flex gap-[30px] items-center text-[16px]">
                      <div className="w-1/2 text-[#646464]">Mathematical</div>
                      <div className="w-1/2 font-bold">
                        {attempt.mathematical}
                      </div>
                    </div>
                    <div className="flex gap-[30px] items-center text-[16px]">
                      <div className="w-1/2 text-[#646464]">Identification</div>
                      <div className="w-1/2 font-bold">
                        {attempt.identification}
                      </div>
                    </div>
                    <div className="flex gap-[30px] items-center text-[16px]">
                      <div className="w-1/2 text-[#646464]">Date</div>
                      <div className="w-1/2 font-bold">
                        {attempt.date_created}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-1/2">
                    <div className="w-[250px] h-[250px]">
                      <AttemptAccuracyDoughnutGraph />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col w-[29%]">
            <span className="text-[16px] font-bold mb-[20px]">Most Recent</span>
            <div className="flex flex-col gap-[20px] mb-[20px] w-full">
              {recent_attempts.map((attempt, index) => (
                <div
                  className="flex items-center justify-between h-full bg-[#EFF7FF] rounded-[20px] p-[9px] drop-shadow-lg"
                  key={index}
                >
                  <div className="flex items-center w-[80%]">
                    <div className="w-[80px] h-[80px] bg-gray-300 mr-[13px] rounded-[20px]"></div>
                    <div className="flex flex-col w-[1/2]">
                      <div className="text-[15px] font-semibold mb-[5px]">
                        <span>{attempt.quiz_title}</span>
                      </div>
                      <div className="flex">
                        <div className="text-[10px] mr-[20px]">
                          <div className="flex flex-col font-light gap-[5px]">
                            <span>Date</span>
                            <span>Ratio</span>
                            <span>Questions</span>
                          </div>
                        </div>
                        <div className="text-[10px]">
                          <div className="flex flex-col font-semibold gap-[5px]">
                            <span>{attempt.date}</span>
                            <span>{attempt.ratio}</span>
                            <span>{attempt.questions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center h-full w-[20%] text-gray-700 mr-[9px]">
                    <div className="w-[50px] h-[50px]">
                      <AttemptAccuracyDoughnutGraph />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <span className="text-[16px] font-bold mb-[20px]">
              Most Accurate
            </span>
            <div className="flex flex-col gap-[20px] mb-[20px] w-full">
              {recent_attempts.map((attempt, index) => (
                <div
                  className="flex items-center justify-between h-full bg-[#EFF7FF] rounded-[20px] p-[9px] drop-shadow-lg"
                  key={index}
                >
                  <div className="flex items-center w-[80%]">
                    <div className="w-[80px] h-[80px] bg-gray-300 mr-[13px] rounded-[20px]"></div>
                    <div className="flex flex-col w-[1/2]">
                      <div className="text-[15px] font-semibold mb-[5px]">
                        <span>{attempt.quiz_title}</span>
                      </div>
                      <div className="flex">
                        <div className="text-[10px] mr-[20px]">
                          <div className="flex flex-col font-light gap-[5px]">
                            <span>Date</span>
                            <span>Ratio</span>
                            <span>Questions</span>
                          </div>
                        </div>
                        <div className="text-[10px]">
                          <div className="flex flex-col font-semibold gap-[5px]">
                            <span>{attempt.date}</span>
                            <span>{attempt.ratio}</span>
                            <span>{attempt.questions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center h-full w-[20%] text-gray-700 mr-[9px]">
                    <div className="w-[50px] h-[50px]">
                      <AttemptAccuracyDoughnutGraph />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
