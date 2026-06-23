export function registerSW() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").then(reg => {
      console.log("Service Worker registered");
    }).catch(err => console.error("SW registration failed", err));
  }
}