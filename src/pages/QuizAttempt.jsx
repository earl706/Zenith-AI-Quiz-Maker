import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";
import QuizFlashcardAttemptPage from "./QuizFlashcardAttemptPage";
import QuestionCard from "../components/QuestionCard";
import QuizResultsPage from "./QuizResultsPage";
import { AuthContext } from "../context/AuthContext";

export default function QuizAttempt() {
  const {
    attemptQuiz,
    getQuiz,
    deleteMode,
    setDeleteMode,
    quizDeleteData,
    submitQuizAnswers,
  } = useContext(AuthContext);

  const questions_data = [
    {
      "id": 15,
      "question": "Question 1",
      "question_type": "MUL-COM",
      "choices": ["f(x)=x", "f(x)=x^2", "f(x)=x^1", "f(x)=x^3"],
      "correct_answer": "f(x)=x",
      "random_choices": true,
      "correct_answer_index": 0,
    },
    {
      "id": 14,
      "question": "Question 2",
      "question_type": "MUL",
      "choices": ["asdasd", "asdasdasd", "asds", "correct"],
      "correct_answer": "correct",
      "random_choices": true,
      "correct_answer_index": 0,
    },
    {
      "id": 16,
      "question": "Question 3",
      "question_type": "IDE-COM",
      "choices": ["", "f(x)=x", "", ""],
      "correct_answer": "f(x)=x",
      "random_choices": true,
      "correct_answer_index": 0,
    },
    {
      "id": 13,
      "question": "Question 4",
      "question_type": "IDE",
      "choices": ["", "", "", "correct"],
      "correct_answer": "correct",
      "random_choices": true,
      "correct_answer_index": 0,
    },
  ];

  const answers_data = questions_data.map((question) => ({
    id: question.id,
    question: question.question,
    correctAnswer: question.correct_answer,
    questionType: question.question_type,
    userAnswer: "",
  }));

  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);

  const [questions, setQuestions] = useState(questions_data);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [quizResults, setQuizResults] = useState(false);
  const [answers, setAnswers] = useState(answers_data);
  const [quizData, setQuizData] = useState({
    quiz_id: "",
    questions: [],
    quiz_title: "",
    date_created: "",
    public: false,
    flashcard_quiz: true,
    owner: 0,
  });

  const quiz_id = useParams().id;
  const handleAnswerChange = (id, field, index) => {
    const updatedAnswers = answers.map((answer) =>
      answer.id === id ? { ...answer, [field]: index } : answer
    );
    setAnswers(updatedAnswers);
  };

  const handleMathematicalAnswerChange = (id, index, value) => {
    const updatedAnswers = answers.map((answer) =>
      answer.id === id ? { ...answer, [field]: index } : answer
    );
    setAnswers(updatedAnswers);
  };

  const handleIdentificationAnswerChange = (id, value) => {
    const updatedAnswers = answers.map((answer) =>
      answer.id === id ? { ...answer, userAnswer: value } : answer
    );
    setAnswers(updatedAnswers);
  };

  const initializeQuiz = async () => {
    try {
      const response = await getQuiz(quiz_id);
      setQuizData(response.data.data);
      setQuestions(Array.from(response.data.questions));
      console.log(response.data.questions);
      const answersInitialization = response.data.questions.map((question) => ({
        id: question.id,
        question: question.question,
        correctAnswer: question.correct_answer,
        questionType: question.question_type,
        userAnswer: "",
      }));
      setAnswers(answersInitialization);
      return response;
    } catch (err) {
      return err;
    }
  };

  const submitAnswers = async () => {
    try {
      const answers_submission_response = await submitQuizAnswers(
        quiz_id,
        answers,
        time
      );
      setSubmittedAnswers(Array.from(answers_submission_response.data.answers));
      setScore(answers_submission_response.data.score);
      setAccuracy(answers_submission_response.data.accuracy);
      setQuizResults(true);
      setIsRunning(false);
      return answers_submission_response;
    } catch (err) {
      return err;
    }
  };

  const closeDeleteConfirmationModal = () => {
    setDeleteMode(false);
  };

  const formatTime = (milliseconds) => {
    const mins = String(Math.floor((milliseconds / 6000) % 60)).padStart(
      2,
      "0"
    );
    const secs = String(Math.floor((milliseconds / 60) % 60)).padStart(2, "0");
    const ms = String(milliseconds % 60).padStart(2, "0");
    return `${mins}:${secs}:${ms}`;
  };

  useEffect(() => {
    initializeQuiz();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const initializeQuizAttempt = async () => {
      try {
        const response = await attemptQuiz(quiz_id);
        return response;
      } catch (err) {}
    };

    initializeQuizAttempt();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    console.log(answers);
  }, [answers]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <>
      <div className="px-[30px] pt-[18px] pb-[30px] transition-all">
        <Header page={"Attempt"} />
        <div className="flex gap-[40px]">
          {quizResults ? (
            <>
              {questions.map((question, index) => {
                const answer = answers.find((a) => a.id === question.id);
                const correct =
                  submittedAnswers[index].correctAnswer ===
                  submittedAnswers[index].userAnswer;
                return (
                  <QuizResultsPage
                    question={question}
                    answer={answer}
                    correct={correct}
                    handleIdentificationAnswerChange={
                      handleIdentificationAnswerChange
                    }
                    submittedAnswers={submittedAnswers}
                    index={index}
                    key={index}
                  />
                );
              })}
            </>
          ) : quizData.flashcard_quiz ? (
            <div className="flex flex-col w-[67%]">
              <QuizFlashcardAttemptPage
                questionsParam={questions}
                submitAnswers={submitAnswers}
                handleAnswerChange={handleAnswerChange}
                handleIdentificationAnswerChange={
                  handleIdentificationAnswerChange
                }
                answers={answers}
              />
            </div>
          ) : (
            <div className="flex flex-col w-[67%]">
              {questions.map((question, index) => {
                return (
                  <>
                    <QuestionCard
                      question={question}
                      answers={answers}
                      handleAnswerChange={handleAnswerChange}
                      handleIdentificationAnswerChange={
                        handleIdentificationAnswerChange
                      }
                      key={index}
                    />
                  </>
                );
              })}
              <button
                onClick={submitAnswers}
                className="cursor-pointer w-full p-[10px] text-white bg-[#00CA4E] rounded-full hover:bg-[#00AA2E] transition-all text-[16px] font-extrabold"
              >
                Submit
              </button>
            </div>
          )}

          <div className="flex flex-col w-[29%]">
            <span className="text-center text-[16px] font-bold w-full mb-[20px]">
              Time
            </span>
            <div className="flex flex-col items-center justify-center p-4 bg-[#3C6B9F] text-white rounded-full drop-shadow-lg w-full">
              <p className="text-3xl font-mono text-white">
                {formatTime(time)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
