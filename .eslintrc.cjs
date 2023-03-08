// this doesn't work - has no effect on eslint

modules = {exports: {
	env: {
		browser: true,
		worker: true,
		es2021: true,
	},
    "rules": {
        "eqeqeq": "off",
        "curly": "error",
        "quotes": ["error", "double"],
        "no-unused-vars": "off"
    }
}};

