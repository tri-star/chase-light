// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs"
import { FlatCompat } from "@eslint/eslintrc"
const compat = new FlatCompat()

export default withNuxt(
  // SFC内でscript setupを利用するために必要
  // https://zenn.dev/gn5r/scraps/324e1371f64554#comment-326968e19bccc3
  ...compat.extends("@vue/typescript/recommended"),

  // pages配下は単一ワードも許可
  {
    files: ["src/pages/**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  {
    rules: {
      "vue/no-multiple-template-root":
        "off" /* ルートレベルで複数要素を許可することもあるのでOFF */,
      "vue/html-self-closing": "off" /* prettierが自動で付与するためOFF */,
    },
  },
)
