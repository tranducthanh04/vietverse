import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/vietverse'),
  JWT_SECRET: z.string().min(16).default('vietverse_jwt_access_secret_super_key_2026'),
  JWT_REFRESH_SECRET: z.string().min(16).default('vietverse_jwt_refresh_secret_super_key_2026'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@vietverse.edu.vn'),
  SEED_ADMIN_PASSWORD: z.string().default('AdminPass123!'),
  SEED_PARENT_EMAIL: z.string().email().default('phuhuynh@vietverse.edu.vn'),
  SEED_PARENT_PASSWORD: z.string().default('ParentPass123!'),
  PAYOS_CLIENT_ID: z.string().optional().default(''),
  PAYOS_API_KEY: z.string().optional().default(''),
  PAYOS_CHECKSUM_KEY: z.string().optional().default(''),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (data.JWT_SECRET === 'vietverse_jwt_access_secret_super_key_2026') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_SECRET không được dùng giá trị mặc định khi chạy ở môi trường production.',
        path: ['JWT_SECRET'],
      });
    }
    if (data.JWT_REFRESH_SECRET === 'vietverse_jwt_refresh_secret_super_key_2026') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_REFRESH_SECRET không được dùng giá trị mặc định khi chạy ở môi trường production.',
        path: ['JWT_REFRESH_SECRET'],
      });
    }
    if (!data.CLIENT_ORIGIN.startsWith('https://')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CLIENT_ORIGIN phải dùng HTTPS khi chạy production.',
        path: ['CLIENT_ORIGIN'],
      });
    }
  }
  const payosKeys = [data.PAYOS_CLIENT_ID, data.PAYOS_API_KEY, data.PAYOS_CHECKSUM_KEY];
  if (payosKeys.some(Boolean) && !payosKeys.every(Boolean)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cần cấu hình đầy đủ PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY.',
      path: ['PAYOS_CLIENT_ID'],
    });
  }
  if (payosKeys.some((key) => key.toLowerCase().includes('your_payos'))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Không được dùng giá trị placeholder cho thông tin PayOS.',
      path: ['PAYOS_CLIENT_ID'],
    });
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
