import React, { useState, useEffect } from "react";

const colors = [
  { name: "Red", hex: "#EF4444" },
  { name: "Green", hex: "#10B981" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Orange", hex: "#F97316" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Emerald", hex: "#50C878" },
];

export default function CreateQuizPage() {
  const [userName, setUsername] = useState("Earl Benedict C. Dumaraog");
  const [userID, setUserID] = useState("2021309235");
  const [topic, setTopic] = useState("");
  const [questionNumber, setQuestionNumber] = useState(5);
  const [loading, setLoading] = useState(false);
  const [randomQuestionOrder, setRandomQuestionOrder] = useState(false);
  const [randomQuestionChoices, setRandomQuestionChoices] = useState(false);
  const [view, setView] = useState("list");
  const [quizType, setQuizType] = useState("list");
  const [quizTitle, setQuizTitle] = useState("Quiz Title");
  const [quizTitleInput, setQuizTitleInput] = useState(quizTitle);
  const [editQuizTitle, setEditQuizTitle] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0].hex);
  const [questions, setQuestions] = useState([
    {
      id: 1,
      title: "",
      choices: ["", "", "", ""],
      correctAnswerIndex: 0,
      mathematical: false,
      identification: false,
      randomChoices: false,
    },
  ]);

  const handleInputChange = (id, field, value) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id ? { ...question, [field]: value } : question
    );
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (questionID) => {
    const updatedQuestions = questions.filter(
      (question) => question.id !== questionID
    );

    setQuestions(updatedQuestions);
  };

  const removeChoice = (id, index) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id
        ? {
            ...question,
            choices: question.choices.filter((choice, indx) => indx !== index),
          }
        : question
    );

    setQuestions(updatedQuestions);
  };

  const addChoice = (id) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id
        ? {
            ...question,
            choices: question.choices.concat(""),
          }
        : question
    );

    setQuestions(updatedQuestions);
  };

  const handleChoicesChange = (id, index, value) => {
    const updatedQuestions = questions.map((question) =>
      question.id === id
        ? {
            ...question,
            choices: question.choices.map((choice, indx) =>
              indx === index ? value : choice
            ),
          }
        : question
    );

    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    const updatedQuestions = randomQuestionChoices
      ? [
          ...questions,
          {
            id: questions.length + 1,
            title: "",
            choices: ["", "", "", ""],
            correctAnswerIndex: 0,
            mathematical: false,
            identification: false,
            randomChoices: true,
          },
        ]
      : [
          ...questions,
          {
            id: questions.length + 1,
            title: "",
            choices: ["", "", "", ""],
            correctAnswerIndex: 0,
            mathematical: false,
            identification: false,
            randomChoices: false,
          },
        ];
    setQuestions(updatedQuestions);
  };

  const randomizeQuestionChoices = (randomize) => {
    const updatedQuestions = questions.map((question) =>
      randomize
        ? {
            ...question,
            randomChoices: true,
          }
        : {
            ...question,
            randomChoices: false,
          }
    );
    setQuestions(updatedQuestions);
  };

  useEffect(() => {}, [questions, selectedColor]);

  return (
    <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
      <div className="flex justify-between items-center mb-[40px]">
        <div className="flex justify-between items-center w-[67%]">
          <div className="flex flex-col gap-0">
            <div className="text-[13px]">
              <span className="text-[#A0A0A0]">Pages / </span>
              <span>Create Quiz</span>
            </div>
            <span className="text-[#3C6B9F] text-[40px] font-extrabold">
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
        <div className="flex flex-col w-[67%]">
          {questions.map((question, index) => (
            <div
              className="w-full bg-[#EFF7FF] rounded-[20px] p-[20px] drop-shadow-lg mb-[20px]"
              key={index}
            >
              <div className="flex justify-between items-center w-full mb-[20px]">
                <span className="text-[16px] font-bold">{`Question ${question.id}`}</span>
                <button
                  className="w-[20px] h-[20px] bg-[#FF605C] rounded-full"
                  onClick={() => removeQuestion(question.id)}
                ></button>
              </div>
              <input
                type="text"
                className="text-[12px] text-[#919191] bg-white rounded-full w-full py-[12px] px-[20px] mb-[20px]"
                placeholder="Question"
              />
              <div className="mb-[20px]">
                <span className="text-[16px] font-bold">Choices</span>
              </div>
              <div className="flex flex-col gap-[10px] mb-[20px]">
                {question.choices.map((choice, choice_index) => (
                  <div className="flex items-center" key={choice_index}>
                    <div className="flex items-center w-[3%] mr-[20px]">
                      <button
                        className={`transition-all w-[20px] h-[20px] rounded-full bg-[#007AFF] ${
                          question.correctAnswerIndex == choice_index
                            ? "ring-2 ring-offset-3 ring-[#007AFF]"
                            : ""
                        }`}
                        onClick={() =>
                          handleInputChange(
                            question.id,
                            "correctAnswerIndex",
                            choice_index
                          )
                        }
                      ></button>
                    </div>
                    <input
                      type="text"
                      value={question.choices[choice_index]}
                      onChange={(e) =>
                        handleChoicesChange(
                          question.id,
                          choice_index,
                          e.target.value
                        )
                      }
                      placeholder={`Choice ${choice_index + 1}`}
                      className="text-[12px] text-[#919191] bg-white rounded-full w-full py-[12px] px-[20px] mr-[20px]"
                      required
                    />
                    <div className="flex items-center w-[3%]">
                      <button
                        className="w-[20px] h-[20px] bg-[#FF605C] rounded-full"
                        onClick={() => removeChoice(question.id, choice_index)}
                      ></button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="w-full bg-[#00CA4E] h-[20px] rounded-full mb-[20px]"
                onClick={() => addChoice(question.id)}
              ></button>
              <div className="flex justify-between gap-[20px]">
                <button
                  className={`transition-all flex items-center font-bold text-[10px] px-[3px] text-white rounded-full h-[21px] w-full ${
                    question.mathematical ? "bg-[#00CA4E]" : "bg-[#FF605C]"
                  }`}
                  onClick={() =>
                    handleInputChange(
                      question.id,
                      "mathematical",
                      !question.mathematical
                    )
                  }
                >
                  <div className="h-[15px] w-[15px] bg-white rounded-full mr-[5px]"></div>
                  <span>Mathematical</span>
                </button>
                <button
                  className={`transition-all flex items-center font-bold text-[10px] px-[3px] text-white rounded-full h-[21px] w-full ${
                    question.identification ? "bg-[#00CA4E]" : "bg-[#FF605C]"
                  }`}
                  onClick={() =>
                    handleInputChange(
                      question.id,
                      "identification",
                      !question.identification
                    )
                  }
                >
                  <div className="h-[15px] w-[15px] bg-white rounded-full mr-[5px]"></div>
                  <span>Identification</span>
                </button>
                <button
                  className={`transition-all flex items-center font-bold text-[10px] px-[3px] text-white rounded-full h-[21px] w-full ${
                    question.randomChoices ? "bg-[#00CA4E]" : "bg-[#FF605C]"
                  }`}
                  onClick={() =>
                    handleInputChange(
                      question.id,
                      "randomChoices",
                      !question.randomChoices
                    )
                  }
                >
                  <div className="h-[15px] w-[15px] bg-white rounded-full mr-[5px]"></div>
                  <span>Random Choices</span>
                </button>
              </div>
            </div>
          ))}
          <button
            className="w-full bg-[#00CA4E] rounded-full h-[30px]"
            onClick={addQuestion}
          ></button>
        </div>
        <div className="flex flex-col w-[29%]">
          <span className="text-[16px] font-bold mb-[10px]">Options</span>
          <div className="flex flex-col gap-[10px] mb-[20px]">
            <div className="flex items-center w-full bg-[#00CA4E] rounded-full p-[5px] h-[30px]">
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">
                Randomize Questions
              </span>
            </div>
            <div className="flex items-center w-full bg-[#00CA4E] rounded-full p-[5px] h-[30px]">
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">
                Randomize Choices
              </span>
            </div>
          </div>
          <span className="text-[16px] font-bold mb-[10px]">Quiz Type</span>
          <div className="flex flex-col gap-[10px] mb-[20px]">
            <div className="flex items-center w-full bg-[#00CA4E] rounded-full p-[5px] h-[30px]">
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">List</span>
            </div>
            <div className="flex items-center w-full bg-[#00CA4E] rounded-full p-[5px] h-[30px]">
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">
                Flashcard
              </span>
            </div>
          </div>
          <span className="text-[16px] font-bold mb-[10px]">Quiz Type</span>
          <div className="grid grid-cols-5 gap-[10px]">
            {colors.map((color) => (
              <label key={color.hex} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={color.hex}
                  checked={selectedColor === color.hex}
                  onChange={() => setSelectedColor(color.hex)}
                  className="hidden"
                />
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    selectedColor === color.hex
                      ? "ring-1 ring-offset-2 ring-gray-900"
                      : ""
                  }`}
                  style={{ backgroundColor: color.hex }}
                ></span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
