var path = require("path");

module.exports = {
    context: __dirname,
    entry: "./index.jsx",
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ["babel-loader"],
            ignore: [/node_modules/]
        }]
    },

    resolve: {
        extensions: ['', '.js', '.jsx']
    },

    resolveLoader: {
        root: path.join(__dirname, "node_modules")
    },

    output: {
        filename: "index.js",
        path: __dirname + "/build"
    }
};