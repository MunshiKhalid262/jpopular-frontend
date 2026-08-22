import { z } from "zod";

/**
 * Client-side validation, kept deliberately aligned with the Laravel Form
 * Requests. Money is validated as a STRING against the same shape the backend
 * enforces (DECIMAL(14,2), no scientific notation), so nothing is coerced
 * through a float on the way in.
 *
 * The server revalidates everything and its verdict wins.
 */

const MONEY_REGEX = /^\d{1,12}(\.\d{1,2})?$/;
const QUANTITY_REGEX = /^\d{1,9}(\.\d{1,3})?$/;
const RATE_REGEX = /^\d{1,3}(\.\d{1,2})?$/;

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(""));

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  description: optionalText(2000),
  is_active: z.boolean(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const brandSchema = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  is_active: z.boolean(),
});

export type BrandInput = z.infer<typeof brandSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required.").max(200),
  sku: z
    .string()
    .min(1, "SKU is required.")
    .max(64)
    .refine((v) => v.trim().length > 0, "SKU is required."),

  category_id: z
    .string()
    .min(1, "Choose a category."),
  brand_id: z.string().optional().or(z.literal("")),

  model: optionalText(120),
  description: optionalText(5000),

  unit: z.enum(["pcs", "set", "box", "metre"]),

  hsn_code: z
    .string()
    .regex(/^\d{4,8}$/, "HSN/SAC must be 4 to 8 digits.")
    .optional()
    .or(z.literal("")),

  gst_rate: z
    .string()
    .min(1, "GST rate is required.")
    .regex(RATE_REGEX, "Use a number with at most two decimals.")
    .refine((v) => Number.parseFloat(v) <= 100, "GST rate cannot exceed 100%."),

  selling_price: z
    .string()
    .min(1, "Selling price is required.")
    .regex(MONEY_REGEX, "Use a positive amount with at most two decimals."),

  purchase_price: z
    .string()
    .regex(MONEY_REGEX, "Use a positive amount with at most two decimals.")
    .optional()
    .or(z.literal("")),

  min_stock_level: z
    .string()
    .regex(QUANTITY_REGEX, "Use zero or a positive number.")
    .optional()
    .or(z.literal("")),

  is_active: z.boolean(),
});

export type ProductInput = z.infer<typeof productSchema>;
