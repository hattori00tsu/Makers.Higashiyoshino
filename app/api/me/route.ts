import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/account/server";

export async function GET() {
  try {
    const session = await getServerSession();
    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ session: null });
  }
}
