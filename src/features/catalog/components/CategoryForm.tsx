"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/ui/Field";
import { Button, FormAlert, TextInput } from "@/components/ui/controls";
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
      // Map server field errors back onto the form; the backend is the
      // authority even where the client already validated.
      for (const [field, messages] of Object.entries(result.failure.errors)) {
        if (field === "name" || field === "description") {
          setError(field, { message: messages[0] });
        }
      }

      setFormError(result.failure.message);

      return;
    }

    router.push("/categories");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-lg flex-col gap-5" noValidate>
      {formError ? <FormAlert message={formError} /> : null}

      <Field label="Name" error={errors.name?.message}>
        {(props) => (
          <TextInput {...props} {...register("name")} disabled={isSubmitting} autoFocus />
        )}
      </Field>

      <Field label="Description" error={errors.description?.message} hint="Optional.">
        {(props) => (
          <textarea
            {...props}
            {...register("description")}
            rows={3}
            disabled={isSubmitting}
            className="w-full rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle disabled:bg-canvas"
          />
        )}
      </Field>

      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          {...register("is_active")}
          disabled={isSubmitting}
          className="h-4 w-4 rounded border-line"
        />
        Active
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : category ? "Save changes" : "Create category"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/categories")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
