"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageOff, Info, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldSpan, FormActions, FormSection } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { submitForm } from "@/features/catalog/client";
import { productSchema, type ProductInput } from "@/features/catalog/schemas";
import { PRODUCT_UNITS, type Brand, type Category, type Product } from "@/features/catalog/types";

/**
 * Create/edit form for a product, grouped into four sections so a long form
 * reads as several short ones.
 *
 * Two deliberate omissions:
 *   - `current_stock` has NO input. Opening stock belongs to Inventory and must
 *     move through the ledger; the API ignores the field anyway.
 *   - purchase price renders only when `canViewPurchasePrice`. The backend also
 *     omits it from responses, so this is UX consistency, not the control.
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

      // The image field has no react-hook-form registration, so surface its
      // error at form level rather than losing it.
      const imageError = result.failure.errors.image?.[0];

      setFormError(imageError ?? result.failure.message);

      return;
    }

    notify.success(product ? "Product updated" : "Product created", {
      description: values.name,
    });

    router.push("/products");
    router.refresh();
  }

  const existingImage = product?.image_url && !removeImage ? product.image_url : null;

  return (
    <Card className="overflow-hidden">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pt-6" noValidate>
        {formError ? (
          <div className="mb-5">
            <FormAlert message={formError} />
          </div>
        ) : null}

        {/* ---------------------------------------------- Basic information */}
        <FormSection
          title="Basic information"
          description="What the product is, and where it sits in the catalog."
        >
          <FieldSpan>
            <Field label="Product name" error={errors.name?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...register("name")}
                  placeholder="e.g. VoltRide S1 Electric Scooter"
                  disabled={isSubmitting}
                  autoFocus
                />
              )}
            </Field>
          </FieldSpan>

          <Field
            label="SKU / product code"
            error={errors.sku?.message}
            hint="Must be unique, including archived products."
            required
          >
            {(props) => (
              <Input
                {...props}
                {...register("sku")}
                placeholder="e.g. VR-S1-2026"
                disabled={isSubmitting}
                className="font-mono text-xs"
              />
            )}
          </Field>

          <Field label="Model" error={errors.model?.message} hint="Optional.">
            {(props) => (
              <Input {...props} {...register("model")} placeholder="e.g. S1-2026" disabled={isSubmitting} />
            )}
          </Field>

          <Field label="Category" error={errors.category_id?.message} required>
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
        </FormSection>

        {/* --------------------------------------------------- Pricing & tax */}
        <FormSection
          title="Pricing &amp; tax"
          description="GST is set per product — scooters and batteries are taxed differently."
        >
          <Field
            label="Selling price"
            error={errors.selling_price?.message}
            labelSuffix="₹"
            required
          >
            {(props) => (
              <Input
                {...props}
                {...register("selling_price")}
                inputMode="decimal"
                placeholder="0.00"
                disabled={isSubmitting}
                className="num"
              />
            )}
          </Field>

          {canViewPurchasePrice ? (
            <Field
              label="Purchase price"
              error={errors.purchase_price?.message}
              labelSuffix="₹"
              hint="Optional. Only visible with permission."
            >
              {(props) => (
                <Input
                  {...props}
                  {...register("purchase_price")}
                  inputMode="decimal"
                  placeholder="0.00"
                  disabled={isSubmitting}
                  className="num"
                />
              )}
            </Field>
          ) : null}

          <Field label="GST rate" error={errors.gst_rate?.message} labelSuffix="%" required>
            {(props) => (
              <Input
                {...props}
                {...register("gst_rate")}
                inputMode="decimal"
                placeholder="18.00"
                disabled={isSubmitting}
                className="num"
              />
            )}
          </Field>

          <Field
            label="HSN / SAC code"
            error={errors.hsn_code?.message}
            hint="Optional. 4–8 digits."
          >
            {(props) => (
              <Input
                {...props}
                {...register("hsn_code")}
                inputMode="numeric"
                placeholder="e.g. 87116020"
                disabled={isSubmitting}
                className="font-mono text-xs"
              />
            )}
          </Field>
        </FormSection>

        {/* ---------------------------------------------- Inventory settings */}
        <FormSection
          title="Inventory settings"
          description="How this product is counted, and when it should be reordered."
        >
          <Field label="Unit" error={errors.unit?.message} required>
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

          <Field
            label="Minimum stock level"
            error={errors.min_stock_level?.message}
            hint="Low-stock threshold for alerts."
          >
            {(props) => (
              <Input
                {...props}
                {...register("min_stock_level")}
                inputMode="decimal"
                placeholder="0"
                disabled={isSubmitting}
                className="num"
              />
            )}
          </Field>

          <FieldSpan>
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3.5 py-3">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
              <p className="text-xs leading-relaxed text-fg-muted">
                Current stock is not editable here. Opening stock and adjustments
                are recorded in Inventory so every change leaves an auditable
                movement.
                {product ? (
                  <>
                    {" "}
                    This product currently holds{" "}
                    <span className="num font-medium text-fg">{product.current_stock}</span>{" "}
                    {product.unit}.
                  </>
                ) : (
                  " New products start at zero."
                )}
              </p>
            </div>
          </FieldSpan>
        </FormSection>

        {/* ----------------------------------------------------- Details */}
        <FormSection title="Details" description="Description, image and availability.">
          <FieldSpan>
            <Field label="Description" error={errors.description?.message} hint="Optional.">
              {(props) => (
                <Textarea {...props} {...register("description")} rows={3} disabled={isSubmitting} />
              )}
            </Field>
          </FieldSpan>

          <FieldSpan>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-1 text-[0.8125rem] font-medium text-fg">Product image</legend>

              <div className="flex flex-wrap items-center gap-4">
                <div
                  aria-hidden={existingImage ? undefined : "true"}
                  className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface-inset text-fg-subtle"
                >
                  {existingImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- the
                       API returns an absolute storage URL that is not a
                       configured next/image remote pattern; this is a small
                       admin thumbnail. */
                    <img
                      src={existingImage}
                      alt={`Current image for ${product?.name ?? "product"}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageOff className="size-5" />
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <label
                    htmlFor="product-image"
                    className="inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-surface px-3.5 text-sm font-medium text-fg shadow-xs transition-colors hover:bg-surface-hover"
                  >
                    <Upload aria-hidden="true" className="size-4" />
                    {imageFile ? "Change file" : existingImage ? "Replace image" : "Choose image"}
                  </label>
                  <input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      setImageFile(event.target.files?.[0] ?? null);
                      setRemoveImage(false);
                    }}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  <p className="text-xs text-fg-subtle">
                    {imageFile ? imageFile.name : "JPEG, PNG or WebP, up to 2 MB."}
                  </p>
                </div>

                {product?.image_url ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => {
                      setRemoveImage((current) => !current);
                      setImageFile(null);
                    }}
                    className={removeImage ? "text-primary-600" : "text-danger-700"}
                  >
                    {removeImage ? "Keep existing image" : "Remove image"}
                  </Button>
                ) : null}
              </div>

              {removeImage ? (
                <p className="text-xs font-medium text-warning-700">
                  The existing image will be removed when you save.
                </p>
              ) : null}
            </fieldset>
          </FieldSpan>

          <FieldSpan>
            <Checkbox
              label="Active"
              description="Inactive products stay in the catalog but cannot be added to new invoices."
              {...register("is_active")}
              disabled={isSubmitting}
            />
          </FieldSpan>
        </FormSection>

        <FormActions>
          <Button
            variant="secondary"
            onClick={() => router.push("/products")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {product ? "Save changes" : "Create product"}
          </Button>
        </FormActions>
      </form>
    </Card>
  );
}
