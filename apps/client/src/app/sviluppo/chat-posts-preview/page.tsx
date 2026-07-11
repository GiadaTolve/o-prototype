import { ChatResolutionPostsPreview } from "@/components/dashboard/chat-combat/ChatResolutionPostsPreview";

export const metadata = {
  title: "Anteprima post chat — Oyasumi",
  description: "Mockup statico post waza e costrutto in chat",
};

export default function ChatPostsPreviewPage() {
  return (
    <main className="min-h-dvh bg-[var(--background)] px-4 py-6 md:py-10">
      <ChatResolutionPostsPreview />
    </main>
  );
}
