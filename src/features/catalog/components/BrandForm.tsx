"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/ui/Field";
import { Button, FormAlert, TextInput } from "@/components/ui/controls";
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

    router.push("/brands");
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
          {isSubmitting ? "Saving…" : brand ? "Save changes" : "Create brand"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/brands")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
