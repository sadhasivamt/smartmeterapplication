import { AlertCircle, Settings, FileText, Play } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { FORCE_DEMO_MODE } from "../../config/demo";

interface ApiConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableDemoMode?: () => void;
  endpoint: string;
  errorMessage: string;
}

export function ApiConfigDialog({ isOpen, onClose, onEnableDemoMode, endpoint, errorMessage }: ApiConfigDialogProps) {
  const isHtmlError = errorMessage.includes("HTML instead of JSON");
  const is404Error = errorMessage.includes("not found");

  const handleEnableDemo = () => {
    onEnableDemoMode?.();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="size-6 text-orange-600" />
            <AlertDialogTitle>API Configuration Required</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">Error:</p>
                <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{errorMessage}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Current Endpoint:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-300 block">
                  {endpoint}
                </code>
              </div>

              {/* Demo Mode Option */}
              {onEnableDemoMode && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                    <Play className="size-4" />
                    Want to explore the UI first?
                  </p>
                  <p className="text-sm text-green-800 mb-3">
                    Enable <strong>Demo Mode</strong> to test the application with mock data while you configure your API.
                  </p>
                  <Button 
                    onClick={handleEnableDemo}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Play className="size-4 mr-2" />
                    Enable Demo Mode
                  </Button>
                </div>
              )}

              {(isHtmlError || is404Error) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Settings className="size-4" />
                    API Configuration Options:
                  </p>
                  <ol className="text-sm text-blue-800 space-y-2 ml-5 list-decimal">
                    <li>
                      <div>
                        <strong>For Development:</strong> Configure a proxy in <code className="bg-blue-100 px-1 rounded">vite.config.ts</code>
                      </div>
                      <pre className="text-xs bg-blue-100 p-2 rounded mt-1 overflow-x-auto">
{`server: {
  proxy: {
    '/log-auth': {
      target: 'https://your-api.com',
      changeOrigin: true,
    }
  }
}`}
                      </pre>
                    </li>
                    <li>
                      <div>
                        <strong>For Production:</strong> Set environment variable in <code className="bg-blue-100 px-1 rounded">.env</code>
                      </div>
                      <pre className="text-xs bg-blue-100 p-2 rounded mt-1">
{`VITE_API_BASE_URL=https://your-api.com`}
                      </pre>
                    </li>
                    <li>
                      <strong>Same Domain:</strong> Deploy API and frontend together (no config needed)
                    </li>
                  </ol>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-center gap-1">
                  <FileText className="size-4 flex-shrink-0" />
                  <span>See <code className="bg-yellow-100 px-1 rounded">API_SETUP.md</code> in the project root for detailed configuration instructions.</span>
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}