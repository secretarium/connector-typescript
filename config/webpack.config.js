const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, '../lib'),
        filename: 'secretarium.umd.js',
        libraryTarget: 'umd',
        globalObject: 'this',
        library: 'Secretarium'
    },
    resolve: {
        extensions: ['*', '.js', '.ts', '.json']
    },
    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                exclude: /(node_modules)/,
                use: 'babel-loader'
            }
        ]
    },
    optimization: {
        minimizer: [new UglifyJsPlugin()]
    }
};