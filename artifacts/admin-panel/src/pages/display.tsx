import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { useGetDisplayMenu, getGetDisplayMenuQueryKey } from "@workspace/api-client-react";
import { MonitorX, Loader2 } from "lucide-react";

export default function Display() {
  const [, params] = useRoute("/display/:customerId");
  const customerId = params?.customerId || "";
  
  // Add a slight artificial delay on initial mount just to ensure smooth transition
  // not technically required but makes it feel less jagged
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
      <div className="w-screen h-screen bg-black flex items-center justify-center flex-col">
        <Loader2 className="w-12 h-12 text-white/20 animate-spin mb-4" />
        <div className="text-white/40 font-mono text-sm tracking-widest uppercase">INITIALIZING DISPLAY</div>
      </div>
    );
  }

  if (isError) {
    // Determine if it's a 404 or just suspended
    const errorMessage = (error as any)?.error || "Display Unavailable";
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center flex-col">
        <MonitorX className="w-24 h-24 text-white/10 mb-8" />
        <h1 className="text-3xl text-white/50 font-medium mb-2 uppercase tracking-wider">{errorMessage}</h1>
        <p className="text-white/30 font-mono">CLIENT ID: {customerId}</p>
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center text-white/20 font-mono text-sm border-t border-white/10 pt-4">
          <span>MENUCAST SYSTEM</span>
          <span>AWAITING CONNECTION...</span>
        </div>
      </div>
    );
  }

  if (!menu || !menu.imageUrl) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center flex-col">
        <div className="w-32 h-32 border-4 border-white/10 rounded-full flex items-center justify-center mb-8">
          <div className="w-2 h-2 bg-white/50 rounded-full animate-ping" />
        </div>
        <h1 className="text-4xl text-white/70 font-medium mb-4 uppercase tracking-widest">{menu?.restaurantName || "CONNECTED"}</h1>
        <p className="text-white/40 font-mono tracking-widest">AWAITING MENU BROADCAST</p>
        
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center text-white/30 font-mono text-sm border-t border-white/10 pt-4">
          <span>{customerId}</span>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            SYSTEM ONLINE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Main Image */}
      <img 
        src={menu.imageUrl} 
        alt="Digital Menu" 
        className="w-full h-full object-contain"
      />
      
      {/* Information Overlay Overlay - Only visible briefly or kept minimal */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-24 flex justify-between items-end opacity-60">
        <div>
          <h2 className="text-white font-bold text-2xl drop-shadow-md tracking-tight">{menu.restaurantName}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white/70 font-mono text-sm drop-shadow-md">
            UPDATED {format(new Date(menu.updatedAt), "HH:mm")}
          </div>
          <div className="flex items-center text-emerald-400 font-mono text-sm tracking-widest drop-shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
            LIVE
          </div>
        </div>
      </div>
    </div>
  );
}