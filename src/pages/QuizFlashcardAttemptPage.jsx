import React, { useEffect, useState } from "react";
import IdentificationAnswerInput from "../components/IdentificationAnswerInput";
import Latex from "react-latex";

export default function QuizFlashcardAttemptPage({
  questionsParam,
  submitAnswers,
  handleAnswerChange,
  handleIdentificationAnswerChange,
  answers,
}) {
  const [questions, setQuestions] = useState([]);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [question, setQuestion] = useState({
    title: "",
    choices: ["", "", "", ""],
    correctAnswerIndex: 0,
    mathematical: false,
    identification: false,
    randomChoices: false,
  });

  const handleNext = () => {
    setQuestionNumber((prev) => (prev + 1) % questionsParam.length);
  };

  const handlePrev = () => {
    setQuestionNumber(
      (prev) => (prev - 1 + questionsParam.length) % questionsParam.length
    );
  };

  const answer = answers.find((a) => a.id === question.id);

  useEffect(() => {
    setQuestions(questionsParam);
  }, []);

  useEffect(() => {
    setQuestion(questionsParam[questionNumber]);
  }, [questionNumber]);

  return (
    <>
      <div className="flex flex-col w-full bg-white rounded-[10px] py-4 px-6">
        <div className="flex flex-col justify-center gap-[10px] mb-[20px]">
          <div className="flex w-full gap-[20px]">
            <button
              onClick={handlePrev}
              className="cursor-pointer w-1/2 p-[10px] text-white bg-[#3C6B9F] rounded-full hover:bg-[#1A497D] transition-all text-[16px] font-extrabold"
            >
              Prev
            </button>
            <button
              onClick={handleNext}
              className="cursor-pointer w-1/2 p-[10px] text-white bg-[#3C6B9F] rounded-full hover:bg-[#1A497D] transition-all text-[16px] font-extrabold"
            >
              Next
            </button>
          </div>
          <button
            onClick={submitAnswers}
            className="cursor-pointer w-full p-[10px] text-white bg-[#00CA4E] rounded-full hover:bg-[#00AA2E] transition-all text-[16px] font-extrabold"
          >
            Submit
          </button>
        </div>
        {question.question_type === "IDE" ||
        question.question_type === "IDE-COM" ? (
          <>
            <IdentificationAnswerInput
              answer={answer}
              question={question}
              handleIdentificationAnswerChange={
                handleIdentificationAnswerChange
              }
            />
          </>
        ) : (
          <div className="flex flex-col items-center w-full p-[30px] bg-[#EFF7FF] rounded-[20px] drop-shadow-lg mb-[20px]">
            <p className="text-[16px] font-extrabold mb-[10px] text-center w-full">
              {questionsParam[questionNumber].question}
            </p>
            <div className="flex flex-col w-full gap-[10px]">
              {questionsParam[questionNumber].choices.map((choice, index) =>
                questionsParam[questionNumber].question_type == "MUL-COM" ? (
                  <button
                    key={index}
                    onClick={() => {
                      handleAnswerChange(question.id, "userAnswer", choice);
                    }}
                    className={`cursor-pointer w-full py-[10px] px-[30] text-center rounded-full text-[#646464] font-extrabold transition ${
                      answers[questionNumber].userAnswer === choice
                        ? "bg-[#007AFF] text-white"
                        : "bg-white hover:bg-[#007AFF] hover:text-white"
                    }`}
                  >
                    <Latex>{`$$ ${choice} $$`}</Latex>
                  </button>
                ) : (
                  <button
                    key={index}
                    onClick={() => {
                      handleAnswerChange(question.id, "userAnswer", choice);
                    }}
                    className={`cursor-pointer w-full py-[10px] px-[30] text-center rounded-full text-[#646464] font-extrabold transition ${
                      answers[questionNumber].userAnswer === choice
                        ? "bg-[#007AFF] text-white"
                        : " bg-white  hover:bg-[#007AFF] hover:text-white"
                    }`}
                  >
                    {choice}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
