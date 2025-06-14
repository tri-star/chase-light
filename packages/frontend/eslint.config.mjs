// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format

// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  // Prettier config will disable conflicting ESLint rules
  {
    rules: {
      // Disable ESLint formatting rules that conflict with Prettier
      'prettier/prettier': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Prettierが自動的に閉じタグを挿入するため、Vueの自動閉じタグルールを無効化
      'vue/html-self-closing': ['off'],
    },
  }
);
