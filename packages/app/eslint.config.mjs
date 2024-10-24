// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
	// pages配下は単一ワードも許可
	{
		files: ["src/pages/**/*.vue"],
		rules: {
			"vue/multi-word-component-names": "off",
		},
	},
);
