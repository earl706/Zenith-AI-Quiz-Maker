# Project Documentation

## Project Structure

App.jsx
    Component: `App`
    Function: `performLogin`
assets/**
components/**
    AttemptAccuracyDoughnutGraph.jsx
        Component: `AttemptAccuracyDoughnutGraph`
    Header.jsx
        Component: `Header`
        Function: `handleLogout`
        Function: `checkTokenStatus`
    IdentificationAnswerInput.jsx
        Component: `IdentificationAnswerInput`
        Function: `handleMathInputChange`
    LoadingComponent.jsx
        Component: `LoadingComponent`
    MathExpressionEncoder.jsx
        Component: `MathExpressionEncoder`
        Function: `initializeMathExpression`
    MathInput.jsx
        Component: `MathInput`
        Function: `handleMathInputChange`
    MathRenderer.jsx
        Component: `MathRenderer`
    Navbar.jsx
        Component: `Navbar`
    QuestionCard.jsx
        Component: `QuestionCard`
context/**
    AuthContext.jsx
        Component: `AuthProvider`
        Function: `getAccessToken`
        Function: `getRefreshToken`
        Function: `setTokens`
        Function: `clearTokens`
        Function: `isTokenExpired`
        Function: `logout`
main.jsx
    - _(no exported components or functions)_
pages/**
    AccuracyPage.jsx
        Component: `AccuracyPage`
    AchievementsPage.jsx
        Component: `AchievementsPage`
    AttemptsPage.jsx
        Component: `AttemptsPage`
    CreateQuizPage.jsx
        Component: `CreateQuizPage`
        Function: `handleQuizTitleChange`
        Function: `handleInputChange`
        Function: `removeQuestion`
        Function: `removeChoice`
        Function: `addChoice`
        Function: `updateQuizTitle`
        Function: `handleQuizImageUpload`
        Function: `handleQuestionImageUpload`
        Function: `removeQuizImage`
        Function: `removeQuestionImage`
        Function: `handleChoiceImageUpload`
        Function: `removeChoiceImage`
        Function: `handleChoicesChange`
        Function: `addQuestion`
        Function: `randomizeQuestionChoices`
    Dashboard.jsx
        Component: `Dashboard`
        Function: `formatTimeInSeconds`
    EditQuizPage.jsx
        Component: `EditQuizPage`
        Function: `handleQuizTitleChange`
        Function: `handleInputChange`
        Function: `removeQuestion`
        Function: `removeChoice`
        Function: `addChoice`
        Function: `updateQuizTitle`
        Function: `handleQuizImageUpload`
        Function: `handleQuestionImageUpload`
        Function: `removeQuizImage`
        Function: `removeQuestionImage`
        Function: `handleChoiceImageUpload`
        Function: `removeChoiceImage`
        Function: `to`
        Function: `fileToBase64`
        Function: `handleChoicesChange`
        Function: `addQuestion`
        Function: `randomizeQuestionChoices`
    LoginPage.jsx
        Component: `LoginPage`
    QuizAttempt.jsx
        Component: `QuizAttempt`
        Function: `handleAnswerChange`
        Function: `handleMathematicalAnswerChange`
        Function: `handleIdentificationAnswerChange`
        Function: `closeDeleteConfirmationModal`
        Function: `formatTime`
    QuizFlashcardAttemptPage.jsx
        Component: `QuizFlashcardAttemptPage`
        Function: `to`
        Function: `getChoiceData`
        Function: `handleNext`
        Function: `handlePrev`
    QuizPage.jsx
        Component: `QuizPage`
        Function: `closeDeleteConfirmationModal`
    QuizResultsPage.jsx
        Component: `QuizResultsPage`
        Function: `to`
        Function: `getChoiceData`
        Function: `to`
        Function: `getChoiceStyle`
        Function: `renderIdentificationResult`
        Function: `renderMultipleChoiceResult`
    QuizzesPage.jsx
        Component: `QuizzesPage`
    RegistrationPage.jsx
        Component: `RegistrationPage`
    ResendVerification.jsx
        Component: `ResendVerification`
    VerificationPage.jsx
        Component: `VerificationPage`
        Function: `handleResend`
    VerificationSuccessPage.jsx
        Component: `VerificationSuccessPage`
        Function: `handleLogin`
        Function: `handleResend`
services/**
    api.jsx
        Function: `isTokenExpired`
        Function: `const`
    apiQuizzes.jsx
        Function: `isTokenExpired`
        Function: `const`
tests/**
    AuthContext.test.jsx
        Component: `TestComponent`
        Component: `TestLogin`
        Component: `TestLogout`
        Component: `TestTokenCheck`
        Component: `TestLogin`
        Component: `TestCreateQuiz`
        Component: `TestUpdateQuiz`
        Component: `TestLoginError`
        Component: `TestCreateError`
        Function: `useAuth`
    CreateQuizPage.test.jsx
        Component: `TestWrapper`
    EditQuizPage.test.jsx
        Component: `TestWrapper`
    LoginPage.test.jsx
        Component: `TestWrapper`
        Function: `with`
    QuizComponents.test.jsx
        Component: `MockMathRenderer`
    QuizFlashcardAttemptPage.test.jsx
        Component: `MockMathRenderer`
    __mocks__/**
        fileMock.js
            - _(no exported components or functions)_
    setup.js
        - _(no exported components or functions)_
    setupEnv.js
        - _(no exported components or functions)_
    utils.test.js
        Function: `isTokenExpired`
        Function: `isTokenExpired`
        Function: `isTokenExpired`
        Function: `getChoiceData`
        Function: `fileToBase64`
        Function: `isMathematical`
        Function: `isIdentification`
        Function: `validateQuizTitle`
        Function: `validateQuestion`
        Function: `formatTime`
        Function: `formatTimeInSeconds`
        Function: `filterByType`
        Function: `sortByDate`
        Function: `calculateAccuracy`
        Function: `calculateScore`
        Function: `truncate`
        Function: `formatQuestionNumber`
