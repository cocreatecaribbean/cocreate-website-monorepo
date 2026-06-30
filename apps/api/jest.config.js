module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@cocreate/database$': '<rootDir>/../../packages/database/generated/client',
    '^@cocreate/api-contracts/v1/(.*)$':
      '<rootDir>/../../packages/api-contracts/dist/v1/$1',
    '^@cocreate/api-contracts$': '<rootDir>/../../packages/api-contracts/dist/index',
  },
}
