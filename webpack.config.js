const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: './src/index.js',
	output: {
		filename: 'main.js',
		publicPath: '/',
		path: path.resolve(__dirname, 'dist'),
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './index.html',
		}),
		new CopyWebpackPlugin({
			patterns: [{ from: path.resolve(__dirname, 'assets') }],
		}),
	],
	devServer: {
		static: {
			directory: path.resolve(__dirname, 'dist'),
		},
		port: 5000,
		historyApiFallback: true,
	},
};