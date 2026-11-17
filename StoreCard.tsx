import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import type { Business } from "@/lib/types";

export default function StoreCard({ b }: { b: Business }) {
  return (
    <Link
      to={`/loja/${b.id}`}
      className="group rise-in block rounded-2xl bg-card border overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-[transform,box-shadow] duration-200"
      data-testid={`store-card-${b.id}`}
    >
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {b.cover && <img src={b.cover} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-800">{b.category}</span>
      </div>
      <div className="p-4 flex gap-3">
        {b.logo && <img src={b.logo} alt="" className="-mt-10 h-14 w-14 rounded-xl object-cover ring-4 ring-card shadow" />}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-tight truncate" data-testid="store-card-name">{b.name}</h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
              <Star className="size-3.5 fill-current" /> {b.review_count ? b.rating.toFixed(1) : "Novo"}
            </span>
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="size-3.5" /> {b.neighborhood || b.city}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
