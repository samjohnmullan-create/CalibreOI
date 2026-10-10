export * from "./store-workbench-queue.js?v=1";

if (typeof window !== "undefined" && /(?:^|\/)passport\.html$/.test(location.pathname)) {
  queueMicrotask(() => import("./passport-media.js?v=4").catch(err => console.warn("Passport media manager failed", err)));
}
