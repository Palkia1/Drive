import { z } from "zod";

export const registerStudentSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in").max(80),
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres"),
  password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens zijn"),
  schoolCode: z
    .string()
    .trim()
    .toUpperCase()
    .length(6, "Een rijschoolcode bestaat uit 6 tekens")
    .optional()
    .or(z.literal("")),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens zijn"),
});

// No `seats` field here on purpose — how many free seats a school gets is
// not the registering school's choice (see TRIAL_SEATS in register-school's
// route and the seats-limiting note in the admin schools route).
export const registerSchoolSchema = z.object({
  schoolName: z.string().trim().min(2, "Vul de naam van je rijschool in").max(120),
  ownerName: z.string().trim().min(2, "Vul je naam in").max(80),
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres"),
  password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens zijn"),
});

export const createChallengeSchema = z
  .object({
    metric: z.enum(["xp", "topic_accuracy"]),
    topicId: z.string().min(1).nullable().default(null),
    label: z.string().trim().min(2, "Geef je uitdaging een naam").max(60),
    durationHours: z.coerce.number().int().min(1).max(24 * 30),
  })
  .refine((v) => v.metric !== "topic_accuracy" || v.topicId, {
    message: "Kies een onderwerp voor een nauwkeurigheids-uitdaging",
    path: ["topicId"],
  });

export const assignHomeworkSchema = z.object({
  studentId: z.string().min(1),
  topicId: z.string().min(1).nullable().default(null),
  targetCount: z.coerce.number().int().min(1).max(200),
  note: z.string().trim().max(300).nullable().default(null),
  dueDate: z.coerce.date().nullable().default(null),
});

export const adminUpdateSchoolSchema = z
  .object({
    seats: z.coerce.number().int().min(0).max(5000).optional(),
    status: z.enum(["trial", "active", "suspended", "canceled"]).optional(),
  })
  .refine((v) => v.seats !== undefined || v.status !== undefined, {
    message: "Geef seats en/of status op",
  });
