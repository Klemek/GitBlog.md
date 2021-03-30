module.exports = {
    plugins: [ 'jest' ],
    env: {
        'commonjs': true,
        'es2021': true,
        'node': true,
        'jest/globals': true,
    },
    extends: [
        'eslint:recommended',
        'plugin:jest/recommended',
    ],
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        'indent': [
            'error',
            4,
        ],
        'linebreak-style': [
            'error',
            'unix',
        ],
        'quotes': [
            'error',
            'single',
        ],
        'semi': [
            'error',
            'always',
        ],
        'curly': [
            'error',
            'all',
        ],
        'brace-style': [
            'error',
            '1tbs',
        ],
        'jest/no-done-callback': 'off',
        'jest/expect-expect': 'off',
        'comma-dangle': [
            'error',
            'always-multiline',
        ],
        'complexity': 'error',
        'consistent-return': 'error',
        'dot-location': [
            'error',
            'property',
        ],
        'eqeqeq': [
            'error',
            'always',
            { null: 'ignore' },
        ],
        'no-empty-function': 'error',
        'no-floating-decimal': 'error',
        'no-multi-spaces': 'error',
        'camelcase': [
            'error',
            { properties: 'never' },
        ],
        'comma-spacing': [
            'error',
            { before: false, after: true },
        ],
        'array-bracket-newline': [
            'error',
            { multiline: true },
        ],
        'array-element-newline': [
            'error',
            { multiline: true, minItems: 2 },
        ],
        'array-bracket-spacing': [
            'error',
            'always',
        ],
        'object-curly-spacing': [
            'error',
            'always',
        ],
        'comma-style': 'error',
        'computed-property-spacing': 'error',
        'eol-last': 'error',
        'func-call-spacing': 'error',
        'key-spacing': 'error',
        'keyword-spacing': 'error',
        'multiline-comment-style': 'error',
        'newline-per-chained-call': 'error',
        'no-lonely-if': 'error',
        'no-multiple-empty-lines': 'error',
        'no-trailing-spaces': 'error',
        'no-unneeded-ternary': 'error',
        'no-whitespace-before-property': 'error',
        'operator-assignment': 'error',
        'quote-props': [
            'error',
            'consistent-as-needed',
        ],
        'space-before-blocks': 'error',
        'space-infix-ops': 'error',
    },
};
