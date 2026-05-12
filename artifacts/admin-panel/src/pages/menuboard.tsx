import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { MonitorPlay, Hash, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MenuBoard() {
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleOpen = useCallback(() => {
    const id = customerId.trim().toUpperCase();
    if (!id) {
      setError("Please enter a Customer ID");
      return;
    }
    if (!/^REST\d{3}$/.test(id)) {
      setError("Format: REST001, REST002, etc.");
      return;
    }
    setError("");
    setLocation(`/display/${id}`);
  }, [customerId, setLocation]);

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12"
      style={{ paddingTop: "max(3rem, env(safe-area-inset-top))", paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}
    >
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center mb-5 shadow-sm">
        <MonitorPlay className="w-9 h-9 text-primary" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">MenuBoard</h1>
      <p className="text-muted-foreground text-sm mb-10">Restaurant Digital Menu Display</p>

      {/* Card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 mb-4">
        <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Customer ID</p>

        <div className={`flex items-center gap-2 bg-muted/50 border rounded-xl px-3 transition-colors ${error ? "border-destructive" : "border-border focus-within:border-primary"}`}>
          <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleOpen()}
            placeholder="REST001"
            className="border-0 bg-transparent h-12 text-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground/50"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive -mt-2">{error}</p>
        )}

        <Button
          className="w-full h-12 text-base gap-2"
          onClick={handleOpen}
        >
          Open Display
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Info card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-4 flex gap-3 mb-5">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Open on any TV, tablet, or mobile. Menu updates automatically when the admin uploads a new image.
        </p>
      </div>

      {/* Example chips */}
      <div className="flex gap-2 flex-wrap justify-center">
        {["REST001", "REST002", "REST003"].map((id) => (
          <button
            key={id}
            onClick={() => { setCustomerId(id); setError(""); }}
            className="px-4 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors font-medium"
          >
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}
