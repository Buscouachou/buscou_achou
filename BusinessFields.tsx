import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/hooks";
import type { BusinessBase } from "@/lib/types";

export const EMPTY_BUSINESS: BusinessBase = {
  name: "", category: "Alimentação", description: "", logo: "", cover: "", whatsapp: "",
  email: "", address: "", neighborhood: "", city: "Jequié", hours: "",
};

const TEXT_FIELDS: [keyof BusinessBase, string, string][] = [
  ["name", "Nome da empresa *", ""],
  ["whatsapp", "WhatsApp *", "(73) 9XXXX-XXXX"],
  ["email", "E-mail de contato", ""],
  ["hours", "Horário de funcionamento", "Seg a Sáb, 8h às 18h"],
  ["address", "Endereço", "Rua, número"],
  ["neighborhood", "Bairro", ""],
  ["city", "Cidade", ""],
  ["logo", "Logo (URL da imagem)", "https://..."],
  ["cover", "Imagem de capa (URL)", "https://..."],
];

export default function BusinessFields({ value, onChange }: { value: BusinessBase; onChange: (v: BusinessBase) => void }) {
  const set = (k: keyof BusinessBase, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TEXT_FIELDS.map(([k, label, ph]) => (
        <div key={k} className="grid gap-1.5">
          <Label htmlFor={`biz-${k}`}>{label}</Label>
          <Input
            id={`biz-${k}`}
            placeholder={ph}
            required={k === "name" || k === "whatsapp"}
            value={value[k]}
            onChange={(e) => set(k, e.target.value)}
            data-testid={`business-${k}-input`}
          />
        </div>
      ))}
      <div className="grid gap-1.5">
        <Label>Categoria *</Label>
        <Select value={value.category} onValueChange={(v: string) => set("category", v)}>
          <SelectTrigger className="w-full" data-testid="business-category-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="biz-description">Descrição</Label>
        <Textarea id="biz-description" value={value.description} onChange={(e) => set("description", e.target.value)} data-testid="business-description-input" />
      </div>
    </div>
  );
}
