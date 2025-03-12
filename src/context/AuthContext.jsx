import React, { createContext, useState } from "react";
import API from "../services/api";
import API_QUIZZES from "../services/apiQuizzes";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempt, setQuizAttempt] = useState(false);
  const [quizDeleteData, setQuizDeleteData] = useState({
    quiz_id: "",
    questions: [],
    quiz_title: "",
    date_created: "",
    public: false,
    owner: 0,
  });

  const login = async (username, password) => {
    try {
      const login_response = await API.post("api/users/login/", {
        full_name: username,
        password: password,
      });
      localStorage.setItem(
        "zenithQuizMakerAccessToken",
        login_response.data.access
      );
      localStorage.setItem(
        "zenithQuizMakerRefreshToken",
        login_response.data.refresh
      );
      localStorage.setItem(
        "userData",
        JSON.stringify(login_response.data.user_data)
      );
      console.log(login_response);
      return login_response;
    } catch (err) {
      console.log(err);
      return err;
    }
  };

  const refreshToken = async (refresh_token) => {
    try {
      const refresh_token_response = await API.post(
        "api/users/token/refresh/",
        {
          refresh: refresh_token,
        }
      );
      return refresh_token_response;
    } catch (err) {
      return err;
    }
  };

  const register = async (data) => {
    try {
      const register_response = await API.post("api/users/register/", data);
      return register_response;
    } catch (error) {
      return error;
    }
  };

  const getUserData = async () => {
    try {
      const user_data_response = await API.get("api/users/profile/");
      return user_data_response;
    } catch (err) {
      return err;
    }
  };

  const updateUserData = async (userEditData) => {
    try {
      const user_update_response = await API.put(
        "api/users/profile/",
        userEditData
      );
      return user_update_response;
    } catch (err) {
      return err;
    }
  };

  const createQuiz = async (quiz, questions) => {
    try {
      const createquiz_response = await API_QUIZZES.post("quiz/", {
        quiz: quiz,
        questions: questions,
      });
      return createquiz_response;
    } catch (err) {
      return err;
    }
  };

  const updateQuiz = async (id, quizEditData) => {
    try {
      const quiz_update_response = await API_QUIZZES.put(
        `quiz/update/${id}/`,
        quizEditData
      );
      return quiz_update_response;
    } catch (err) {
      return err;
    }
  };

  const getQuizList = async () => {
    try {
      const getquizlist_response = await API_QUIZZES.get("quiz/");
      return getquizlist_response;
    } catch (err) {
      return err;
    }
  };

  const getQuiz = async (id, randomize = true) => {
    try {
      const getquiz_response = await API_QUIZZES.get(`quiz/${id}/`, {
        params: {
          randomize: randomize,
        },
      });
      return getquiz_response;
    } catch (err) {
      return err;
    }
  };

  const getQuizSummary = async (id) => {
    try {
      const quiz_summary_response = await API_QUIZZES.get(
        `quiz/summary/${id}/`
      );
      return quiz_summary_response;
    } catch (err) {
      return err;
    }
  };

  const attemptQuiz = async (id) => {
    try {
      const quiz_attempt_response = await API_QUIZZES.post(
        `quiz/attempt/${id}/`
      );
      return quiz_attempt_response;
    } catch (err) {
      return err;
    }
  };

  const submitQuizAnswers = async (id, answers, time) => {
    try {
      const quiz_answers_submission_response = await API_QUIZZES.post(
        `quiz/submit/${id}/`,
        {
          answers: answers,
          time: time,
        }
      );
      return quiz_answers_submission_response;
    } catch (err) {
      return err;
    }
  };

  const deleteQuiz = async (id) => {
    try {
      const deletequiz_response = await API_QUIZZES.delete(`quiz/${id}/`);
      return deletequiz_response;
    } catch (err) {
      return err;
    }
  };

  const generateQuiz = async (topic, questionNumber) => {
    try {
      const response = await API_QUIZZES.post("quiz/generate/", {
        topic: topic,
        questionNumber: questionNumber,
      });
      return response;
    } catch (err) {
      return err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        getUserData,
        updateUserData,
        refreshToken,
        quizzes,
        setQuizzes,
        createQuiz,
        updateQuiz,
        generateQuiz,
        getQuizList,
        getQuiz,
        getQuizSummary,
        attemptQuiz,
        deleteMode,
        submitQuizAnswers,
        deleteQuiz,
        setDeleteMode,
        quizDeleteData,
        setQuizDeleteData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
