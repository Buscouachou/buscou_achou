import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StoreCard from "@/components/StoreCard";
import { apiGet } from "@/lib/api";
import { AVAIL_LABEL, CATEGORIES, brl, useSettings } from "@/lib/hooks";
import type { Business, SearchOut } from "@/lib/types";
import { cn } from "@/lib/utils";

function BannerCarousel() {
  const s = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const n = s.banners.length;

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ left: el.clientWidth * idx, behavior: "smooth" });
  }, [idx]);

  if (!n) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 mt-8" data-testid="banner-carousel">
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory overflow-x-hidden rounded-2xl shadow-sm">
        {s.banners.map((b) => (
          <div key={b.id} className="relative w-full shrink-0 snap-start aspect-[16/9] sm:aspect-[3/1]" data-testid={`banner-${b.id}`}>
            <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/30 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-6 sm:p-10 text-white max-w-lg">
              <p className="text-2xl sm:text-4xl font-extrabold tracking-tight">{b.title}</p>
              {b.subtitle && <p className="mt-1 text-white/85">{b.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {s.banners.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setIdx(i)}
            aria-label={`Banner ${i + 1}`}
            className={cn("h-1.5 rounded-full transition-[width,background-color] duration-300", i === idx ? "w-6 bg-brand" : "w-1.5 bg-slate-300")}
            data-testid={`banner-dot-${i}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const s = useSettings();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("categoria") ?? "";
  const [text, setText] = useState(q);

  const stores = useQuery({
    queryKey: ["businesses", category],
    queryFn: () => apiGet<Business[]>(`/businesses?category=${encodeURIComponent(category)}`),
    enabled: !q,
  });
  const search = useQuery({
    queryKey: ["search", q],
    queryFn: () => apiGet<SearchOut>(`/search?q=${encodeURIComponent(q)}`),
    enabled: !!q,
  });

  const setCategory = (c: string) => {
    setText("");
    setParams(c && c !== category ? { categoria: c } : {});
  };

  const list = q ? search.data?.businesses : stores.data;
  const failed = q ? search.isError : stores.isError;
  const loading = q ? search.isLoading : stores.isLoading;

  return (
    <div>
      <section className="relative overflow-hidden bg-brand text-white" data-testid="hero-section">
        {s.hero_image && <img src={s.hero_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cream/10 blur-2xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-cream/90">Catálogo local · {s.city}</p>
          <h1 className="mt-3 max-w-2xl text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]" data-testid="hero-title">{s.hero_title}</h1>
          <p className="mt-3 max-w-xl text-white/85">{s.hero_subtitle}</p>
          <form
            className="mt-7 flex max-w-2xl gap-2 rounded-2xl bg-white p-2 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              setParams(text.trim() ? { q: text.trim() } : {});
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Busque lojas, produtos ou serviços..."
                className="h-11 border-0 pl-10 text-slate-900 shadow-none focus-visible:ring-0"
                data-testid="search-input"
              />
            </div>
            <Button type="submit" className="h-11 px-6" data-testid="search-submit-button">Buscar</Button>
          </form>
        </div>
      </section>

      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur border-b">
        <div className="no-scrollbar mx-auto max-w-6xl px-4 py-3 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-150",
                c === category ? "bg-brand text-white border-brand" : "bg-card hover:border-brand hover:text-brand",
              )}
              data-testid={`category-chip-${c}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {!q && !category && <BannerCarousel />}

      <section className="mx-auto max-w-6xl px-4 mt-10">
        {q && (
          <div className="mb-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight" data-testid="search-results-title">Resultados para “{q}”</h2>
              <Link to="/" className="text-sm text-brand font-medium" data-testid="clear-search-link">Limpar busca</Link>
            </div>
            {!!search.data?.products.length && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="product-results">
                {search.data.products.map((p) => (
                  <Link key={p.id} to={`/loja/${p.business_id}`} className="rise-in flex gap-3 rounded-2xl border bg-card p-3 hover:shadow-md transition-shadow" data-testid={`product-hit-${p.id}`}>
                    {p.image && <img src={p.image} alt="" className="h-20 w-20 rounded-xl object-cover" />}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.business_name}</p>
                      <p className="mt-1 font-bold text-brand">{brl(p.price)}</p>
                      <p className="text-xs text-muted-foreground">{AVAIL_LABEL[p.availability]}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <h2 className="text-2xl font-bold tracking-tight" data-testid="stores-title">
          {q ? "Empresas" : category ? category : "Empresas em destaque"}
        </h2>
        {loading && <p className="mt-4 text-muted-foreground">Carregando...</p>}
        {failed && <p className="mt-4 text-muted-foreground" data-testid="stores-error">Não foi possível carregar as empresas agora.</p>}
        {!loading && !failed && list?.length === 0 && (
          <p className="mt-4 text-muted-foreground" data-testid="stores-empty">Nenhuma empresa encontrada.</p>
        )}
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list?.map((b) => <StoreCard key={b.id} b={b} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-16">
        <div className="rounded-3xl bg-cream p-8 sm:p-12 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand">Tem uma empresa em {s.city.split(" -")[0]}?</p>
            <p className="mt-2 text-slate-700">Crie seu catálogo digital gratuito e receba clientes pelo WhatsApp.</p>
          </div>
          <Link to="/cadastro-empresa" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:brightness-110 transition-[filter]" data-testid="cta-register-business">
            Solicitar cadastro
          </Link>
        </div>
      </section>
    </div>
  );
}
