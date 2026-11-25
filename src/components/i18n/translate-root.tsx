"use client";

import * as React from "react";

export type Lang = "id" | "en";

interface NodeState {
  original: string;
  translatedLang: Lang | null;
}

const STORAGE_KEY = "site-lang";
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);

const LanguageContext = React.createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null);

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within <TranslateRoot>");
  return ctx;
}

/**
 * Walks every visible text node under `root`, skipping script/style tags
 * and anything inside an element marked `data-no-translate` (commit SHAs,
 * code snippets, brand/proper nouns — anything machine translation would
 * only mangle).
 */
function collectTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue;
      if (!text || !text.trim()) return NodeFilter.FILTER_REJECT;
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

/**
 * Site-wide auto-translate, built to need zero changes anywhere else in
 * the codebase — it runs entirely as a post-render pass over the DOM
 * instead of every string being individually wrapped/extracted (the
 * alternative, a proper next-intl setup, would require touching nearly
 * every component plus adding a second language field to every piece of
 * admin-authored content).
 *
 * Each text node's original value is cached the first time it's seen (in
 * `stateRef`, keyed by the DOM node itself) so switching back to a
 * language already fetched is instant, and so a node already in its
 * target language is never re-sent. A `MutationObserver` re-applies the
 * current language whenever React swaps in new content (route change,
 * data reload, a hover-driven panel re-rendering, etc.) — the `applying`
 * guard just stops that observer from reacting to the writes this
 * component itself makes.
 */
export function TranslateRoot({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const stateRef = React.useRef<WeakMap<Text, NodeState>>(new WeakMap());
  const applyingRef = React.useRef(false);
  const pendingRerunRef = React.useRef(false);
  const hasHydratedRef = React.useRef(false);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "id" || saved === "en") setLangState(saved);
    } catch {
      // Private browsing / blocked storage — fall back to the "id" default.
    }
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Ignore — the toggle still works for the rest of this visit.
    }
  }, []);

  const applyLang = React.useCallback(async (targetLang: Lang) => {
    // Reentrancy guard spans the ENTIRE pass, not just the moment a
    // chunk's results get written in. The previous version only set
    // `applyingRef` around that one synchronous write, leaving it `false`
    // for the whole `await fetch(...)` in between chunks — and the
    // MutationObserver notification for THAT write is itself only
    // delivered as a microtask after the write, by which point
    // `applyingRef` was already flipped back. So our own writes kept
    // slipping past the guard and starting a brand-new overlapping pass
    // that re-scanned the same still-in-progress nodes, firing duplicate
    // `/api/translate` requests for the same text (what showed up as
    // dozens/hundreds of identical POSTs in the Network tab). A pass that
    // starts while one is already running now just flags
    // `pendingRerunRef` and returns immediately instead of running
    // alongside it; once the in-flight pass finishes, it runs exactly one
    // more pass itself if anything was flagged while it was busy, so
    // content that genuinely changed mid-pass still gets picked up.
    if (applyingRef.current) {
      pendingRerunRef.current = true;
      return;
    }
    applyingRef.current = true;

    try {
      const root = containerRef.current;
      if (!root) return;

      const nodes = collectTextNodes(root);
      const pending: { node: Text; text: string }[] = [];

      for (const node of nodes) {
        let entry = stateRef.current.get(node);
        if (!entry) {
          entry = { original: node.nodeValue ?? "", translatedLang: null };
          stateRef.current.set(node, entry);
        }
        if (entry.translatedLang === targetLang) continue;
        pending.push({ node, text: entry.original });
      }

      if (pending.length === 0) return;

      const CHUNK = 40;
      for (let i = 0; i < pending.length; i += CHUNK) {
        const chunk = pending.slice(i, i + CHUNK);
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: chunk.map((c) => c.text), target: targetLang }),
          });
          if (!res.ok) continue;
          const json = (await res.json()) as { translations: string[] };

          chunk.forEach(({ node }, idx) => {
            const translated = json.translations[idx];
            const entry = stateRef.current.get(node);
            if (!entry) return;
            if (translated && node.isConnected) node.nodeValue = translated;
            entry.translatedLang = targetLang;
          });
        } catch {
          // Best-effort — leave this chunk showing its original text.
        }
      }
    } finally {
      applyingRef.current = false;
      if (pendingRerunRef.current) {
        pendingRerunRef.current = false;
        void applyLang(targetLang);
      }
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function runFirstPass() {
      hasHydratedRef.current = true;
      void applyLang(lang);
    }

    function onWindowLoad() {
      timeoutId = setTimeout(runFirstPass, 0);
    }

    if (hasHydratedRef.current) {
      void applyLang(lang);
    } else if (document.readyState === "complete") {
      // Page already finished loading by the time this effect ran (a
      // fast reload, or React committing late) — still push to a
      // macrotask so this runs strictly after anything hydration-related
      // queued in the current tick.
      timeoutId = setTimeout(runFirstPass, 0);
    } else {
      // Two `requestAnimationFrame`s turned out not to be late enough:
      // this page's content sits behind a route-level Suspense boundary
      // (Next.js's per-segment streaming), which can hydrate on its own
      // schedule rather than in lockstep with the rest of the tree. The
      // browser's `load` event — fired only once every resource has
      // finished — lands reliably after that hydration completes in
      // practice. Running the very first translate pass any earlier
      // raced it: the translator rewrote text nodes before React got to
      // compare them against the server-rendered HTML, which React
      // reported as a hydration mismatch. Every later pass (language
      // toggle, DOM mutations) runs immediately — there's no hydration
      // left to race by then.
      window.addEventListener("load", onWindowLoad, { once: true });
    }

    // No `applyingRef` check here anymore — `applyLang` itself now owns
    // that guard for its whole run (see the comment inside it) and queues
    // a single follow-up pass via `pendingRerunRef` if something changes
    // while it's busy, instead of this callback silently dropping the
    // notification.
    const observer = new MutationObserver(() => {
      void applyLang(lang);
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("load", onWindowLoad);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyLang is stable (useCallback, no changing deps)
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div ref={containerRef}>{children}</div>
    </LanguageContext.Provider>
  );
}
