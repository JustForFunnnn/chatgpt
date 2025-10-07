

export const formatTimestamp = (isoString: string) =>
  new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const isMobileDevice = () => typeof window !== "undefined" && window.innerWidth < 765;
