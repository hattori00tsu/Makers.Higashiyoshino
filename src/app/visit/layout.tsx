import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "来訪者",
};

export default function VisitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
