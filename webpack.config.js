const path = require('path');

module.exports = {
    entry: './src/index.ts',
    output: {
        path: path.join(path.resolve(__dirname), 'dist'),
        filename: 'index.js',
        libraryTarget: 'umd',
        library: 'ab-gradient-picker',
        umdNamedDefine: true
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
};
