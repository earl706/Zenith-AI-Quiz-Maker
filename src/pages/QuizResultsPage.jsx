import React from "react";
import IdentificationAnswerInput from "../components/IdentificationAnswerInput";
import MathExpressionEncoder from "../components/MathExpressionEncoder";

export default function QuizResultsPage({
  question,
  answer,
  correct,
  handleIdentificationAnswerChange,
  submittedAnswers,
  index,
}) {
  return (
    <>
      <div
        className={`flex flex-col w-full drop-shadow-md ${
          correct ? "bg-[#F0FFF0]" : "bg-[#FFF0F0]"
        } rounded-[20px] px-[30px] pb-[30px] pt-[20px]`}
      >
        <div className="flex flex-col justify-between w-full">
          <p className="w-full pb-[10px] text-center font-extrabold text-[16px] rounded focus:outline-none focus:ring focus:ring-blue-200">
            {question.question}
          </p>
        </div>
        {question.question_type === "IDE" ||
        question.question_type === "IDE-COM" ? (
          <div
            className={
              correct &&
              question.choices[0] === submittedAnswers[index].correctAnswer
                ? "flex flex-row items-center bg-green-100 rounded-lg"
                : question.choices[0] === submittedAnswers[index].correctAnswer
                ? "flex flex-row items-center bg-green-100 rounded-lg"
                : question.choices[0] === submittedAnswers[index].userAnswer
                ? "flex flex-row items-center bg-red-10 rounded-lg"
                : "flex flex-row items-center rounded-lg"
            }
          >
            <p className="w-full p-2 my-1 text-sm focus:outline-none focus:ring focus:ring-blue-200">
              {question.choices[0]}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {question.choices.map((choice, choice_index) =>
              question.question_type == "MUL-COM" ? (
                <div
                  className={
                    correct && choice === submittedAnswers[index].correctAnswer
                      ? "w-full py-[10px] px-[30] text-center rounded-full text-[#646464] font-extrabold transition bg-[#00CA4E]"
                      : choice === submittedAnswers[index].correctAnswer
                      ? "w-full py-[10px] px-[30] text-center rounded-full text-[#646464] font-extrabold transition bg-[#00CA4E]"
                      : choice === submittedAnswers[index].userAnswer
                      ? "w-full py-[10px] px-[30] text-center rounded-full text-[#646464] font-extrabold transition bg-[#FF605C]"
                      : "w-full py-[10px] px-[30] text-center rounded-full text-[#646464] font-extrabold transition bg-white"
                  }
                  key={choice_index}
                >
                  <div className="flex w-full">
                    <MathExpressionEncoder choice={choice} />
                  </div>
                </div>
              ) : (
                <div
                  className={
                    correct && choice === submittedAnswers[index].correctAnswer
                      ? "w-full py-[10px] px-[30px] rounded-full text-white font-extrabold transition bg-[#00CA4E]"
                      : choice === submittedAnswers[index].correctAnswer
                      ? "w-full py-[10px] px-[30px] rounded-full text-white font-extrabold transition bg-[#00CA4E]"
                      : choice === submittedAnswers[index].userAnswer
                      ? "w-full py-[10px] px-[30px] rounded-full text-white font-extrabold transition bg-[#FF605C]"
                      : "w-full py-[10px] px-[30px] rounded-full text-[#646464] font-extrabold transition bg-white"
                  }
                  key={choice_index}
                >
                  {/* <p className="w-full p-2 my-1 text-sm rounded focus:outline-none focus:ring focus:ring-blue-200"> */}
                  {choice}
                  {/* </p> */}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}
