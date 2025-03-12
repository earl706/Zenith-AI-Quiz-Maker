import React, { useState, useEffect } from "react";
import Latex from "react-latex";

export default function IdentificationAnswerInput({
  answer,
  handleIdentificationAnswerChange,
  question,
}) {
  const [input, setInput] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [mathExpressions, setMathExpressions] = useState("");

  const handleMathInputChange = (id, e) => {
    const rawInput = e.target.value;
    setInput(rawInput);

    let formattedExpression = rawInput.replace(/\^/g, "^");
    formattedExpression = formattedExpression.replace(/\*/g, "\\cdot ");
    setMathExpressions(formattedExpression);
    handleIdentificationAnswerChange(id, e.target.value);
  };

  useEffect(() => {}, [mathExpressions]);

  return (
    <>
      {question.question_type == "IDE-COM" ? (
        <div className="flex flex-col items-center w-full p-[30px] bg-[#EFF7FF] rounded-[20px] drop-shadow-lg mb-[20px]">
          <p className="text-[16px] font-extrabold mb-[10px] text-center w-full">
            {question.question}
          </p>
          <div className="flex flex-col w-full">
            <input
              type="text"
              value={answer.userAnswer}
              onChange={(e) => {
                handleMathInputChange(answer.id, e);
              }}
              placeholder="LaTex Answer"
              className={`w-full py-[10px] px-[30px] rounded-full text-[#646464] bg-white font-extrabold transition focus:none mb-[20px]`}
            />
            <div className="flex justify-center w-full">
              <Latex>{`$$ ${answer.userAnswer} $$`}</Latex>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full p-[30px] bg-[#EFF7FF] rounded-[20px] drop-shadow-lg mb-[20px]">
          <p className="text-[16px] font-extrabold mb-[10px] text-center w-full">
            {question.question}
          </p>
          <input
            id={`${0}-${answer.id}`}
            type="text"
            name={`${0}-${answer.id}`}
            value={answer.userAnswer}
            onChange={(event) => {
              handleIdentificationAnswerChange(answer.id, event.target.value);
            }}
            placeholder="Answer"
            className={`w-full py-[10px] px-[30px] rounded-full text-[#646464] bg-white font-extrabold transition focus:none `}
          />
        </div>
      )}
    </>
  );
}
