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
import yup from "@/lib/yupFr";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Ajouté pour la redirection
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter(); // Pour la redirection après connexion

  // ✅ Schémas de validation
  const emailSchema = yup
    .string()
    .email("Format d'email invalide")
    .required("L'email est requis")
    .label("Adresse Email");
  const passwordSchema = yup
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .required("Le mot de passe est requis")
    .label("Mot de passe");

  // ✅ Schéma global pour la soumission
  const validationSchema = yup.object({
    email: emailSchema,
    password: passwordSchema,
  });

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ✅ Configuration du formulaire TanStack avec validation
  const form = useForm({
    defaultValues: {
      email: "sidi@gmail.com",
      password: "1234560",
    },
    onSubmit: async ({ value }) => {
      try {
        setError("");
        setIsSubmitting(true);
        await validationSchema.validate(value, { abortEarly: false });
        const success = await login(value.email, value.password);
        if (success) {
          router.push("/"); // ou router.refresh() pour revalider les données
          toast.success("Connecté avec succès");
        } else {
          setError("Échec de la connexion. Vérifiez vos identifiants.");
        }
      } catch (err: any) {
        console.error("Erreur de connexion:", err);

        if (err.name === "ValidationError" && err.errors) {
          setError(err.errors.join(", "));
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(err.message || "Erreur lors de la connexion");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center p-4">
      <div className="self-center">
        <ModeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Se connecter</CardTitle>
          <CardDescription className="text-center">
            Entrez vos identifiants pour accéder à votre compte.
          </CardDescription>
          {error && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <form
            id="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup className="space-y-4">
              {/* EMAIL avec validation */}
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    try {
                      emailSchema.validateSync(value);
                      return undefined;
                    } catch (err: any) {
                      return err.message || "Email invalide";
                    }
                  },
                  onBlur: ({ value }) => {
                    try {
                      emailSchema.validateSync(value);
                      return undefined;
                    } catch (err: any) {
                      return err.message || "Email invalide";
                    }
                  },
                }}
              >
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Email
                        <span className="text-destructive"> *</span>
                      </FieldLabel>
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
                        autoComplete="email"
                        className={isInvalid ? "border-destructive" : ""}
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
              </form.Field>

              {/* PASSWORD avec validation */}
              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    try {
                      passwordSchema.validateSync(value);
                      return undefined;
                    } catch (err: any) {
                      return err.message || "Mot de passe invalide";
                    }
                  },
                  onBlur: ({ value }) => {
                    try {
                      passwordSchema.validateSync(value);
                      return undefined;
                    } catch (err: any) {
                      return err.message || "Mot de passe invalide";
                    }
                  },
                }}
              >
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Mot de passe
                        <span className="text-destructive"> *</span>
                      </FieldLabel>
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
                        autoComplete="current-password"
                        className={isInvalid ? "border-destructive" : ""}
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
              </form.Field>
            </FieldGroup>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <div className="w-full">
            <Button
              type="submit"
              form="login-form"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" /> Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </div>

          <div className="flex justify-center w-full">
            <Button
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setError("");
              }}
              size="sm"
            >
              Réinitialiser
            </Button>
          </div>

          <div className="text-center space-y-2 text-sm">
            <p className="text-muted-foreground">
              Pas de compte ?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                S&apos;inscrire
              </Link>
            </p>
            <p className="text-muted-foreground">
              <Link
                href="/"
                className="text-primary hover:underline font-medium"
              >
                Retour à la page d&apos;accueil
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
