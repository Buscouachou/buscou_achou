import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, MessageCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BusinessFields from "@/components/BusinessFields";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { AVAIL_LABEL, brl, errMsg, fmtDate, useMe, useSettings, waLink } from "@/lib/hooks";
import type { AvailabilityRequest, Business, BusinessBase, Ok, Product, ProductIn, ReqStatus } from "@/lib/types";

const EMPTY_PRODUCT: ProductIn = { name: "", description: "", price: 0, image: "", category: "Geral", availability: "pronta" };
const STATUS_LABEL: Record<string, string> = { pending: "Aguardando", available: "Disponível", unavailable: "Indisponível" };
const BIZ_STATUS: Record<string, string> = { pending: "Em análise", approved: "Aprovada", rejected: "Recusada" };

function RequestsTab({ biz }: { biz: Business }) {
  const qc = useQueryClient();
  const s = useSettings();
  const { data = [] } = useQuery({ queryKey: ["my-requests"], queryFn: () => apiGet<AvailabilityRequest[]>("/me/requests") });
  const m = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReqStatus }) => apiPatch<AvailabilityRequest>(`/me/requests/${id}`, { status, reply: "" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-requests"] }),
    onError: (e) => toast.error(errMsg(e)),
  });

  const respond = (r: AvailabilityRequest, status: ReqStatus) => {
    m.mutate({ id: r.id, status });
    const item = r.product_name || "o item solicitado";
    const msg =
      status === "available"
        ? `Olá ${r.customer_name}! Aqui é da ${biz.name} (${s.platform_name}). Temos ${item} disponível${r.quantity > 1 ? ` (qtd. ${r.quantity})` : ""}. Como prefere combinar?`
        : `Olá ${r.customer_name}! Aqui é da ${biz.name} (${s.platform_name}). Infelizmente ${item} está indisponível no momento.`;
    window.open(waLink(r.customer_whatsapp, msg), "_blank");
  };

  if (!data.length) return <p className="text-muted-foreground" data-testid="requests-empty">Nenhuma solicitação recebida ainda.</p>;
  return (
    <ul className="space-y-3">
      {data.map((r) => (
        <li key={r.id} className="rounded-2xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`request-item-${r.id}`}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{r.product_name || "Consulta geral"}{r.quantity > 1 && ` × ${r.quantity}`}</p>
              <Badge variant={r.status === "pending" ? "outline" : r.status === "available" ? "default" : "destructive"} data-testid="request-status">
                {STATUS_LABEL[r.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{r.customer_name} · {r.customer_whatsapp}{r.customer_email && ` · ${r.customer_email}`} · {fmtDate(r.created_at)}</p>
            {r.notes && <p className="mt-1 text-sm">“{r.notes}”</p>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="bg-whatsapp text-white hover:bg-whatsapp/90" onClick={() => respond(r, "available")} data-testid={`request-available-btn-${r.id}`}>
              <Check className="size-4" /> Disponível
            </Button>
            <Button size="sm" variant="outline" onClick={() => respond(r, "unavailable")} data-testid={`request-unavailable-btn-${r.id}`}>
              <X className="size-4" /> Indisponível
            </Button>
            {r.customer_email && (
              <a className={buttonVariants({ size: "sm", variant: "ghost" })} href={`mailto:${r.customer_email}?subject=${encodeURIComponent(`${biz.name} - ${r.product_name || "sua consulta"}`)}`} data-testid={`request-email-btn-${r.id}`}>
                E-mail
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function CatalogTab() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["my-products"], queryFn: () => apiGet<Product[]>("/me/products") });
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductIn>(EMPTY_PRODUCT);
  const [open, setOpen] = useState(false);

  const done = () => {
    qc.invalidateQueries({ queryKey: ["my-products"] });
    setOpen(false);
  };
  const save = useMutation({
    mutationFn: (body: ProductIn) => (editing ? apiPut<Product>(`/me/products/${editing.id}`, body) : apiPost<Product>("/me/products", body)),
    onSuccess: () => {
      toast.success("Produto salvo");
      done();
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete<Ok>(`/me/products/${id}`),
    onSuccess: () => {
      toast.success("Produto removido");
      done();
    },
  });

  const openForm = (p: Product | null) => {
    setEditing(p);
    setForm(p ? { name: p.name, description: p.description, price: p.price, image: p.image, category: p.category, availability: p.availability } : EMPTY_PRODUCT);
    setOpen(true);
  };

  return (
    <div>
      <Button onClick={() => openForm(null)} data-testid="add-product-button"><Plus className="size-4" /> Novo produto/serviço</Button>
      {!data.length && <p className="mt-4 text-muted-foreground" data-testid="products-empty">Seu catálogo está vazio.</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {data.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl border bg-card p-3" data-testid={`my-product-${p.id}`}>
            {p.image ? <img src={p.image} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <div className="h-20 w-20 rounded-xl bg-muted" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{p.name}</p>
              <p className="text-sm font-bold text-brand">{brl(p.price)}</p>
              <p className="text-xs text-muted-foreground">{p.category} · {AVAIL_LABEL[p.availability]}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Button size="icon-sm" variant="ghost" onClick={() => openForm(p)} data-testid={`edit-product-${p.id}`}><Pencil className="size-4" /></Button>
              <Button size="icon-sm" variant="ghost" onClick={() => del.mutate(p.id)} data-testid={`delete-product-${p.id}`}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="product-dialog">
          <DialogHeader><DialogTitle>{editing ? "Editar item" : "Novo item"}</DialogTitle></DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="p-name">Nome *</Label>
              <Input id="p-name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="product-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="p-price">Preço (R$) *</Label>
                <Input id="p-price" type="number" step="0.01" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} data-testid="product-price-input" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-cat">Seção</Label>
                <Input id="p-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="product-category-input" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Disponibilidade</Label>
              <Select value={form.availability} onValueChange={(v: string) => setForm({ ...form, availability: v as ProductIn["availability"] })}>
                <SelectTrigger className="w-full" data-testid="product-availability-select">
                  <SelectValue>{(v) => AVAIL_LABEL[v as string]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAIL_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-img">Foto (URL da imagem)</Label>
              <Input id="p-img" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} data-testid="product-image-input" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="p-desc">Descrição</Label>
              <Textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="product-description-input" />
            </div>
            <Button type="submit" disabled={save.isPending} data-testid="product-save-button">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileTab({ biz }: { biz: Business }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BusinessBase>(biz);
  useEffect(() => setForm(biz), [biz]);
  const m = useMutation({
    mutationFn: (body: BusinessBase) => apiPut<Business>("/me/business", body),
    onSuccess: () => {
      toast.success("Dados atualizados");
      qc.invalidateQueries({ queryKey: ["my-business"] });
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <form
      className="rounded-3xl border bg-card p-6 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const { name, category, description, logo, cover, whatsapp, email, address, neighborhood, city, hours } = form;
        m.mutate({ name, category, description, logo, cover, whatsapp, email, address, neighborhood, city, hours });
      }}
    >
      <BusinessFields value={form} onChange={setForm} />
      <Button type="submit" disabled={m.isPending} data-testid="profile-save-button">Salvar alterações</Button>
    </form>
  );
}

export default function PainelEmpresa() {
  const { data: me, isLoading } = useMe();
  const isOwner = !!me?.business_id && (me.role === "business" || me.role === "admin");
  const { data: biz } = useQuery({ queryKey: ["my-business"], queryFn: () => apiGet<Business>("/me/business"), enabled: isOwner });

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center" data-testid="panel-login-required">
        <p className="text-muted-foreground">{isLoading ? "Carregando..." : "Entre com a conta Google da sua empresa para ver o painel. Ainda não tem cadastro? Solicite em Cadastre sua empresa."}</p>
        {!isLoading && <Link to="/sign-in" className={buttonVariants({ className: "mt-4" })} data-testid="panel-login-link">Entrar com Google</Link>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight" data-testid="panel-title">{biz?.name ?? "Minha empresa"}</h1>
        {biz && <Badge variant={biz.status === "approved" ? "default" : "outline"} data-testid="panel-business-status">{BIZ_STATUS[biz.status]}</Badge>}
        {biz?.status === "approved" && (
          <Link to={`/loja/${biz.id}`} className="ml-auto text-sm font-semibold text-brand" data-testid="panel-view-store-link">Ver minha página →</Link>
        )}
      </div>
      {biz?.status === "pending" && (
        <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900" data-testid="panel-pending-notice">
          Seu cadastro está em análise. Monte seu catálogo agora — ele aparecerá no site assim que for aprovado.
        </p>
      )}
      {biz && (
        <Tabs defaultValue="pedidos" className="mt-8">
          <TabsList variant="line">
            <TabsTrigger value="pedidos" data-testid="panel-tab-requests">Solicitações</TabsTrigger>
            <TabsTrigger value="catalogo" data-testid="panel-tab-catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="dados" data-testid="panel-tab-profile">Dados da loja</TabsTrigger>
          </TabsList>
          <TabsContent value="pedidos" className="pt-6"><RequestsTab biz={biz} /></TabsContent>
          <TabsContent value="catalogo" className="pt-6"><CatalogTab /></TabsContent>
          <TabsContent value="dados" className="pt-6"><ProfileTab biz={biz} /></TabsContent>
        </Tabs>
      )}
      <p className="mt-10 text-xs text-muted-foreground flex items-center gap-1">
        <MessageCircle className="size-3.5" /> Ao responder uma solicitação, o WhatsApp do cliente abre com a mensagem pronta.
      </p>
    </div>
  );
}
