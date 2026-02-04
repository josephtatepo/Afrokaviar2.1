import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-white/5 text-white backdrop-blur-md">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-[hsl(var(--accent))]" />
            <h1 className="text-2xl font-display text-white">404 — Not Found</h1>
          </div>

          <p className="mt-2 text-sm text-white/65">
            That page doesn’t exist yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
