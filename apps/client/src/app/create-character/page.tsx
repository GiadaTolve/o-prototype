import { redirect } from "next/navigation";

/** Deprecato: il PG si crea in registrazione; profilo in Scheda → Modifica. */
export default function CreateCharacterRedirect() {
  redirect("/dashboard");
}
