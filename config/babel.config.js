module.exports = {
    presets: [
        '@babel/preset-env',
        '@babel/preset-typescript'
    ],
    plugins: [
        ['@babel/plugin-transform-runtime',
            {
                regenerator: true
            }
        ],
        'add-module-exports',
        'transform-class-properties'
    ].concat(process.env.NODE_ENV === 'test' ? [
        'rewire-ts'
    ] : [])
};