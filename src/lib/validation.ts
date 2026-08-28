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

export const registerSchoolSchema = z.object({
  schoolName: z.string().trim().min(2, "Vul de naam van je rijschool in").max(120),
  ownerName: z.string().trim().min(2, "Vul je naam in").max(80),
  email: z.string().trim().toLowerCase().email("Ongeldig e-mailadres"),
  password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens zijn"),
  seats: z.coerce.number().int().min(1).max(1000).default(10),
});
