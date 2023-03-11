module.exports = {

	// doesn't work.  Dunno how to make it work.
//	eslint: {
//		// eventually I'll get this shit working
//		files: ['*.js'],
//		rules: {
//			'no-restricted-globals': 'off',
//			'no-ex-assign': 'off',
//			'no-eval': 'warn',
//			eqeqeq: 'off',
//			'no-unused-vars': 'off',
//		},
//		overrides: [{
//			files: ['*.js'],
//			rules: {
//				'no-restricted-globals': 'off',
//				'no-ex-assign': 'off',
//				'no-eval': 'warn',
//				eqeqeq: 'off',
//				'no-unused-vars': 'off',
//			},
//		}],
//
//		configure: {
//			files: ['*.js'],
//			rules: {
//				'no-restricted-globals': 'off',
//				'no-ex-assign': 'off',
//				'no-eval': 'warn',
//				eqeqeq: 'off',
//				'no-unused-vars': 'off',
//			},
//			overrides: [{
//				files: ['*.js'],
//				rules: {
//					'no-restricted-globals': 'off',
//					'no-ex-assign': 'off',
//					'no-eval': 'warn',
//					eqeqeq: 'off',
//					'no-unused-vars': 'off',
//				},
//			}],
//			configure: {
//				rules: {
//					'no-unused-vars': 'off',
//				},
//				reportUnusedDisableDirectives: true,
//			},
//		},
//	},

	devServer: {
		client: {
			overlay: false,  // that obnoxious error box that blocks out the whole screen
			progress: true,
			reconnect: 3,  // or true for ∞ or false for zero
		},
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
		https: true,
		hot: false,
		liveReload: false,
		open: true,

	},
};
