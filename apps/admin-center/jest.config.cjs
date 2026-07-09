module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: false }],
  },
  testMatch: ['<rootDir>/lib/**/*.spec.ts'],
}
