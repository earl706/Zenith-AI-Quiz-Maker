import React, { useState, useEffect } from "react";
import Latex from "react-latex";

export default function MathInput() {
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

  return <div></div>;
}
