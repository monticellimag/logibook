import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  email: z.string().email("Inserisci un indirizzo email valido"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri").optional().nullable(),
  role: z.enum(['admin', 'user', 'gate']).default('user'),
  depotId: z.string().optional().nullable(),
  vatNumber: z.string().min(1, "La partita IVA è obbligatoria").optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const LoginSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
  password: z.string().min(1, "La password è obbligatoria"),
});

export const BookingSchema = z.object({
  date: z.string().min(1, "La data è obbligatoria"),
  time: z.string().min(1, "L'orario è obbligatorio"),
  depotId: z.string().min(1, "Il deposito è obbligatorio"),
  carrierName: z.string().min(1, "Il nome dell'autista è obbligatorio"),
  licensePlate: z.string().min(1, "La targa è obbligatoria"),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  orderRef: z.string().min(1, "Il riferimento ordine è obbligatorio"),
  notes: z.string().optional().nullable(),
  operationType: z.string().default('Carico completo o parziale'),
  pallets: z.number().int().nonnegative().default(0),
  difficulty: z.string().default('standard'),
  isEmergency: z.boolean().default(false),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional().nullable(),
  newPassword: z.string().min(6, "La nuova password deve avere almeno 6 caratteri"),
  confirmPassword: z.string().optional().nullable(),
}).refine((data) => {
  if (data.confirmPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

export const ApproveRequestSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['admin', 'user', 'gate']).optional(),
  depotId: z.string().optional().nullable(),
});

export const DeleteUserSchema = z.object({
  id: z.string().min(1, "ID utente obbligatorio"),
});

