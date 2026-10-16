"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

/** Copies (or natively shares) the public link to a page on this site. */
export function CopyLink({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}${path}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      toast({ tone: "success", title: "Link copied", message: "Paste it in your posts, chats or bio." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ tone: "error", title: "Couldn't copy", message: url() });
    }
  }

  async function share() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title, url: url() });
    } catch {
      // The user closed the share sheet.
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <code className="flex min-w-0 flex-1 items-center truncate rounded-xl border border-bond-ink/12 bg-bond-paper px-4 py-3 text-sm text-bond-ink/80">
        {path}
      </code>
      <Button onClick={copy} variant="gold" className="shrink-0">
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button onClick={share} variant="outline" className="shrink-0">
        <Share2 className="size-4" aria-hidden />
        Share
      </Button>
    </div>
  );
}
