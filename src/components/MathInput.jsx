import React, { useState, useEffect } from "react";
import Latex from "react-latex";

export default function MathInput({
  handleChoicesChange,
  question,
  handleInputChange,
}) {
  const [inputs, setInputs] = useState(["", "", "", ""]);
  const [mathExpressions, setMathExpressions] = useState(["", "", "", ""]);

  const handleMathInputChange = (id, index, e) => {
    const rawInput = e.target.value;
    setInputs(
      inputs.map((input, indx) => (indx === index ? e.target.value : input))
    );

    let formattedExpression = rawInput.replace(/\^/g, "^");
    formattedExpression = formattedExpression.replace(/\*/g, "\\cdot ");
    setMathExpressions(
      mathExpressions.map((mathExpression, indx) =>
        indx === index ? formattedExpression : mathExpression
      )
    );
    handleChoicesChange(id, index, e.target.value);
  };

  return (
    <>
      {question.identification ? (
        <div className="flex flex-row items-center w-full">
          <div className="flex items-center w-[3%] mr-[20px]">
            <button
              className={`transition-all w-[20px] h-[20px] rounded-full bg-[#007AFF] ${
                question.correctAnswerIndex == 0
                  ? "ring-2 ring-offset-3 ring-[#007AFF]"
                  : ""
              }`}
              onClick={() =>
                handleInputChange(question.id, "correctAnswerIndex", 0)
              }
            ></button>
          </div>
          <div className="flex justify-between w-full items-center gap-[20px]">
            <input
              type="text"
              value={question.choices[0]}
              onChange={(e) => {
                handleMathInputChange(question.id, 0, e);
              }}
              placeholder={`Answer`}
              className="text-[12px] text-[#919191] bg-white rounded-full w-1/2 py-[12px] px-[20px]"
            />
            <div className="flex w-1/2 justify-center">
              <Latex>{`$$ ${question.choices[0]} $$`}</Latex>
            </div>
          </div>
        </div>
      ) : (
        [0, 1, 2, 3].map((index) => (
          <div className="flex items-center" key={index}>
            <div className="flex items-center w-[3%] mr-[20px]">
              <button
                className={`transition-all w-[20px] h-[20px] rounded-full bg-[#007AFF] ${
                  question.correctAnswerIndex == index
                    ? "ring-2 ring-offset-3 ring-[#007AFF]"
                    : ""
                }`}
                onClick={() =>
                  handleInputChange(question.id, "correctAnswerIndex", index)
                }
              ></button>
            </div>
            <input
              type="text"
              value={question.choices[index]}
              onChange={(e) =>
                handleChoicesChange(question.id, index, e.target.value)
              }
              placeholder={`Choice ${index + 1}`}
              className="text-[12px] text-[#919191] bg-white rounded-full w-full py-[12px] px-[20px] mr-[20px]"
              required
            />
            <div className="flex w-full justify-center">
              <Latex>{`$$ ${question.choices[index]} $$`}</Latex>
            </div>
            <div className="flex items-center w-[3%]">
              <button
                className="w-[20px] h-[20px] bg-[#FF605C] rounded-full"
                onClick={() => removeChoice(question.id, index)}
              ></button>
            </div>
          </div>
        ))
      )}
    </>
  );
}
