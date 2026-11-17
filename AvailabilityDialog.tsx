import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";
import { brl, errMsg, useSettings, waLink } from "@/lib/hooks";
import type { AvailabilityRequest, Business, Product, RequestIn } from "@/lib/types";

interface Props {
  business: Business;
  product: Product | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function AvailabilityDialog({ business, product, open, onOpenChange }: Props) {
  const s = useSettings();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);

  const m = useMutation({
    mutationFn: (body: RequestIn) => apiPost<AvailabilityRequest>("/requests", body),
    onSuccess: () => {
      setSent(true);
      toast.success("Solicitação enviada para a loja!");
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) setSent(false);
  };

  const waText = `Olá! Vi no ${s.platform_name}${product ? ` o item "${product.name}" (${brl(product.price)})` : ""}. ${
    qty > 1 ? `Quantidade: ${qty}. ` : ""
  }Tem disponível? ${notes}`.trim();

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md" data-testid="availability-dialog">
        <DialogHeader>
          <DialogTitle>{sent ? "Solicitação enviada" : "Consultar disponibilidade"}</DialogTitle>
          <DialogDescription>
            {product ? `${product.name} · ${brl(product.price)}` : business.name}
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="space-y-4 text-center py-2" data-testid="availability-success">
            <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
            <p className="text-sm text-muted-foreground">
              A <b>{business.name}</b> recebeu seu pedido e vai confirmar pelo seu WhatsApp{email ? " ou e-mail" : ""}. Quer agilizar?
            </p>
            <a
              href={waLink(business.whatsapp, waText)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 font-semibold text-white hover:brightness-95 transition-[filter]"
              data-testid="availability-whatsapp-link"
            >
              <MessageCircle className="size-4" /> Falar agora no WhatsApp
            </a>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              m.mutate({
                business_id: business.id,
                product_id: product?.id ?? null,
                customer_name: name,
                customer_whatsapp: phone,
                customer_email: email,
                quantity: qty,
                notes,
              });
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="req-name">Seu nome</Label>
              <Input id="req-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} data-testid="request-name-input" />
            </div>
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="req-phone">WhatsApp</Label>
                <Input id="req-phone" required minLength={8} placeholder="(73) 9XXXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="request-whatsapp-input" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="req-qty">Qtd.</Label>
                <Input id="req-qty" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} data-testid="request-quantity-input" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="req-email">E-mail (opcional)</Label>
              <Input id="req-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="request-email-input" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="req-notes">Observações</Label>
              <Textarea id="req-notes" rows={2} placeholder="Cor, tamanho, bairro para entrega..." value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="request-notes-input" />
            </div>
            <Button type="submit" className="w-full" disabled={m.isPending} data-testid="request-submit-button">
              {m.isPending ? "Enviando..." : "Enviar solicitação"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
