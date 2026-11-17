import { useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { MapPin, Store, LayoutDashboard, Shield } from "lucide-react";
import { UserButton } from "@clerk/react";
import { Toaster } from "@/components/ui/sonner";
import { buttonVariants } from "@/components/ui/button";
import { useMe, useSettings } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function Layout() {
  const s = useSettings();
  const { data: me } = useMe();

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--brand-primary", s.primary_color);
    root.setProperty("--brand-secondary", s.secondary_color);
    document.title = `${s.platform_name} · ${s.city}`;
  }, [s.primary_color, s.secondary_color, s.platform_name, s.city]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-brand/95 backdrop-blur text-white shadow-sm" data-testid="site-header">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" data-testid="header-logo-link">
            {s.logo_url && (
              <img src={s.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20" data-testid="header-logo-img" />
            )}
            <span className="font-extrabold tracking-tight text-lg text-cream" data-testid="header-platform-name">
              {s.platform_name}
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium" data-testid="header-city">
            <MapPin className="size-3.5" /> {s.city}
          </span>
          <nav className="ml-auto flex items-center gap-1.5">
            {!me?.business_id && me?.role !== "admin" && (
              <Link to="/cadastro-empresa" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="nav-register-business">
                <Store className="size-4" /> Cadastre sua empresa
              </Link>
            )}
            {me?.business_id && (me.role === "business" || me.role === "admin") && (
              <Link to="/painel-empresa" className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="nav-business-panel">
                <LayoutDashboard className="size-4" /> Meu painel
              </Link>
            )}
            {me?.role === "admin" && (
              <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" data-testid="nav-admin">
                <Shield className="size-4" /> Admin
              </Link>
            )}
            {me ? (
              <span className="ml-1 inline-flex items-center" data-testid="nav-user-button"><UserButton /></span>
            ) : (
              <Link to="/sign-in" className={cn(buttonVariants({ size: "sm" }), "bg-cream text-brand hover:bg-cream/90")} data-testid="nav-login-link">
                Entrar com Google
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-300 mt-16" data-testid="site-footer">
        <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 sm:grid-cols-3 text-sm">
          <div>
            <p className="font-bold text-white text-base">{s.platform_name}</p>
            <p className="mt-2 text-slate-400">O catálogo digital do comércio de {s.city}. Gratuito para quem busca.</p>
          </div>
          <div>
            <p className="font-semibold text-white">Para empresas</p>
            <Link to="/cadastro-empresa" className="block mt-2 hover:text-white transition-colors" data-testid="footer-register-business">Solicitar cadastro</Link>
            <Link to="/sign-in" className="block mt-1 hover:text-white transition-colors" data-testid="footer-login">Acessar painel</Link>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Não realizamos vendas nem pagamentos. Toda negociação, pagamento e entrega é feita diretamente com a empresa.
          </p>
        </div>
      </footer>
      <Toaster richColors />
    </div>
  );
}
