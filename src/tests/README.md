# Testing Documentation

This directory contains comprehensive tests for the Zenith Quiz Maker application.

## Test Structure

```
src/tests/
├── __mocks__/           # Mock files for static assets
├── AuthContext.test.jsx # Authentication context tests
├── CreateQuizPage.test.jsx # Quiz creation page tests
├── EditQuizPage.test.jsx # Quiz editing page tests
├── LoginPage.test.jsx   # Login page tests
├── QuizComponents.test.jsx # Component tests
├── QuizFlashcardAttemptPage.test.jsx # Flashcard attempt tests
├── utils.test.js        # Utility function tests
├── setup.js            # Test environment setup
├── setupEnv.js         # Environment variables setup
└── README.md           # This file
```

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (Development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### CI Mode

```bash
npm run test:ci
```

## Test Categories

### 1. Authentication Tests (`AuthContext.test.jsx`)

- Token management (storage, expiration, refresh)
- Login/logout functionality
- API call handling
- Error handling for authentication failures

### 2. Component Tests (`QuizComponents.test.jsx`)

- QuestionCard component rendering
- MathRenderer component functionality
- QuizResultsPage display logic
- Different question types (MUL, MUL-COM, IDE, IDE-COM, COM)

### 3. Page Tests

- **CreateQuizPage**: Quiz creation form, validation, submission
- **EditQuizPage**: Quiz editing, data loading, form updates
- **LoginPage**: Authentication form, validation, error handling
- **QuizFlashcardAttemptPage**: Navigation, question rendering, answer handling

### 4. Utility Tests (`utils.test.js`)

- Token validation functions
- Data transformation helpers
- Form validation logic
- Time formatting utilities
- Score calculation functions

## Test Coverage

The tests aim to achieve 70% coverage across:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Mocking Strategy

### API Mocks

- Authentication API calls are mocked using Jest
- Quiz-related API calls are mocked for testing
- Error scenarios are tested with rejected promises

### Component Mocks

- MathRenderer is mocked to avoid KaTeX dependencies
- File uploads are mocked for testing
- Navigation is mocked using react-router-dom

### Browser APIs

- localStorage and sessionStorage are mocked
- IntersectionObserver and ResizeObserver are mocked
- matchMedia is mocked for responsive design testing

## Best Practices

1. **Test Organization**: Tests are organized by feature/component
2. **Descriptive Names**: Test names clearly describe what is being tested
3. **Setup/Teardown**: Each test file has proper beforeEach cleanup
4. **Mocking**: External dependencies are properly mocked
5. **Error Testing**: Both success and error scenarios are tested
6. **User Interactions**: User events are simulated using fireEvent
7. **Async Testing**: Proper async/await patterns for API calls

## Adding New Tests

When adding new tests:

1. Create test file in appropriate directory
2. Follow naming convention: `ComponentName.test.jsx`
3. Import necessary testing utilities
4. Mock external dependencies
5. Test both success and error scenarios
6. Update this README if adding new test categories

## Debugging Tests

### Common Issues

1. **Mock not working**: Ensure mocks are properly set up in beforeEach
2. **Async test failures**: Use waitFor for async operations
3. **Component not rendering**: Check if all required props are provided
4. **API call not mocked**: Verify mock functions are properly configured

### Debug Commands

```bash
# Run specific test file
npm test -- AuthContext.test.jsx

# Run tests with verbose output
npm test -- --verbose

# Run tests in debug mode
npm test -- --detectOpenHandles
```

## Continuous Integration

Tests are configured to run in CI environments with:

- Coverage reporting
- No watch mode
- Fail fast on errors
- SonarQube integration for code quality metrics
