import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { ApiError, apiGet } from "./api";
import type { Settings, User } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  platform_name: "Buscou Achou",
  logo_url:
    "https://customer-assets-0z36b82j.emergentagent.net/job_mercado-local-24--7sr556y1/artifacts/fc429b38c8b8d71a_Logo01.png",
  primary_color: "#0B5CA8",
  secondary_color: "#F5F0E6",
  city: "Jequié - BA",
  hero_title: "Tudo o que você procura em Jequié, num só lugar.",
  hero_subtitle: "Encontre lojas, produtos e serviços da sua cidade e fale direto pelo WhatsApp.",
  hero_image: "",
  banners: [],
};

export const CATEGORIES = [
  "Alimentação",
  "Supermercado",
  "Farmácia",
  "Padaria",
  "Serviços",
  "Moda",
  "Beleza",
  "Pet Shop",
  "Construção",
  "Eletrônicos",
];

export function useSettings(): Settings {
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<Settings>("/settings") });
  return data ?? DEFAULT_SETTINGS;
}

export function useMe() {
  const { isLoaded, userId } = useAuth();
  return useQuery({
    queryKey: ["me", userId ?? "anon"],
    enabled: isLoaded,
    queryFn: () => apiGet<User | null>("/auth/me"),
    retry: false,
  });
}

export const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function waLink(phone: string, text: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = "55" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function errMsg(e: unknown, fallback = "Algo deu errado"): string {
  if (e instanceof ApiError) {
    const d = (e.body as { detail?: unknown } | null)?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return "Verifique os campos do formulário";
  }
  return fallback;
}

export const AVAIL_LABEL: Record<string, string> = {
  pronta: "Pronta entrega",
  encomenda: "Sob encomenda",
  indisponivel: "Indisponível",
};
