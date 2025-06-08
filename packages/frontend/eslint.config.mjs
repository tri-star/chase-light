// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  // Prettier config will disable conflicting ESLint rules
  {
    rules: {
      // Disable ESLint formatting rules that conflict with Prettier
      'prettier/prettier': 'off',
    },
  }
);
