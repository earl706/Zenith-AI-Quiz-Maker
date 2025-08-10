module.exports = {
	// Test environment
	testEnvironment: 'jsdom',

	// Setup files
	setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],

	// Module name mapping
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/src/tests/__mocks__/fileMock.js'
	},

	// Test file patterns
	testMatch: [
		'<rootDir>/src/tests/**/*.test.{js,jsx}',
		'<rootDir>/src/**/*.test.{js,jsx}',
		'<rootDir>/src/**/__tests__/*.{js,jsx}'
	],

	// Coverage configuration
	collectCoverageFrom: [
		'src/**/*.{js,jsx}',
		'!src/**/*.d.ts',
		'!src/main.jsx',
		'!src/index.css',
		'!src/App.css',
		'!src/tests/**',
		'!src/**/__tests__/**',
		'!src/**/*.test.{js,jsx}',
		'!src/**/*.stories.{js,jsx}',
		'!src/vite-env.d.ts'
	],

	// Coverage thresholds
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70
		}
	},

	// Coverage reporters
	coverageReporters: ['text', 'lcov', 'html'],

	// Transform configuration
	transform: {
		'^.+\\.(js|jsx)$': 'babel-jest'
	},

	// Transform ignore patterns
	transformIgnorePatterns: [
		'node_modules/(?!(react-router-dom|@testing-library)/)',
		'!src/services/.*\\.jsx?$'
	],

	// Module file extensions
	moduleFileExtensions: ['js', 'jsx', 'json'],

	// Test timeout
	testTimeout: 10000,

	// Verbose output
	verbose: true,

	// Clear mocks between tests
	clearMocks: true,

	// Restore mocks between tests
	restoreMocks: true,

	// Global test setup
	globals: {
		'ts-jest': {
			useESM: true
		}
	},

	// Extensions to treat as ES modules
	extensionsToTreatAsEsm: ['.jsx'],

	// Module directories
	moduleDirectories: ['node_modules', 'src'],

	// Test path ignore patterns
	testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/build/'],

	// Environment variables
	setupFiles: ['<rootDir>/src/tests/setupEnv.js'],

	// Test environment options
	testEnvironmentOptions: {
		url: 'http://localhost'
	},

	// Maximum workers
	maxWorkers: '50%',

	// Cache directory
	cacheDirectory: '<rootDir>/.jest-cache',

	// Coverage directory
	coverageDirectory: '<rootDir>/coverage',

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: false
};
