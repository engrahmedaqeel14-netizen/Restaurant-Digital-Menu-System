import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { useGetDisplayMenu, getGetDisplayMenuQueryKey } from "@workspace/api-client-react";
import { MonitorX, Loader2 } from "lucide-react";

export default function Display() {
  const [, params] = useRoute("/display/:customerId");
  const customerId = params?.customerId || "";

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: menu, isLoading, isError, error } = useGetDisplayMenu(customerId, {
    query: {
      queryKey: getGetDisplayMenuQueryKey(customerId),
      enabled: !!customerId && mounted,
      refetchInterval: 10000,
      retry: 3,
    }
  });

  if (!mounted || isLoading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center flex-col gap-4"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 animate-spin" />
        <div className="text-white/40 font-mono text-xs sm:text-sm tracking-widest uppercase">Initializing Display</div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = (error as any)?.error || "Display Unavailable";
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center flex-col px-6 text-center"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <MonitorX className="w-16 h-16 sm:w-24 sm:h-24 text-white/10 mb-6" />
        <h1 className="text-xl sm:text-3xl text-white/50 font-medium mb-2 uppercase tracking-wider">{errorMessage}</h1>
        <p className="text-white/30 font-mono text-sm">ID: {customerId}</p>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center text-white/20 font-mono text-xs border-t border-white/10 px-6 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <span>MENUCAST</span>
          <span>AWAITING CONNECTION...</span>
        </div>
      </div>
    );
  }

  if (!menu || !menu.imageUrl) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center flex-col px-6 text-center"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="w-20 h-20 sm:w-32 sm:h-32 border-4 border-white/10 rounded-full flex items-center justify-center mb-6 sm:mb-8">
          <div className="w-2 h-2 bg-white/50 rounded-full animate-ping" />
        </div>
        <h1 className="text-2xl sm:text-4xl text-white/70 font-medium mb-3 uppercase tracking-widest">
          {menu?.restaurantName || "Connected"}
        </h1>
        <p className="text-white/40 font-mono text-sm tracking-widest">Awaiting Menu Broadcast</p>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center text-white/30 font-mono text-xs border-t border-white/10 px-6 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <span>{customerId}</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            ONLINE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <img
        src={menu.imageUrl}
        alt="Digital Menu"
        className="w-full h-full object-contain"
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-16 sm:pt-24"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))", paddingLeft: "max(1.25rem, env(safe-area-inset-left))", paddingRight: "max(1.25rem, env(safe-area-inset-right))" }}>
        <div className="flex justify-between items-end opacity-70">
          <h2 className="text-white font-bold text-base sm:text-2xl drop-shadow-md tracking-tight truncate mr-4">
            {menu.restaurantName}
          </h2>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-white/70 font-mono text-xs sm:text-sm drop-shadow-md hidden sm:block">
              {format(new Date(menu.updatedAt), "HH:mm")}
            </div>
            <div className="flex items-center text-emerald-400 font-mono text-xs sm:text-sm tracking-widest drop-shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              LIVE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
