import { z } from "zod/v4"

/*
    id: uuid("id").primaryKey(),
    auth0UserId: text("auth0_user_id").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url").notNull(),
    githubUsername: text("github_username"),
    timezone: text("timezone").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),

*/

export const userSchema = z.object({
  id: z.string().uuid(),
  auth0UserId: z.string().min(1),
  email: z.string(),
  name: z.string().min(1),
  avatarUrl: z.url(),
  githubUsername: z.string().nullable(),
  timezone: z.string().min(1),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
})

export type User = z.infer<typeof userSchema>

// 日付をどうするか
// https://claude.ai/share/887afaef-8569-444a-868e-f1c6676cfa20
