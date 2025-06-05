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
