"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/ui/Field";
import { Button, FormAlert, Select, TextInput } from "@/components/ui/controls";
import { submitForm } from "@/features/catalog/client";
import { productSchema, type ProductInput } from "@/features/catalog/schemas";
import { PRODUCT_UNITS, type Brand, type Category, type Product } from "@/features/catalog/types";

/**
 * Create/edit form for a product.
 *
 * Two deliberate omissions:
 *   - `current_stock` has no input at all. Opening stock belongs to Inventory
 *     and must move through the ledger; the API would ignore it anyway.
 *   - purchase price renders only when `canViewPurchasePrice` is true. The
 *     backend also omits the field from responses and would accept it, so this
 *     is UX consistency, not the control itself.
 */
export function ProductForm({
  product,
  categories,
  brands,
  canViewPurchasePrice,
}: {
  product?: Product;
  categories: Category[];
  brands: Brand[];
  canViewPurchasePrice: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      category_id: product ? String(product.category_id) : "",
      brand_id: product?.brand_id ? String(product.brand_id) : "",
      model: product?.model ?? "",
      description: product?.description ?? "",
      unit: (product?.unit as ProductInput["unit"]) ?? "pcs",
      hsn_code: product?.hsn_code ?? "",
      gst_rate: product?.gst_rate ?? "18.00",
      selling_price: product?.selling_price ?? "",
      purchase_price: product?.purchase_price ?? "",
      min_stock_level: product?.min_stock_level ?? "0",
      is_active: product?.is_active ?? true,
    },
  });

  async function onSubmit(values: ProductInput) {
    setFormError(null);

    const form = new FormData();
    form.set("name", values.name);
    form.set("sku", values.sku.trim());
    form.set("category_id", values.category_id);
    form.set("unit", values.unit);
    form.set("gst_rate", values.gst_rate);
    form.set("selling_price", values.selling_price);
    form.set("is_active", values.is_active ? "1" : "0");

    if (values.brand_id) form.set("brand_id", values.brand_id);
    if (values.model) form.set("model", values.model);
    if (values.description) form.set("description", values.description);
    if (values.hsn_code) form.set("hsn_code", values.hsn_code);
    if (values.min_stock_level) form.set("min_stock_level", values.min_stock_level);

    // Never send the field at all when the user may not see it.
    if (canViewPurchasePrice && values.purchase_price) {
      form.set("purchase_price", values.purchase_price);
    }

    if (imageFile) form.set("image", imageFile);
    if (removeImage) form.set("remove_image", "1");

    const result = await submitForm<Product>(
      product ? `/products/${product.id}` : "/products",
      form,
      product ? "PUT" : "POST",
    );

    if (!result.ok) {
      const fields: (keyof ProductInput)[] = [
        "name", "sku", "category_id", "brand_id", "model", "description",
        "unit", "hsn_code", "gst_rate", "selling_price", "purchase_price",
        "min_stock_level",
      ];

      for (const field of fields) {
        const message = result.failure.errors[field]?.[0];

        if (message) {
          setError(field, { message });
        }
      }

      setFormError(result.failure.message);

      return;
    }

    router.push("/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {formError ? <FormAlert message={formError} /> : null}

      <section className="grid gap-5 sm:grid-cols-2">
        <Field label="Product name" error={errors.name?.message}>
          {(props) => <TextInput {...props} {...register("name")} disabled={isSubmitting} autoFocus />}
        </Field>

        <Field label="SKU / product code" error={errors.sku?.message} hint="Must be unique, including archived products.">
          {(props) => <TextInput {...props} {...register("sku")} disabled={isSubmitting} />}
        </Field>

        <Field label="Category" error={errors.category_id?.message}>
          {(props) => (
            <Select {...props} {...register("category_id")} disabled={isSubmitting}>
              <option value="">Select a category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Brand" error={errors.brand_id?.message} hint="Optional.">
          {(props) => (
            <Select {...props} {...register("brand_id")} disabled={isSubmitting}>
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Model" error={errors.model?.message} hint="Optional, e.g. 450X Gen 3.">
          {(props) => <TextInput {...props} {...register("model")} disabled={isSubmitting} />}
        </Field>

        <Field label="Unit" error={errors.unit?.message}>
          {(props) => (
            <Select {...props} {...register("unit")} disabled={isSubmitting}>
              {PRODUCT_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </section>

      <Field label="Description" error={errors.description?.message} hint="Optional.">
        {(props) => (
          <textarea
            {...props}
            {...register("description")}
            rows={3}
            disabled={isSubmitting}
            className="w-full rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm text-ink disabled:bg-canvas"
          />
        )}
      </Field>

      <section className="grid gap-5 sm:grid-cols-3">
        <Field label="HSN / SAC code" error={errors.hsn_code?.message} hint="4–8 digits, optional.">
          {(props) => <TextInput {...props} {...register("hsn_code")} inputMode="numeric" disabled={isSubmitting} />}
        </Field>

        <Field label="GST rate (%)" error={errors.gst_rate?.message} hint="Per product — scooters and batteries differ.">
          {(props) => <TextInput {...props} {...register("gst_rate")} inputMode="decimal" disabled={isSubmitting} />}
        </Field>

        <Field label="Selling price (₹)" error={errors.selling_price?.message}>
          {(props) => <TextInput {...props} {...register("selling_price")} inputMode="decimal" disabled={isSubmitting} />}
        </Field>

        {canViewPurchasePrice ? (
          <Field
            label="Purchase price (₹)"
            error={errors.purchase_price?.message}
            hint="Optional. Visible only with permission."
          >
            {(props) => (
              <TextInput {...props} {...register("purchase_price")} inputMode="decimal" disabled={isSubmitting} />
            )}
          </Field>
        ) : null}

        <Field label="Minimum stock level" error={errors.min_stock_level?.message} hint="Low-stock threshold.">
          {(props) => (
            <TextInput {...props} {...register("min_stock_level")} inputMode="decimal" disabled={isSubmitting} />
          )}
        </Field>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-canvas/60 p-4">
        <p className="text-sm font-medium text-ink">Product image</p>

        {product?.image_url && !removeImage ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- the API
                returns an absolute storage URL that is not configured as a
                next/image remote pattern; this is a small admin thumbnail. */}
            <img
              src={product.image_url}
              alt={`${product.name} image`}
              className="h-16 w-16 rounded-[--radius-control] border border-line object-cover"
            />
            <button
              type="button"
              onClick={() => setRemoveImage(true)}
              className="text-sm font-medium text-danger hover:underline"
              disabled={isSubmitting}
            >
              Remove image
            </button>
          </div>
        ) : null}

        {removeImage ? (
          <p className="text-xs text-ink-muted">
            The existing image will be removed when you save.{" "}
            <button
              type="button"
              onClick={() => setRemoveImage(false)}
              className="font-medium text-brand hover:underline"
            >
              Keep it
            </button>
          </p>
        ) : null}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          disabled={isSubmitting}
          className="text-sm text-ink-muted"
        />
        <p className="text-xs text-ink-subtle">JPEG, PNG or WebP, up to 2 MB.</p>
      </section>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          {...register("is_active")}
          disabled={isSubmitting}
          className="h-4 w-4 rounded border-line"
        />
        Active
      </label>

      <p className="rounded-[--radius-control] border border-line bg-canvas px-3 py-2 text-xs text-ink-muted">
        Stock is not editable here. Opening stock and adjustments are recorded in
        Inventory so every change leaves an auditable movement.
      </p>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/products")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
