"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldSpan, FormActions, FormSection } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { postJson, putJson } from "@/features/catalog/client";
import { categorySchema, type CategoryInput } from "@/features/catalog/schemas";
import type { Category } from "@/features/catalog/types";

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      is_active: category?.is_active ?? true,
    },
  });

  async function onSubmit(values: CategoryInput) {
    setFormError(null);

    const body = {
      name: values.name,
      description: values.description === "" ? null : values.description,
      is_active: values.is_active,
    };

    const result = category
      ? await putJson(`/categories/${category.id}`, body)
      : await postJson("/categories", body);

    if (!result.ok) {
      // Map server field errors back onto the form: the backend is the
      // authority even where the client already validated.
      for (const [field, messages] of Object.entries(result.failure.errors)) {
        if ((field === "name" || field === "description") && messages[0]) {
          setError(field, { message: messages[0] });
        }
      }

      setFormError(result.failure.message);

      return;
    }

    notify.success(category ? "Category updated" : "Category created", {
      description: values.name,
    });

    router.push("/categories");
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
          title="Category details"
          description="Categories group products for filtering, and each product must belong to one."
        >
          <FieldSpan>
            <Field label="Name" error={errors.name?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...register("name")}
                  placeholder="e.g. Electric Scooters"
                  disabled={isSubmitting}
                  autoFocus
                />
              )}
            </Field>
          </FieldSpan>

          <FieldSpan>
            <Field
              label="Description"
              error={errors.description?.message}
              hint="Optional. A short note about what belongs in this category."
            >
              {(props) => (
                <Textarea {...props} {...register("description")} rows={3} disabled={isSubmitting} />
              )}
            </Field>
          </FieldSpan>

          <FieldSpan>
            <Checkbox
              label="Active"
              description="Inactive categories cannot be assigned to new products."
              {...register("is_active")}
              disabled={isSubmitting}
            />
          </FieldSpan>
        </FormSection>

        <FormActions>
          <Button
            variant="secondary"
            onClick={() => router.push("/categories")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {category ? "Save changes" : "Create category"}
          </Button>
        </FormActions>
      </form>
    </Card>
  );
}
