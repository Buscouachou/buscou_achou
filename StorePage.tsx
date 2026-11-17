import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, MessageCircle, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AvailabilityDialog from "@/components/AvailabilityDialog";
import Reviews from "@/components/Reviews";
import { apiGet } from "@/lib/api";
import { AVAIL_LABEL, brl, useSettings, waLink } from "@/lib/hooks";
import type { Business, Product } from "@/lib/types";

const AVAIL_CLASS: Record<string, string> = {
  pronta: "bg-emerald-100 text-emerald-800",
  encomenda: "bg-amber-100 text-amber-800",
  indisponivel: "bg-red-100 text-red-800",
};

export default function StorePage() {
  const { id = "" } = useParams();
  const s = useSettings();
  const biz = useQuery({ queryKey: ["business", id], queryFn: () => apiGet<Business>(`/businesses/${id}`) });
  const prods = useQuery({ queryKey: ["products", id], queryFn: () => apiGet<Product[]>(`/businesses/${id}/products`) });
  const [selected, setSelected] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const b = biz.data;
  if (!b) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground" data-testid="store-not-found">
        {biz.isLoading ? "Carregando..." : "Empresa não encontrada ou indisponível no momento."}
      </div>
    );
  }

  const groups = (prods.data ?? []).reduce<Record<string, Product[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});
  const ask = (p: Product | null) => {
    setSelected(p);
    setOpen(true);
  };

  return (
    <div>
      <div className="relative h-48 sm:h-64 bg-brand">
        {b.cover && <img src={b.cover} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative -mt-14 rounded-3xl bg-card border shadow-sm p-5 sm:p-7 flex flex-col sm:flex-row gap-5">
          {b.logo && <img src={b.logo} alt="" className="h-24 w-24 rounded-2xl object-cover ring-4 ring-card -mt-14 sm:-mt-16 shadow" />}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" data-testid="store-name">{b.name}</h1>
              <Badge variant="secondary">{b.category}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold" data-testid="store-rating">
                <Star className="size-4 fill-current" /> {b.review_count ? `${b.rating.toFixed(1)} (${b.review_count})` : "Sem avaliações"}
              </span>
              {(b.address || b.neighborhood) && (
                <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {[b.address, b.neighborhood, b.city].filter(Boolean).join(", ")}</span>
              )}
              {b.hours && <span className="inline-flex items-center gap-1"><Clock className="size-4" /> {b.hours}</span>}
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 sm:w-56">
            <a
              href={waLink(b.whatsapp, `Olá! Encontrei a ${b.name} no ${s.platform_name} e gostaria de mais informações.`)}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 font-semibold text-white hover:brightness-95 transition-[filter]"
              data-testid="whatsapp-contact-btn"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <Button variant="outline" className="flex-1 h-auto py-2.5" onClick={() => ask(null)} data-testid="store-general-request-btn">
              Consultar disponibilidade
            </Button>
          </div>
        </div>

        <Tabs defaultValue="catalogo" className="mt-8">
          <TabsList variant="line">
            <TabsTrigger value="catalogo" data-testid="tab-catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="avaliacoes" data-testid="tab-reviews">Avaliações</TabsTrigger>
            <TabsTrigger value="sobre" data-testid="tab-about">Sobre</TabsTrigger>
          </TabsList>
          <TabsContent value="catalogo" className="pt-6 space-y-10">
            {prods.data?.length === 0 && <p className="text-muted-foreground" data-testid="catalog-empty">Esta empresa ainda não cadastrou produtos.</p>}
            {Object.entries(groups).map(([cat, items]) => (
              <section key={cat}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <div key={p.id} className="rise-in flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-shadow" data-testid={`product-card-${p.id}`}>
                      {p.image && <img src={p.image} alt="" className="aspect-[4/3] w-full object-cover" />}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold leading-snug">{p.name}</h3>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${AVAIL_CLASS[p.availability]}`}>{AVAIL_LABEL[p.availability]}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                        <p className="mt-3 text-lg font-extrabold text-brand" data-testid="product-price">{brl(p.price)}</p>
                        <Button className="mt-3" variant="secondary" onClick={() => ask(p)} data-testid={`request-availability-btn-${p.id}`}>
                          Consultar disponibilidade
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </TabsContent>
          <TabsContent value="avaliacoes" className="pt-6 max-w-2xl">
            <Reviews businessId={b.id} />
          </TabsContent>
          <TabsContent value="sobre" className="pt-6 max-w-2xl space-y-2 text-slate-700" data-testid="store-about">
            <p>{b.description || "Sem descrição."}</p>
            {b.email && <p className="text-sm">E-mail: {b.email}</p>}
            <p className="text-sm">WhatsApp: {b.whatsapp}</p>
          </TabsContent>
        </Tabs>
      </div>
      <AvailabilityDialog business={b} product={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
