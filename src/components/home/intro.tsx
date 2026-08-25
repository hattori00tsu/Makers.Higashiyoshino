import { defaultHomeVillage, type HomeVillage } from "@/lib/content/home-display";
import { VillageSlides } from "@/components/home/village-slides";

export function Intro({ villages }: { villages?: HomeVillage[] }) {
  const items = villages ?? [defaultHomeVillage()];
  if (items.length === 0) return null;
  return <VillageSlides villages={items} />;
}
