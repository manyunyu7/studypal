import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json() as { name: string; email: string; password: string };
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.user.create({ data: { name, email, password: hashedPassword } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
