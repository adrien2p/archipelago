module.exports = {
    'preset': 'ts-jest',
    'transform': {
        '\\*.spec.ts': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.spec.json',
        }],
    },
    'testEnvironment': 'node',
    'testRegex': '.*\\.spec\\.ts$',
};
