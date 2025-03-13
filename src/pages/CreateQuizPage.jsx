import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import MathInput from "../components/MathInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEdit,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Header from "../components/Header";
import LoadingComponent from "../components/LoadingComponent";

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
  const { createQuiz, setQuizzes, quizzes, generateQuiz } =
    useContext(AuthContext);
  const navigate = useNavigate();
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

  const handleQuizTitleChange = (event) => {
    const newTitle = event.target.value;
    setQuizTitleInput(newTitle);
  };

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

  const updateQuizTitle = (event) => {
    event.preventDefault();
    setQuizTitle(quizTitleInput);
    setEditQuizTitle(false);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const quiz = {
        tag_color: selectedColor,
        quiz_title: quizTitle,
        public: false,
        questions: questions,
        randomQuestions: randomQuestionOrder,
        quizType: quizType,
      };

      const createquiz_response = await createQuiz(quiz, questions);
      if (
        createquiz_response.status == 200 ||
        createquiz_response.statusText == "OK"
      ) {
        navigate(`/quizzes/${createquiz_response.data.quiz.quiz_id}`);
        setQuizzes([...quizzes, createquiz_response.data.quiz]);
      }
      setLoading(false);
      return createquiz_response;
    } catch (err) {
      setLoading(false);
      return err;
    }
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

  useEffect(() => {}, [quizTitle]);

  return (
    <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
      <Header page={"Create Quiz"} />

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
                  className="flex justify-center items-center w-[20px] h-[20px] bg-[#FF605C] rounded-full cursor-pointer"
                  onClick={() => removeQuestion(question.id)}
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="h-[8px] w-[8px] text-black"
                  />
                </button>
              </div>
              <input
                type="text"
                value={question.title}
                onChange={(e) =>
                  handleInputChange(question.id, "title", e.target.value)
                }
                className="text-[12px] text-[#919191] bg-white rounded-full w-full py-[12px] px-[20px] mb-[20px]"
                placeholder="Question"
              />
              <div className="mb-[20px]">
                <span className="text-[16px] font-bold">Choices</span>
              </div>
              <div className="flex justify-between gap-[20px] mb-[30px]">
                <button
                  className={`transition-all cursor-pointer flex items-center font-bold text-[10px] px-[3px] text-white rounded-full h-[21px] w-full ${
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
                  className={`transition-all cursor-pointer flex items-center font-bold text-[10px] px-[3px] text-white rounded-full h-[21px] w-full ${
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
                    question.identification
                      ? "bg-gray-300"
                      : question.randomChoices
                      ? "bg-[#00CA4E] cursor-pointer"
                      : "bg-[#FF605C] cursor-pointer"
                  }`}
                  onClick={() =>
                    handleInputChange(
                      question.id,
                      "randomChoices",
                      !question.randomChoices
                    )
                  }
                  disabled={question.identification}
                >
                  <div className="h-[15px] w-[15px] bg-white rounded-full mr-[5px]"></div>
                  <span>Random Choices</span>
                </button>
              </div>
              <div className="flex flex-col gap-[10px] mb-[20px]">
                {question.mathematical ? (
                  <MathInput
                    handleChoicesChange={handleChoicesChange}
                    handleInputChange={handleInputChange}
                    question={question}
                  />
                ) : question.identification ? (
                  <div className="flex items-center">
                    <div className="flex items-center w-[3%] mr-[20px]">
                      <button
                        className={`transition-all w-[20px] h-[20px] rounded-full bg-[#007AFF] ${
                          question.correctAnswerIndex == 0
                            ? "ring-2 ring-offset-3 ring-[#007AFF]"
                            : ""
                        }`}
                        onClick={() =>
                          handleInputChange(
                            question.id,
                            "correctAnswerIndex",
                            0
                          )
                        }
                      ></button>
                    </div>
                    <input
                      type="text"
                      value={question.choices[0]}
                      onChange={(e) =>
                        handleChoicesChange(question.id, 0, e.target.value)
                      }
                      placeholder={`Answer`}
                      className="text-[12px] text-[#919191] bg-white rounded-full w-full py-[12px] px-[20px] mr-[20px]"
                      required
                    />
                  </div>
                ) : (
                  question.choices.map((choice, choice_index) => (
                    <div className="flex items-center" key={choice_index}>
                      <div className="flex items-center w-[3%] mr-[20px]">
                        <button
                          className={`cursor-pointer transition-all w-[20px] h-[20px] rounded-full bg-[#007AFF] ${
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
                          className="flex items-center justify-center w-[20px] h-[20px] bg-[#FF605C] rounded-full cursor-pointer"
                          onClick={() =>
                            removeChoice(question.id, choice_index)
                          }
                        >
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="h-[8px] w-[8px] text-black"
                          />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                className="flex items-center justify-center w-full bg-[#00CA4E] h-[20px] rounded-full mb-[20px] cursor-pointer hover:bg-[#00AA1E] transition-all"
                onClick={() => addChoice(question.id)}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  className="h-[8px] w-[8px] text-white"
                />
              </button>
            </div>
          ))}
          <button
            className={`flex justify-center items-center w-full bg-[#00CA4E] rounded-full h-[30px] cursor-pointer hover:bg-[#00AA1E] transition-all`}
            onClick={addQuestion}
          >
            <FontAwesomeIcon
              icon={faPlus}
              className="h-[10px] w-[10px] text-white"
            />
          </button>
        </div>
        <div className="flex flex-col w-[29%]">
          <span className="text-[16px] font-bold mb-[10px]">Quiz Title</span>
          <button
            className={`flex items-center mb-[10px] w-full ${
              editQuizTitle ? "bg-[#00CA4E]" : "bg-[#EFF7FF]"
            } rounded-full p-[5px] h-[40px] transition-all`}
          >
            <div
              className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white mr-[10px] cursor-pointer"
              onClick={() => {
                if (!editQuizTitle) {
                  setQuizTitleInput(quizTitle);
                } else {
                  setQuizTitleInput("");
                }
                setEditQuizTitle(!editQuizTitle);
              }}
            >
              {editQuizTitle ? (
                <FontAwesomeIcon
                  icon={faXmark}
                  className="h-[12px] w-[12px] text-black transition-all"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faEdit}
                  className="h-[12px] w-[12px] text-black transition-all"
                />
              )}
            </div>
            {editQuizTitle ? (
              <form
                onSubmit={updateQuizTitle}
                className="flex items-center justify-between w-[87%]"
              >
                <input
                  type="text"
                  value={quizTitleInput}
                  onChange={(event) => handleQuizTitleChange(event)}
                  className={`font-bold text-[12px] ${
                    editQuizTitle ? "text-white" : "text-black"
                  }`}
                />
                <button
                  type="submit"
                  className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white cursor-pointer"
                >
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="h-[12px] w-[12px] text-black"
                  />
                </button>
              </form>
            ) : (
              <span
                className={`font-bold text-[12px] ${
                  editQuizTitle ? "text-white" : "text-black"
                }`}
              >
                {quizTitle}
              </span>
            )}
          </button>
          <button
            onClick={handleCreateQuiz}
            className="flex cursor-pointer w-full h-[40px] justify-center items-center text-white font-bold rounded-full bg-[#00CA4E] hover:bg-[#00AA1E] transition-all mb-[30px]"
          >
            {loading ? (
              <div className="flex justify-center items-center w-full">
                <LoadingComponent size={12} light={false} />
              </div>
            ) : (
              <span className="text-[14px]">Create Quiz</span>
            )}
          </button>
          <span className="text-[16px] font-bold mb-[10px]">
            AI-Quiz Generate
          </span>
          <input
            type="text"
            placeholder="Topic"
            className="w-full h-[40x] py-[12px] px-[17px] rounded-full bg-[#EFF7FF] text-[#919191] text-[12px] mb-[10px] font-bold"
          />
          <input
            type="number"
            name=""
            id=""
            placeholder="Number of Questions"
            className="w-full h-[40x] py-[12px] px-[17px] rounded-full bg-[#EFF7FF] text-[#919191] text-[12px] mb-[10px] font-bold"
          />
          <button className="flex cursor-pointer w-full h-[30px] justify-center items-center text-white font-bold rounded-full bg-[#00CA4E] hover:bg-[#00AA1E] transition-all mb-[30px]">
            <span className="text-[14px]">Generate</span>
          </button>

          <span className="text-[16px] font-bold mb-[10px]">Options</span>
          <div className="flex flex-col gap-[10px] mb-[20px]">
            <button
              className={`flex items-center w-full ${
                randomQuestionOrder ? "bg-[#00CA4E]" : "bg-[#FF605C]"
              } rounded-full p-[5px] h-[30px] transition-all cursor-pointer`}
              onClick={() => setRandomQuestionOrder(!randomQuestionOrder)}
            >
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className={"font-bold text-[12px] text-white"}>
                Randomize Questions
              </span>
            </button>
            <button
              className={`flex items-center w-full ${
                randomQuestionChoices ? "bg-[#00CA4E]" : "bg-[#FF605C]"
              } rounded-full p-[5px] h-[30px] cursor-pointer`}
              onClick={() => {
                setRandomQuestionChoices(!randomQuestionChoices);
                randomizeQuestionChoices(!randomQuestionChoices);
              }}
            >
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">
                Randomize Choices
              </span>
            </button>
          </div>
          <span className="text-[16px] font-bold mb-[10px]">Quiz Type</span>
          <div className="flex flex-col gap-[10px] mb-[20px]">
            <button
              className={`flex items-center w-full ${
                quizType == "flashcard" ? "bg-[#FF605C]" : "bg-[#00CA4E]"
              } rounded-full p-[5px] h-[30px] transition-all cursor-pointer`}
              onClick={() => setQuizType("list")}
            >
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">List</span>
            </button>
            <button
              className={`flex items-center w-full ${
                quizType == "list" ? "bg-[#FF605C]" : "bg-[#00CA4E]"
              } rounded-full p-[5px] h-[30px] transition-all cursor-pointer`}
              onClick={() => setQuizType("flashcard")}
            >
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">
                Flashcard
              </span>
            </button>
          </div>
          <span className="text-[16px] font-bold mb-[10px]">Quiz Type</span>
          <div className="grid grid-cols-5 gap-[10px] mb-[20px]">
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
                  className={`w-[20px] h-[20px] rounded-full flex items-center justify-center transition-all ${
                    selectedColor === color.hex
                      ? "ring-2 ring-offset-2 ring-[#6F8055]"
                      : ""
                  }`}
                  style={{ backgroundColor: color.hex }}
                ></span>
              </label>
            ))}
          </div>
          <span className="text-[16px] font-bold mb-[10px]">Layout</span>
          <div className="flex flex-col gap-[10px] mb-[20px]">
            <button
              className={`flex cursor-pointer items-center w-full ${
                view == "grid" ? "bg-[#FF605C]" : "bg-[#00CA4E]"
              } rounded-full p-[5px] h-[30px] transition-all`}
              onClick={() => setView("list")}
            >
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">List</span>
            </button>
            <button
              className={`flex cursor-pointer items-center w-full ${
                view == "list" ? "bg-[#FF605C]" : "bg-[#00CA4E]"
              } rounded-full p-[5px] h-[30px] transition-all`}
              onClick={() => setView("grid")}
            >
              <div className="w-[20px] h-[20px] rounded-full bg-white mr-[10px]"></div>
              <span className="font-bold text-[12px] text-white">Grid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
