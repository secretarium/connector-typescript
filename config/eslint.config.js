
var defaultPlugins = [
    '@typescript-eslint/eslint-plugin',
    'import',
    'jest'
];

var defaultEnv = {
    browser: true,
    commonjs: true,
    es6: true
};

var defaultRules = {
    'eqeqeq': [
        'warn'
    ],
    'indent': [
        'error',
        4,
        { SwitchCase: 1 }
    ],
    'comma-dangle': [
        'error',
        'never'
    ],
    'no-trailing-spaces': 'error',
    'quotes': [
        'error',
        'single'
    ],
    'quote-props': [
        'error',
        'consistent-as-needed'
    ],
    'semi': [
        'error',
        'always'
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^__unused__' }
    ]
};

var javascriptExtensions = [
    'eslint:recommended'
];

var typescriptExtensions = javascriptExtensions.concat([
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended'
]);

module.exports = {
    root: true,
    extends: javascriptExtensions,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    settings: {
        react: {
            version: 'detect'
        }
    },
    plugins: defaultPlugins,
    rules: defaultRules,
    overrides: [
        {
            files: [
                '*eslint*',
                '*config.js',
                'scripts/*'
            ],
            env: {
                node: true
            }
        },
        {
            files: [
                '**/*.ts', '**/*.tsx'
            ],
            globals: {
                Atomics: 'readonly',
                SharedArrayBuffer: 'readonly'
            },
            extends: typescriptExtensions,
            rules: defaultRules
        },
        {
            files: [
                '**/*.test.js',
                '**/test/**/*.js'
            ],
            env: Object.assign({}, defaultEnv, {
                'jest/globals': true
            }),
            extends: javascriptExtensions,
            rules: {
                ...defaultRules,
                'no-unused-vars': [
                    'warn',
                    { argsIgnorePattern: '^__unused__' }
                ]
            }
        },
        {
            files: [
                '**/*.test.ts',
                '**/test/**/*.ts'
            ],
            env: Object.assign({}, defaultEnv, {
                'jest/globals': true
            }),
            globals: {
                Atomics: 'readonly',
                SharedArrayBuffer: 'readonly'
            },
            extends: typescriptExtensions,
            rules: defaultRules
        }
    ]
};
