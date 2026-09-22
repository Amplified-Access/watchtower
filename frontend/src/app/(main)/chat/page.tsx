"use client";

import { useRouter } from "next/navigation";
import ChatGreeting from "@/features/chat/components/chat-greeting";
import ChatComposer from "@/features/chat/components/chat-composer";

const Page = () => {
  const router = useRouter();

  const startConversation = (question: string) => {
    router.push(`/chat/conversation?starter=${encodeURIComponent(question)}`);
  };

  return (
    <section className="relative isolate bg-white [zoom:var(--viewport-scale)]">
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-360">
        <div className="absolute inset-y-0 left-4 w-px bg-border md:left-8 xl:left-16" />
        <div className="absolute inset-y-0 right-4 w-px bg-border md:right-8 xl:right-16" />
      </div>
      {/* Fills the viewport under the fixed header: greeting centred in the
          free space, composer anchored towards the bottom like the design.
          --banner-height is the header's banner spacer (set by the header from
          the banner's rendered height), which sits outside this section. */}
      <div className="mx-auto flex min-h-[calc((100dvh-var(--banner-height))/var(--viewport-scale))] max-w-2xl flex-col px-8 pt-24 pb-10 md:pt-28 md:pb-12">
        <div className="flex flex-1 items-center justify-center py-6 pb-20 md:pb-24">
          <ChatGreeting />
        </div>
        <ChatComposer onSubmit={startConversation} />
      </div>
    </section>
  );
};

export default Page;
