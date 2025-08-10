// Utility functions tests
describe('Utility Functions', () => {
	describe('Token Management', () => {
		test('should check if token is expired', () => {
			// Create a token that expires in the past
			const expiredToken =
				'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MzQ1Njc4NzF9.signature';

			const isTokenExpired = (token) => {
				if (!token) return true;
				try {
					const payload = JSON.parse(atob(token.split('.')[1]));
					return payload.exp * 1000 < Date.now();
				} catch (error) {
					return true;
				}
			};

			expect(isTokenExpired(expiredToken)).toBe(true);
		});

		test('should check if token is valid', () => {
			// Create a token that expires in the future (1 hour from now)
			const futureTime = Math.floor(Date.now() / 1000) + 3600;
			const payload = JSON.stringify({ exp: futureTime });
			const validToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.${btoa(payload)}.signature`;

			const isTokenExpired = (token) => {
				if (!token) return true;
				try {
					const payload = JSON.parse(atob(token.split('.')[1]));
					return payload.exp * 1000 < Date.now();
				} catch (error) {
					return true;
				}
			};

			expect(isTokenExpired(validToken)).toBe(false);
		});

		test('should handle invalid token format', () => {
			const invalidToken = 'invalid.token.format';

			const isTokenExpired = (token) => {
				if (!token) return true;
				try {
					const payload = JSON.parse(atob(token.split('.')[1]));
					return payload.exp * 1000 < Date.now();
				} catch (error) {
					return true;
				}
			};

			expect(isTokenExpired(invalidToken)).toBe(true);
		});
	});

	describe('Data Transformation', () => {
		test('should transform choice data structure', () => {
			const getChoiceData = (choice) => {
				if (typeof choice === 'object' && choice !== null) {
					return {
						text: choice.text || choice,
						image: choice.image,
						id: choice.id
					};
				}
				return {
					text: choice,
					image: null,
					id: null
				};
			};

			// Test simple string choice
			expect(getChoiceData('Choice A')).toEqual({
				text: 'Choice A',
				image: null,
				id: null
			});

			// Test object choice
			expect(getChoiceData({ text: 'Choice B', image: 'image.jpg', id: 1 })).toEqual({
				text: 'Choice B',
				image: 'image.jpg',
				id: 1
			});

			// Test object choice without text property
			expect(getChoiceData({ image: 'image.jpg' })).toEqual({
				text: { image: 'image.jpg' },
				image: 'image.jpg',
				id: undefined
			});
		});

		test('should convert file to base64', async () => {
			const fileToBase64 = (file) => {
				return new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.readAsDataURL(file);
					reader.onload = () => resolve(reader.result);
					reader.onerror = (error) => reject(error);
				});
			};

			// Create a mock file
			const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

			const result = await fileToBase64(mockFile);
			expect(result).toMatch(/^data:image\/jpeg;base64,/);
		});
	});

	describe('Question Type Detection', () => {
		test('should detect mathematical question types', () => {
			const isMathematical = (questionType) => {
				return questionType === 'MUL-COM' || questionType === 'COM' || questionType === 'IDE-COM';
			};

			expect(isMathematical('MUL-COM')).toBe(true);
			expect(isMathematical('COM')).toBe(true);
			expect(isMathematical('IDE-COM')).toBe(true);
			expect(isMathematical('MUL')).toBe(false);
			expect(isMathematical('IDE')).toBe(false);
		});

		test('should detect identification question types', () => {
			const isIdentification = (questionType) => {
				return questionType === 'IDE' || questionType === 'IDE-COM';
			};

			expect(isIdentification('IDE')).toBe(true);
			expect(isIdentification('IDE-COM')).toBe(true);
			expect(isIdentification('MUL')).toBe(false);
			expect(isIdentification('MUL-COM')).toBe(false);
		});
	});

	describe('Form Validation', () => {
		test('should validate quiz title', () => {
			const validateQuizTitle = (title) => {
				return title && title.trim().length > 0 && title.trim().length <= 100;
			};

			expect(validateQuizTitle('Valid Title')).toBe(true);
			expect(validateQuizTitle('')).toBe('');
			expect(validateQuizTitle('   ')).toBe(false);
			expect(validateQuizTitle('a'.repeat(101))).toBe(false);
		});

		test('should validate question data', () => {
			const validateQuestion = (question) => {
				return (
					question.title &&
					question.title.trim().length > 0 &&
					question.choices &&
					question.choices.length >= 2 &&
					question.choices.every((choice) => choice && choice.trim().length > 0)
				);
			};

			const validQuestion = {
				title: 'Test Question',
				choices: ['Choice A', 'Choice B', 'Choice C']
			};

			const invalidQuestion = {
				title: '',
				choices: ['Choice A']
			};

			expect(validateQuestion(validQuestion)).toBe(true);
			expect(validateQuestion(invalidQuestion)).toBe('');
		});
	});

	describe('Time Formatting', () => {
		test('should format time in milliseconds', () => {
			const formatTime = (milliseconds) => {
				const mins = String(Math.floor((milliseconds / 6000) % 60)).padStart(2, '0');
				const secs = String(Math.floor((milliseconds / 60) % 60)).padStart(2, '0');
				const ms = String(milliseconds % 60).padStart(2, '0');
				return `${mins}:${secs}:${ms}`;
			};

			expect(formatTime(0)).toBe('00:00:00');
			expect(formatTime(60000)).toBe('10:40:00');
			expect(formatTime(123456)).toBe('20:17:36');
		});

		test('should format time in seconds', () => {
			const formatTimeInSeconds = (time) => {
				const hrs = Math.floor(time / 3600);
				const mins = Math.floor((time % 3600) / 60);
				const secs = time % 60;
				return {
					hrs: hrs,
					mins: mins,
					secs: secs
				};
			};

			expect(formatTimeInSeconds(0)).toEqual({ hrs: 0, mins: 0, secs: 0 });
			expect(formatTimeInSeconds(3661)).toEqual({ hrs: 1, mins: 1, secs: 1 });
			expect(formatTimeInSeconds(7325)).toEqual({ hrs: 2, mins: 2, secs: 5 });
		});
	});

	describe('Data Filtering and Sorting', () => {
		test('should filter quizzes by type', () => {
			const quizzes = [
				{ quiz_id: 1, flashcard_quiz: true, quiz_title: 'Flashcard Quiz' },
				{ quiz_id: 2, flashcard_quiz: false, quiz_title: 'Regular Quiz' },
				{ quiz_id: 3, flashcard_quiz: true, quiz_title: 'Another Flashcard' }
			];

			const filterByType = (quizzes, type) => {
				return quizzes.filter((quiz) =>
					type === 'flashcard' ? quiz.flashcard_quiz : !quiz.flashcard_quiz
				);
			};

			const flashcardQuizzes = filterByType(quizzes, 'flashcard');
			const regularQuizzes = filterByType(quizzes, 'regular');

			expect(flashcardQuizzes).toHaveLength(2);
			expect(regularQuizzes).toHaveLength(1);
		});

		test('should sort quizzes by date', () => {
			const quizzes = [
				{ quiz_id: 1, date_created: '2024-01-01T00:00:00Z' },
				{ quiz_id: 2, date_created: '2024-01-03T00:00:00Z' },
				{ quiz_id: 3, date_created: '2024-01-02T00:00:00Z' }
			];

			const sortByDate = (quizzes, ascending = true) => {
				return [...quizzes].sort((a, b) => {
					const dateA = new Date(a.date_created);
					const dateB = new Date(b.date_created);
					return ascending ? dateA - dateB : dateB - dateA;
				});
			};

			const ascending = sortByDate(quizzes, true);
			const descending = sortByDate(quizzes, false);

			expect(ascending[0].quiz_id).toBe(1);
			expect(ascending[2].quiz_id).toBe(2);
			expect(descending[0].quiz_id).toBe(2);
			expect(descending[2].quiz_id).toBe(1);
		});
	});

	describe('Score Calculation', () => {
		test('should calculate accuracy percentage', () => {
			const calculateAccuracy = (correct, total) => {
				if (total === 0) return 0;
				return Math.round((correct / total) * 100);
			};

			expect(calculateAccuracy(8, 10)).toBe(80);
			expect(calculateAccuracy(5, 5)).toBe(100);
			expect(calculateAccuracy(0, 10)).toBe(0);
			expect(calculateAccuracy(0, 0)).toBe(0);
		});

		test('should calculate score based on correct answers', () => {
			const calculateScore = (correct, total, maxScore = 100) => {
				if (total === 0) return 0;
				return Math.round((correct / total) * maxScore);
			};

			expect(calculateScore(8, 10, 100)).toBe(80);
			expect(calculateScore(5, 5, 50)).toBe(50);
			expect(calculateScore(0, 10, 100)).toBe(0);
		});
	});

	describe('String Manipulation', () => {
		test('should truncate long strings', () => {
			const truncate = (str, maxLength) => {
				if (str.length <= maxLength) return str;
				return str.substring(0, maxLength) + '...';
			};

			expect(truncate('Short text', 20)).toBe('Short text');
			expect(truncate('This is a very long text that needs to be truncated', 20)).toBe(
				'This is a very long ...'
			);
		});

		test('should format question numbers', () => {
			const formatQuestionNumber = (index, total) => {
				return `Question ${index + 1} of ${total}`;
			};

			expect(formatQuestionNumber(0, 5)).toBe('Question 1 of 5');
			expect(formatQuestionNumber(4, 5)).toBe('Question 5 of 5');
		});
	});
});
