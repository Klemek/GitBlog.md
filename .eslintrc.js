module.exports = {
    'plugins': ['jest'],
    'env': {
        'commonjs': true,
        'es2021': true,
        'node': true,
        'jest/globals': true
    },
    'extends': ['eslint:recommended'],
    'parserOptions': {
        'ecmaVersion': 12
    },
    'rules': {
        'indent': [
            'error',
            4
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'curly': [
            'error',
            'all'
        ],
        'brace-style': [
            'error',
            '1tbs'
        ]
    }
};
