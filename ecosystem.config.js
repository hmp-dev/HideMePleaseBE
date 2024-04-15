module.exports = {
	apps: [
		{
			name: 'hidemeplease',
			script: './backend/dist/main.js',
			node_args: '--env-file=.env',
		},
	],
};
