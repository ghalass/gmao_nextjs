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

export default function LoginPage() {
  const { login } = useAuth();
  // ✅ Schémas de validation individuels pour chaque champ
  const emailSchema = Yup.string().email().required().label("Adresse Email");
  const passwordSchema = Yup.string().min(6).required().label("Mot de passe");

  // ✅ Schéma global pour la soumission
  const validationSchema = Yup.object({
    email: emailSchema,
    password: passwordSchema,
  });

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ✅ Configuration du formulaire TanStack avec validation
  const form = useForm({
    defaultValues: {
      email: "sidi@gmail.com",
      password: "123456",
    },
    onSubmit: async ({ value }) => {
      try {
        setError("");
        setIsSubmitting(true);
        await validationSchema.validate(value, { abortEarly: false });

        // ✅ Appel direct de ta fonction
        await login(value.email, value.password);
      } catch (err: any) {
        console.error("Erreur d’inscription:", err);
        setError(err.message || "Erreur lors de la connection");
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
          <CardTitle>Se connecter</CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder à votre compte.
            {error && <p className="text-red-400">{error}</p>}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              {/* EMAIL avec validation */}
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    try {
                      emailSchema.validateSync(value);
                      return undefined;
                    } catch (err) {
                      if (err instanceof Yup.ValidationError) {
                        return err.message;
                      }
                      return "Erreur de validation";
                    }
                  },
                  onBlur: ({ value }) => {
                    try {
                      emailSchema.validateSync(value);
                      return undefined;
                    } catch (err) {
                      if (err instanceof Yup.ValidationError) {
                        return err.message;
                      }
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

              {/* PASSWORD avec validation */}
              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    try {
                      passwordSchema.validateSync(value);
                      return undefined;
                    } catch (err) {
                      if (err instanceof Yup.ValidationError) {
                        return err.message;
                      }
                      return "Erreur de validation";
                    }
                  },
                  onBlur: ({ value }) => {
                    try {
                      passwordSchema.validateSync(value);
                      return undefined;
                    } catch (err) {
                      if (err instanceof Yup.ValidationError) {
                        return err.message;
                      }
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
            <Button type="submit" form="login-form" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </Field>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Pas de compte ?{" "}
            <Link href="/register" className="text-blue-500 hover:underline">
              S’inscrire
            </Link>
          </p>
          {/* <p className="text-sm text-gray-500 mt-4 text-center">
            <Link href="/" className="text-blue-500 hover:underline">
              Page d'acceuil
            </Link>
          </p> */}
        </CardFooter>
      </Card>
    </div>
  );
}
