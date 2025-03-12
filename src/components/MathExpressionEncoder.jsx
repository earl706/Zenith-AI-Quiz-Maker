import React, { useState, useEffect } from "react";
import Latex from "react-latex";

export default function MathExpressionEncoder({ choice }) {
  const [mathExpression, setMathExpression] = useState("");

  const initializeMathExpression = () => {
    let formattedExpression = choice.replace(/\^/g, "^");
    formattedExpression = formattedExpression.replace(/\*/g, "\\cdot ");
    setMathExpression(formattedExpression);
  };

  return (
    <>
      <div className="w-full p-2 text-sm rounded focus:outline-none focus:ring focus:ring-blue-200 mb-2">
        <Latex>{`$$${choice}$$`}</Latex>
      </div>
    </>
  );
}
