import { z } from "zod"

export default defineNuxtPlugin((nuxtApp) => {
  const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.too_small) {
      if (issue.minimum === 1) {
        return { message: "必ず入力してください" }
      }
    }
    if (issue.code === z.ZodIssueCode.invalid_string) {
      if (issue.validation === "url") {
        return { message: "無効なURLです" }
      }
    }
    console.log(issue)
    // return { message: `${JSON.stringify(issue)}` }
    return { message: ctx.defaultError }
  }

  z.setErrorMap(customErrorMap)
})
