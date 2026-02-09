import { AlertCircle, Settings } from "lucide-react";
import { Button } from "./ui/button";

interface DemoModeBannerProps {
  onExitDemo: () => void;
}

export function DemoModeBanner({ onExitDemo }: DemoModeBannerProps) {
  return (
    <div className="fixed top-0 left-[156px] right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 shadow-md z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">
              Demo Mode Active - Using Mock Data
            </p>
            <p className="text-xs opacity-90">
              Configure your API endpoint to connect to real data
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onExitDemo}
          className="flex items-center gap-2 flex-shrink-0"
        >
          <Settings className="size-4" />
          Configure API
        </Button>
      </div>
    </div>
  );
}