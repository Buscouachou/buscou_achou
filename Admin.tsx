import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stars } from "@/components/Reviews";
import { apiDelete, apiGet, apiPatch, apiPut } from "@/lib/api";
import { errMsg, fmtDate, useMe, useSettings } from "@/lib/hooks";
import type { BizStatus, Business, Ok, Review, Settings, UsersOut } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_LABEL: Record<string, string> = { pending: "Em análise", approved: "Aprovada", rejected: "Recusada" };

function BrandingTab() {
  const qc = useQueryClient();
  const current = useSettings();
  const [form, setForm] = useState<Settings>(current);
  useEffect(() => setForm(current), [current]);
  const [banner, setBanner] = useState({ image: "", title: "", subtitle: "" });

  const m = useMutation({
    mutationFn: (body: Settings) => apiPut<Settings>("/admin/settings", body),
    onSuccess: (s) => {
      qc.setQueryData(["settings"], s);
      toast.success("Identidade visual salva");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const text = (k: keyof Settings, label: string, testid: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={testid}>{label}</Label>
      <Input id={testid} value={form[k] as string} onChange={(e) => setForm({ ...form, [k]: e.target.value })} data-testid={testid} />
    </div>
  );
  const color = (k: "primary_color" | "secondary_color", label: string, testid: string) => (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input type="color" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="h-9 w-12 rounded-md border cursor-pointer" data-testid={`${testid}-picker`} />
        <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} data-testid={testid} />
      </div>
    </div>
  );

  return (
    <form
      className="grid lg:grid-cols-[1fr_320px] gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate(form);
      }}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border bg-card p-6 grid gap-4 sm:grid-cols-2">
          <h2 className="font-bold sm:col-span-2">Marca</h2>
          {text("platform_name", "Nome da plataforma", "settings-name-input")}
          {text("city", "Cidade/região exibida", "settings-city-input")}
          {text("logo_url", "Logotipo (URL da imagem)", "settings-logo-input")}
          {text("hero_image", "Imagem de destaque do topo (URL)", "settings-hero-image-input")}
          {color("primary_color", "Cor principal", "settings-primary-color")}
          {color("secondary_color", "Cor secundária", "settings-secondary-color")}
          <div className="sm:col-span-2">{text("hero_title", "Título de destaque", "settings-hero-title-input")}</div>
          <div className="sm:col-span-2">{text("hero_subtitle", "Subtítulo de destaque", "settings-hero-subtitle-input")}</div>
        </section>
        <section className="rounded-3xl border bg-card p-6 space-y-4" data-testid="banners-manager">
          <h2 className="font-bold">Banners da página inicial</h2>
          {form.banners.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border p-2" data-testid={`admin-banner-${b.id}`}>
              <img src={b.image} alt="" className="h-14 w-24 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{b.title || "(sem título)"}</p>
                <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>
              </div>
              <Button type="button" size="icon-sm" variant="ghost" onClick={() => setForm({ ...form, banners: form.banners.filter((x) => x.id !== b.id) })} data-testid={`remove-banner-${b.id}`}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <Input placeholder="URL da imagem" value={banner.image} onChange={(e) => setBanner({ ...banner, image: e.target.value })} data-testid="new-banner-image-input" />
            <Input placeholder="Título" value={banner.title} onChange={(e) => setBanner({ ...banner, title: e.target.value })} data-testid="new-banner-title-input" />
            <Input placeholder="Subtítulo" value={banner.subtitle} onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })} data-testid="new-banner-subtitle-input" />
            <Button
              type="button"
              variant="outline"
              disabled={!banner.image}
              onClick={() => {
                setForm({ ...form, banners: [...form.banners, { id: crypto.randomUUID(), ...banner }] });
                setBanner({ image: "", title: "", subtitle: "" });
              }}
              data-testid="add-banner-button"
            >
              <Plus className="size-4" /> Adicionar
            </Button>
          </div>
        </section>
        <Button type="submit" className="h-11 px-8" disabled={m.isPending} data-testid="settings-save-button">Salvar identidade visual</Button>
      </div>
      <aside className="lg:sticky lg:top-24 h-fit rounded-3xl border bg-card overflow-hidden" data-testid="branding-preview">
        <div className="p-4 flex items-center gap-2" style={{ background: form.primary_color }}>
          {form.logo_url && <img src={form.logo_url} alt="" className="h-9 w-9 rounded-lg object-cover" />}
          <span className="font-extrabold" style={{ color: form.secondary_color }}>{form.platform_name}</span>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pré-visualização</p>
          <p className="font-bold">{form.hero_title}</p>
          <span className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: form.primary_color }}>Botão principal</span>
          <div className="rounded-xl p-3 text-sm font-semibold" style={{ background: form.secondary_color, color: form.primary_color }}>Destaque secundário</div>
        </div>
      </aside>
    </form>
  );
}

function BusinessesTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("pending");
  const { data = [] } = useQuery({
    queryKey: ["admin-businesses", status],
    queryFn: () => apiGet<Business[]>(`/admin/businesses?status=${status}`),
  });
  const m = useMutation({
    mutationFn: ({ id, s }: { id: string; s: BizStatus }) => apiPatch<Ok>(`/admin/businesses/${id}`, { status: s }),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin-businesses"] });
      qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });

  return (
    <div>
      <div className="flex gap-2">
        {["pending", "approved", "rejected", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${status === s ? "bg-brand text-white border-brand" : "bg-card"}`}
            data-testid={`admin-filter-${s || "all"}`}
          >
            {s ? STATUS_LABEL[s] : "Todas"}
          </button>
        ))}
      </div>
      {!data.length && <p className="mt-6 text-muted-foreground" data-testid="admin-businesses-empty">Nenhuma empresa neste filtro.</p>}
      <ul className="mt-5 space-y-3">
        {data.map((b) => (
          <li key={b.id} className="rounded-2xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`admin-business-${b.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{b.name}</p>
                <Badge variant="outline">{STATUS_LABEL[b.status]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{b.category} · {b.neighborhood || "—"}, {b.city} · {b.whatsapp} · {b.email}</p>
            </div>
            <div className="flex gap-2">
              {b.status !== "approved" && (
                <Button size="sm" onClick={() => m.mutate({ id: b.id, s: "approved" })} data-testid={`approve-business-${b.id}`}>Aprovar</Button>
              )}
              {b.status !== "rejected" && (
                <Button size="sm" variant="outline" onClick={() => m.mutate({ id: b.id, s: "rejected" })} data-testid={`reject-business-${b.id}`}>
                  {b.status === "approved" ? "Suspender" : "Recusar"}
                </Button>
              )}
              <Link to={`/loja/${b.id}`} className={buttonVariants({ size: "sm", variant: "ghost" })} data-testid={`view-business-${b.id}`}>Ver</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = { admin: "Administrador", business: "Empresa", customer: "Cliente" };

function UsersTab() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => apiGet<UsersOut>("/admin/users") });
  const m = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => apiPatch<Ok>(`/admin/users/${id}/role`, { role }),
    onSuccess: () => {
      toast.success("Acesso atualizado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <div>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Para dar acesso de administrador a sócios e colaboradores: peça que entrem no site uma vez com a conta Google deles. Depois, mude o papel para <b>Administrador</b> aqui.
      </p>
      <ul className="mt-5 space-y-3">
        {data?.users.map((u) => (
          <li key={u.id} className="rounded-2xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`admin-user-${u.id}`}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{u.name}{u.id === me?.id && <span className="text-muted-foreground font-normal"> (você)</span>}</p>
              <p className="text-sm text-muted-foreground truncate">{u.email}</p>
            </div>
            <Select value={u.role} onValueChange={(v: string) => m.mutate({ id: u.id, role: v })}>
              <SelectTrigger className="w-48" data-testid={`user-role-select-${u.id}`}>
                <SelectValue>{(v) => ROLE_LABEL[v as string]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {data.roles.filter((r) => r !== "business" || u.business_id).map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewsTab() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-reviews"], queryFn: () => apiGet<Review[]>("/admin/reviews") });
  const m = useMutation({
    mutationFn: (id: string) => apiDelete<Ok>(`/admin/reviews/${id}`),
    onSuccess: () => {
      toast.success("Avaliação excluída");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
  if (!data.length) return <p className="text-muted-foreground" data-testid="admin-reviews-empty">Nenhuma avaliação.</p>;
  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-2xl border bg-card p-4 flex gap-3" data-testid={`admin-review-${r.id}`}>
          <div className="flex-1 min-w-0">
            <p className="text-sm"><b>{r.user_name}</b> sobre <b>{r.business_name}</b> · <span className="text-muted-foreground">{fmtDate(r.created_at)}</span></p>
            <div className="mt-1"><Stars value={r.rating} /></div>
            {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
          </div>
          <Button size="sm" variant="destructive" onClick={() => m.mutate(r.id)} data-testid={`delete-review-${r.id}`}>
            <Trash2 className="size-4" /> Excluir
          </Button>
        </li>
      ))}
    </ul>
  );
}

export default function Admin() {
  const { data: me, isLoading } = useMe();
  if (me?.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center" data-testid="admin-login-required">
        <p className="text-muted-foreground">{isLoading ? "Carregando..." : "Área restrita ao Super Admin."}</p>
        {!isLoading && <Link to="/sign-in" className={buttonVariants({ className: "mt-4" })} data-testid="admin-login-link">Entrar com Google</Link>}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">Super Admin</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight" data-testid="admin-title">Central de controle</h1>
      <Tabs defaultValue="empresas" className="mt-8">
        <TabsList variant="line">
          <TabsTrigger value="empresas" data-testid="admin-tab-businesses">Empresas</TabsTrigger>
          <TabsTrigger value="marca" data-testid="admin-tab-branding">Identidade visual</TabsTrigger>
          <TabsTrigger value="avaliacoes" data-testid="admin-tab-reviews">Avaliações</TabsTrigger>
          <TabsTrigger value="usuarios" data-testid="admin-tab-users">Usuários e acessos</TabsTrigger>
        </TabsList>
        <TabsContent value="empresas" className="pt-6"><BusinessesTab /></TabsContent>
        <TabsContent value="marca" className="pt-6"><BrandingTab /></TabsContent>
        <TabsContent value="avaliacoes" className="pt-6"><ReviewsTab /></TabsContent>
        <TabsContent value="usuarios" className="pt-6"><UsersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
