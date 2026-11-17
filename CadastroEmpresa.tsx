import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import BusinessFields, { EMPTY_BUSINESS } from "@/components/BusinessFields";
import { apiPost } from "@/lib/api";
import { errMsg, useMe } from "@/lib/hooks";
import type { Business, BusinessBase } from "@/lib/types";

export default function CadastroEmpresa() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: me, isLoading } = useMe();
  const [biz, setBiz] = useState<BusinessBase>(EMPTY_BUSINESS);
  const m = useMutation({
    mutationFn: (body: BusinessBase) => apiPost<Business>("/businesses/apply", body),
    onSuccess: async () => {
      toast.success("Solicitação enviada! Agora monte seu catálogo.");
      await qc.invalidateQueries({ queryKey: ["me"] });
      nav("/painel-empresa");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">Para empresas · Gratuito</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Solicite o cadastro da sua empresa</h1>
      <p className="mt-2 text-muted-foreground">Tenha sua página e catálogo digital, receba pedidos de disponibilidade e converse com clientes pelo WhatsApp. Sem taxas sobre vendas.</p>

      {!me ? (
        <div className="mt-8 rounded-3xl border bg-card p-8 text-center" data-testid="apply-login-required">
          <p className="text-muted-foreground">{isLoading ? "Carregando..." : "Primeiro, entre com a conta Google que vai administrar a empresa."}</p>
          {!isLoading && <Link to="/sign-in" className={buttonVariants({ className: "mt-4" })} data-testid="apply-login-link">Entrar com Google</Link>}
        </div>
      ) : me.business_id ? (
        <div className="mt-8 rounded-3xl border bg-card p-8 text-center" data-testid="apply-already-registered">
          <p className="text-muted-foreground">Sua conta já tem uma empresa cadastrada.</p>
          <Link to="/painel-empresa" className={buttonVariants({ className: "mt-4" })} data-testid="apply-go-panel">Ir para o painel</Link>
        </div>
      ) : (
        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            m.mutate(biz);
          }}
          data-testid="apply-form"
        >
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="font-bold mb-1">Dados da empresa</h2>
            <p className="text-sm text-muted-foreground mb-4">Conta responsável: <b>{me.email}</b></p>
            <BusinessFields value={biz} onChange={setBiz} />
          </section>
          <Button type="submit" className="h-12 w-full sm:w-auto px-8" disabled={m.isPending} data-testid="apply-submit-button">
            {m.isPending ? "Enviando..." : "Enviar solicitação"}
          </Button>
        </form>
      )}
    </div>
  );
}
