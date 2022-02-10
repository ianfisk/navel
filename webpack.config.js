const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
	devtool: 'inline-cheap-module-source-map', // so webpack doesn't use eval() in development
	entry: {
		content: './src/content/main.ts',
		options: './src/options/index.ts',
		background: './src/background/index.ts',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},

	plugins: [new CopyWebpackPlugin([{ from: './public/*', flatten: true }])],
};
