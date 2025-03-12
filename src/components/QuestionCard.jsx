import React, { useEffect } from "react";
import IdentificationAnswerInput from "./IdentificationAnswerInput";

export default function QuestionCard({
  question,
  answers,
  handleAnswerChange,
  handleIdentificationAnswerChange,
}) {
  const answer = answers.find((a) => a.id === question.id);
  useEffect(() => {}, []);

  return (
    <>
      {question.question_type === "IDE" ||
      question.question_type === "IDE-COM" ? (
        <IdentificationAnswerInput
          answer={answer}
          question={question}
          handleIdentificationAnswerChange={handleIdentificationAnswerChange}
        />
      ) : (
        <div className="flex flex-col items-center w-full p-[30px] bg-[#EFF7FF] rounded-[20px] drop-shadow-lg mb-[20px]">
          <p className="text-lg font-semibold mb-2">{question.question}</p>
          <div className="flex flex-col w-full gap-[10px]">
            {question.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => {
                  handleAnswerChange(question.id, "userAnswer", choice);
                }}
                className={`cursor-pointer w-full py-[10px] px-[30] text-center rounded-full text-[#646464] font-extrabold transition ${
                  answer.userAnswer === choice
                    ? "bg-[#007AFF] text-white"
                    : "bg-white hover:bg-[#007AFF] hover:text-white"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
