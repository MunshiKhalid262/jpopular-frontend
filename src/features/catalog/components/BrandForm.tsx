"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldSpan, FormActions, FormSection } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Checkbox, Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { postJson, putJson } from "@/features/catalog/client";
import { brandSchema, type BrandInput } from "@/features/catalog/schemas";
import type { Brand } from "@/features/catalog/types";

export function BrandForm({ brand }: { brand?: Brand }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      is_active: brand?.is_active ?? true,
    },
  });

  async function onSubmit(values: BrandInput) {
    setFormError(null);

    const result = brand
      ? await putJson(`/brands/${brand.id}`, values)
      : await postJson("/brands", values);

    if (!result.ok) {
      if (result.failure.errors.name?.[0]) {
        setError("name", { message: result.failure.errors.name[0] });
      }

      setFormError(result.failure.message);

      return;
    }

    notify.success(brand ? "Brand updated" : "Brand created", { description: values.name });

    router.push("/brands");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pt-6" noValidate>
        {formError ? (
          <div className="mb-5">
            <FormAlert message={formError} />
          </div>
        ) : null}

        <FormSection
          title="Brand details"
          description="Brands are optional on a product, but they keep the catalog filterable and prevent name drift."
        >
          <FieldSpan>
            <Field label="Name" error={errors.name?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...register("name")}
                  placeholder="e.g. VoltRide"
                  disabled={isSubmitting}
                  autoFocus
                />
              )}
            </Field>
          </FieldSpan>

          <FieldSpan>
            <Checkbox
              label="Active"
              description="Inactive brands cannot be assigned to new products."
              {...register("is_active")}
              disabled={isSubmitting}
            />
          </FieldSpan>
        </FormSection>

        <FormActions>
          <Button variant="secondary" onClick={() => router.push("/brands")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {brand ? "Save changes" : "Create brand"}
          </Button>
        </FormActions>
      </form>
    </Card>
  );
}
