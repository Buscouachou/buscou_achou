import { SignIn, SignUp } from "@clerk/react";
import { useSettings } from "@/lib/hooks";

export default function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const s = useSettings();
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 grid lg:grid-cols-2 gap-8 items-center">
      <div className="hidden lg:flex flex-col justify-between self-stretch rounded-3xl bg-brand p-10 text-white min-h-[460px]">
        {s.logo_url && <img src={s.logo_url} alt="" className="h-20 w-20 rounded-2xl" />}
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-cream">{s.platform_name}</p>
          <p className="mt-3 text-white/80">Entre com sua conta Google para avaliar empresas, cadastrar seu negócio ou acessar seu painel.</p>
        </div>
      </div>
      <div className="flex items-center justify-center" data-testid={`${mode}-container`}>
        {mode === "sign-in" ? (
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" withSignUp />
        ) : (
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
        )}
      </div>
    </div>
  );
}
