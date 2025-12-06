"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import ModeToggle from "@/components/ModeToggle";
import Yup from "@/lib/yupFr";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();

  const nameSchema = Yup.string().min(3).required().label("Nom complet");
  const emailSchema = Yup.string().email().required().label("Adresse Email");
  const passwordSchema = Yup.string().min(6).required().label("Mot de passe");

  const validationSchema = Yup.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
  });

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setError("");
        setIsSubmitting(true);
        await validationSchema.validate(value, { abortEarly: false });

        // ✅ Appel direct de ta fonction
        await register(value.name, value.email, value.password);
      } catch (err: any) {
        console.error("Erreur d’inscription:", err);
        setError(err.message || "Erreur lors de l’inscription");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col gap-2 items-center justify-center">
      <ModeToggle />
      <Card className="w-md">
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Remplissez le formulaire pour créer votre compte.
            {error && <p className="text-red-400">{error}</p>}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="register-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              {/* Nom */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    try {
                      nameSchema.validateSync(value);
                      return undefined;
                    } catch (err) {
                      if (err instanceof Yup.ValidationError)
                        return err.message;
                      return "Erreur de validation";
                    }
                  },
                }}
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Nom complet</FieldLabel>
                      <Input
                        disabled={isSubmitting}
                        id={field.name}
                        name={field.name}
                        type="text"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Jean Dupont"
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError
                          errors={field.state.meta.errors.map((err) => ({
                            message: err,
                          }))}
                        />
                      )}
                    </Field>
                  );
                }}
              />

              {/* Email */}
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    try {
                      emailSchema.validateSync(value);
                      return undefined;
                    } catch (err) {
                      if (err instanceof Yup.ValidationError)
                        return err.message;
                      return "Erreur de validation";
                    }
                  },
                }}
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        disabled={isSubmitting}
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="exemple@email.com"
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError
                          errors={field.state.meta.errors.map((err) => ({
                            message: err,
                          }))}
                        />
                      )}
                    </Field>
                  );
                }}
              />

              {/* Mot de passe */}
              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    try {
                      passwordSchema.validateSync(value);
                      return undefined;
                    } catch (err) {
                      if (err instanceof Yup.ValidationError)
                        return err.message;
                      return "Erreur de validation";
                    }
                  },
                }}
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Mot de passe</FieldLabel>
                      <Input
                        disabled={isSubmitting}
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="********"
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError
                          errors={field.state.meta.errors.map((err) => ({
                            message: err,
                          }))}
                        />
                      )}
                    </Field>
                  );
                }}
              />
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Field orientation="horizontal">
            <Button
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => {
                form.reset(), setError("");
              }}
            >
              Réinitialiser
            </Button>
            <Button type="submit" form="register-form" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Création...
                </span>
              ) : (
                "S’inscrire"
              )}
            </Button>
          </Field>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-blue-500 hover:underline">
              Se connecter
            </Link>
          </p>
          {/* <p className="text-sm text-gray-500 mt-4 text-center">
            <Link href="/" className="text-blue-500 hover:underline">
              Page d'accueil
            </Link>
          </p> */}
        </CardFooter>
      </Card>
    </div>
  );
}
