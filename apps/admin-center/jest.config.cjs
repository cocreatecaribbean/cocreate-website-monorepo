module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          isolatedModules: true,
          strict: true,
          skipLibCheck: true,
          paths: { '@/*': ['./*'] },
        },
      },
    ],
  },
  testMatch: ['<rootDir>/lib/**/*.spec.ts', '<rootDir>/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
