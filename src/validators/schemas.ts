import { z } from 'zod';
import { UserRole } from '../common/constants/roles.enum';

/** Public sign-up: only these fields; role is always USER on the server (never from the client). */
export const registerSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  })
  .strict();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const adminRegisterSchema = registerSchema.extend({
  inviteSecret: z.string().min(1),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field required' });

const attachmentSchema = z.object({ title: z.string(), href: z.string() });

export const productCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  description: z.string(),
  longDescription: z.string().optional(),
  brand: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  images: z.array(z.string()).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const productUpdateSchema = productCreateSchema
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'At least one field is required' });

export const orderStatusUpdateSchema = z.object({
  order_status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export const consultationStatusUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'converted', 'closed']),
});

export const storeOrderCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  notes: z.string().optional(),
  payment_method: z.string().optional(),
  total_price: z.number().nonnegative(),
  products: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      quantity: z.number().int().nonnegative(),
      price: z.number().nonnegative(),
    }),
  ),
});

export const consultationCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  city: z.string().min(1),
  monthly_bill: z.string().optional(),
  message: z.string().optional(),
});
