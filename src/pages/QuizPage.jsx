import React, { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import { AuthContext } from "../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import AttemptAccuracyDoughnutGraph from "../components/AttemptAccuracyDoughnutGraph";

export default function QuizPage() {
  const { getQuiz, deleteMode, setDeleteMode, quizDeleteData, getQuizSummary } =
    useContext(AuthContext);
  const url_params = useParams();
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizData, setQuizData] = useState({
    quiz_id: null,
    owner: null,
    tag_color: "",
    quiz_title: "",
    questions: [],
    date_created: null,
    public: false,
    random_question_order: false,
    flashcard_quiz: false,
    attempts: [],
  });

  const navigate = useNavigate();
  const quiz_id = useParams().id;

  const initializeQuizData = async () => {
    try {
      const quizdata_response = await getQuiz(quiz_id);
      setQuizData(quizdata_response.data.data);
      setQuestions(Array.from(quizdata_response.data.questions));
      setAttempts(Array.from(quizdata_response.data.attempts));
      return quizdata_response;
    } catch (err) {
      return err;
    }
  };

  const closeDeleteConfirmationModal = () => {
    setDeleteMode(false);
  };

  useEffect(() => {
    initializeQuizData();
  }, [quiz_id]);

  return (
    <>
      <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
        <Header page={"Quiz"} />
        <div className="flex gap-[40px]">
          <div className="flex flex-col w-[67%]">
            <span className="w-full text-center text-[30px] font-extrabold mb-[20px]">
              {quizData.quiz_title}
            </span>
            <div className="flex flex-col gap-[10px] w-full rounded-[20px] bg-[#EFF7FF] p-[20px] drop-shadow-lg mb-[20px]">
              <div className="w-full bg-white rounded-full flex items-center p-[10px]">
                <div className="w-[19px] h-[19px] bg-[#34C759] rounded-full mr-[10px]"></div>
                <span className="text-[14px] w-[95px] font-semibold text-[#646464]">
                  Tag Color
                </span>
                <div
                  className="w-[19px] h-[19px] rounded-full mr-[5px]"
                  style={{ backgroundColor: quizData.tag_color }}
                ></div>
                <span className="font-bold text-[16px] text-[#646464]">
                  {quizData.tag_color}
                </span>
              </div>
              <div className="w-full bg-white rounded-full flex items-center p-[10px]">
                <div className="w-[19px] h-[19px] bg-[#34C759] rounded-full mr-[10px]"></div>
                <span className="text-[14px] w-[95px] font-semibold text-[#646464]">
                  Type
                </span>
                <span className="font-bold text-[16px] text-[#646464]">
                  {quizData.flashcard_quiz ? "Flashcard" : "List"}
                </span>
              </div>
              <div className="w-full bg-white rounded-full flex items-center p-[10px]">
                <div className="w-[19px] h-[19px] bg-[#34C759] rounded-full mr-[10px]"></div>
                <span className="text-[14px] w-[95px] font-semibold text-[#646464]">
                  Visibility
                </span>
                <span className="font-bold text-[16px] text-[#646464]">
                  {quizData.public ? "Public" : "Private"}
                </span>
              </div>
              <div className="w-full bg-white rounded-full flex items-center p-[10px]">
                <div className="w-[19px] h-[19px] bg-[#34C759] rounded-full mr-[10px]"></div>
                <span className="text-[14px] w-[95px] font-semibold text-[#646464]">
                  Created
                </span>
                <span className="font-bold text-[16px] text-[#646464]">
                  {new Date(quizData.date_created).toLocaleDateString()}
                </span>
              </div>
              <div className="w-full bg-white rounded-full flex items-center p-[10px]">
                <div className="w-[19px] h-[19px] bg-[#34C759] rounded-full mr-[10px]"></div>
                <span className="text-[14px] w-[95px] font-semibold text-[#646464]">
                  Sequence
                </span>
                <span className="font-bold text-[16px] text-[#646464]">
                  {quizData.random_question_order ? "Random" : "Ordered"}
                </span>
              </div>
              <div className="w-full bg-white rounded-full flex items-center p-[10px]">
                <div className="w-[19px] h-[19px] bg-[#34C759] rounded-full mr-[10px]"></div>
                <span className="text-[14px] w-[95px] font-semibold text-[#646464]">
                  Questions
                </span>
                <span className="font-bold text-[16px] text-[#646464]">
                  {quizData.questions.length}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                navigate(`/quizzes/attempt/${quizData.quiz_id}`);
              }}
              className="bg-[#00CA4E] mb-[40px] w-full text-center font-extrabold text-[19px] text-white rounded-full p-[10px] cursor-pointer hover:bg-[#00AA1E] transition-all"
            >
              Attempt
            </button>
            <span className="w-full font-extrabold text-[20px] text-center mb-[20px]">
              Questions
            </span>
            <div className="flex flex-col gap-[20px]">
              {questions.map((question, index) => (
                <div
                  className="w-full rounded-[20px] bg-[#EFF7FF] p-[20px] drop-shadow-lg"
                  key={index}
                >
                  <div className="w-full text-center text-[16px] font-extrabold mb-[10px]">
                    {question.question}
                  </div>
                  <div className="flex flex-col w-full gap-[10px]">
                    {question.choices.map((choice, choice_index) => (
                      <div
                        className="bg-white rounded-full px-[30px] py-[10px] text-center text-[14px] text-[#646464] font-extrabold"
                        key={choice_index}
                      >
                        {choice}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col w-[29%]">
            <span className="text-[16px] font-bold mb-[10px] gap-[10px]">
              Attempts
            </span>
            <div className="flex flex-col gap-[10px]">
              {attempts.map((attempt, index) => (
                <div
                  className="flex items-center justify-center w-full bg-[#EFF7FF] p-[10px] rounded-[20px] drop-shadow-lg"
                  key={index}
                >
                  <div className="w-[70px] h-[70px]  rounded-full mr-[13px]">
                    <AttemptAccuracyDoughnutGraph data_points={[30, 20]} />
                  </div>
                  <div className="flex items-center">
                    <div className="flex flex-col gap-[7px] w-[70px] font-light">
                      <span className="text-[10px]">Date</span>
                      <span className="text-[10px]">Ratio</span>
                      <span className="text-[10px]">Percentage</span>
                    </div>
                    <div className="flex flex-col gap-[7px] font-semibold">
                      <span className="text-[10px]">{attempt.date}</span>
                      <span className="text-[10px]">{attempt.ratio}</span>
                      <span className="text-[10px]">{attempt.percentage}</span>
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
