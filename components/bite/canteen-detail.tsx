'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shift, shiftLabel } from '@/lib/bite-data';
import { useBite } from '@/lib/bite-store';
import { DishRow } from './dish-row';
import { BackButton, EmptyState, MonoLabel, SectionLabel, ShiftToggle, listVariants } from './primitives';
import { getCanteenMenu, getCanteensDirectory } from '@/lib/api';

type CanteenStats = {
  items: number;
  rating: number;
  serve: number;
  closes: string;
};




/**
 * Displays details for a single canteen.
 * Connects to Supabase via the helper functions in lib/api.ts which conform to the schema defined in schema.sql.
 */
export function CanteenDetail({
  hostelId,
  shift,
}: {
  hostelId: string;
  shift: Shift;
}) {
  const { back, replaceTop } = useBite();
  const [menu, setMenu] = useState<any[]>([]);
  const [stats, setStats] = useState<CanteenStats | null>(null);
  const [bhawanName, setBhawanName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Map shift → canteen UUID for this bhawan (populated after directory fetch)
  const [shiftIds, setShiftIds] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch all menu items for this canteen row (canteen_id scopes to one shift already)
      const rawMenu = await getCanteenMenu(hostelId);

      // Normalize Supabase shape → Offering shape that DishRow expects:
      //   avg_rating  → rating
      //   avg_prep_time → serveMin
      //   canteens.shift_type → shift
      const normalized = rawMenu.map((item: any) => ({
        ...item,
        rating: item.avg_rating ?? 0,
        shift: item.canteens?.shift_type ?? shift,
        serveMin: Math.round(item.avg_prep_time ?? 0),
      }));

      setMenu(normalized);

      // Bhawan name comes from the joined canteens row
      const directBhawan: string = rawMenu[0]?.canteens?.bhawan ?? '';

      // Fetch directory entry for aggregate stats + sibling canteen UUIDs
      const directory = await getCanteensDirectory();
      const allEntries = directory as any[];

      // Build shift → id map for this bhawan so the toggle can swap UUIDs
      const thisBhawan = directBhawan || allEntries.find((e) => e.id === hostelId)?.bhawan;
      const siblings = allEntries.filter((e) => e.bhawan === thisBhawan);
      const newShiftIds: Record<string, string> = {};
      siblings.forEach((e) => { newShiftIds[e.shift_type] = e.id; });
      setShiftIds(newShiftIds);

      const entry = siblings.find((c) => c.id === hostelId);

      if (entry || siblings.length) {
        const e = entry ?? siblings[0];
        setBhawanName(e.bhawan ?? directBhawan);
        setStats({
          items: normalized.length,
          rating: e.canteen_avg_rating ?? 0,
          serve: e.canteen_avg_serve_mins ?? 0,
          closes: rawMenu[0]?.canteens?.closing_time ?? '',
        });
      } else {
        // Fallback – compute from fetched items
        const ratingAvg =
          normalized.reduce((s, i) => s + (i.rating || 0), 0) / (normalized.length || 1);
        const serveAvg = Math.round(
          normalized.reduce((s, i) => s + (i.serveMin || 0), 0) / (normalized.length || 1)
        );
        setBhawanName(directBhawan);
        setStats({
          items: normalized.length,
          rating: ratingAvg,
          serve: serveAvg,
          closes: rawMenu[0]?.canteens?.closing_time ?? '',
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [hostelId, shift]);

  if (loading || !stats) {
    return <div className="flex h-full items-center justify-center">Loading…</div>;
  }

  return (
    <div>
      <header className="flex items-center gap-3 px-4 pb-4 pt-6">
        <BackButton onClick={back} />
        <div className="min-w-0 flex-1">
          <MonoLabel className="block text-[10px] text-brand">
            {shiftLabel(shift)} Canteen · Open till {stats.closes}
          </MonoLabel>
          <h1 className="truncate font-display text-2xl font-bold leading-tight text-fg">
            {bhawanName || hostelId}
          </h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2.5 py-1 font-mono text-[12px] uppercase text-brand">
          <span className="size-1.5 rounded-full bg-brand" aria-hidden />
          Open
        </span>
      </header>

      <dl className="grid grid-cols-3 gap-2.5 px-4">
        <Stat value={String(stats.items)} label="Items" />
        <Stat value={stats.rating.toFixed(1)} label="Avg rating" />
        <Stat value={`~${stats.serve}m`} label="Avg serve" />
      </dl>

      <div className="px-4 pt-4">
        <ShiftToggle
          value={shift}
          onChange={(s) => {
            const targetId = shiftIds[s] ?? hostelId;
            replaceTop({ type: 'canteen', hostelId: targetId, shift: s });
          }}
          layoutId="canteen-detail-shift"
        />
      </div>

      <SectionLabel aside="Prices vary by canteen">Menu · Ranked by rating</SectionLabel>
      {menu.length ? (
        <motion.ul key={shift} variants={listVariants} initial="hidden" animate="show" className="space-y-3 px-4">
          {menu.map((o) => (
            <DishRow key={o.id} offering={o} />
          ))}
        </motion.ul>
      ) : (
        <EmptyState title="No rated dishes yet" body="Be the first to rate something from this canteen." />
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl border border-line bg-surface p-3">
      <dt>
        <MonoLabel className="text-[10px] text-fg-2">{label}</MonoLabel>
      </dt>
      <dd className="font-display text-[22px] font-bold text-fg">{value}</dd>
    </div>
  );
}
