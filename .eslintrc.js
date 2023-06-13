module.exports = {
    'parser': '@typescript-eslint/parser',
    'plugins': [
        '@typescript-eslint',
    ],
    'extends': [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'google',
    ],
    'ignorePatterns': ['node_modules/'],
    'env': {
        commonjs: true,
        node: true,
        browser: true,
        es6: true,
        jest: true,
    },
    'parserOptions': {
        'sourceType': 'module',
        'ecmaVersion': 2020,
    },
    'rules': {
        'require-jsdoc': 'off',
        'object-curly-spacing': ['error', 'always'],
        'indent': ['error', 4],
    },
};
