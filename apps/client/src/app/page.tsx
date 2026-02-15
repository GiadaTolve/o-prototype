import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
      <h1
        className="font-display text-5xl md:text-6xl font-bold text-[var(--accent-gold)] mb-4 tracking-tighter"
        style={{ textShadow: "0 0 20px rgba(212,175,55,0.5)" }}
      >
        OYASUMI
      </h1>
      <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-md text-center">
        Benvenuto nel protocollo onirico. L&apos;accesso al sistema richiede autenticazione.
      </p>
      <Link href="/auth">
        <Button className="px-8 py-6 text-lg">Entra nel sistema</Button>
      </Link>
    </main>
  );
}