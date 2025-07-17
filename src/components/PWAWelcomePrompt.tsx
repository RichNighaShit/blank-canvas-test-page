
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  X,
  Smartphone,
  Zap,
  Wifi,
  Star,
  ArrowRight,
} from "lucide-react";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAWelcomePromptProps {
  onInstallSuccess?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const PWAWelcomePrompt: React.FC<PWAWelcomePromptProps> = ({
  onInstallSuccess,
  onDismiss,
  className = "",
}) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { logUserAction, handleError } = useErrorHandler();

  useEffect(() => {
    // Check if already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isInstalled = (window.navigator as any).standalone || isStandalone;
      setIsInstalled(isInstalled);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(promptEvent);

      // Check if user has previously dismissed
      const dismissed = localStorage.getItem("pwa-welcome-dismissed");
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Show prompt for new users or after 7 days
      if (!isInstalled && (!dismissed || daysSinceDismissed > 7)) {
        // Delay showing prompt to not interrupt initial experience
        setTimeout(() => setShowPrompt(true), 3000);
      }

      logUserAction("pwa_install_prompt_available");
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      logUserAction("pwa_installed");
      onInstallSuccess?.();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled, onInstallSuccess, logUserAction]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    logUserAction("pwa_install_click");

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        logUserAction("pwa_install_accepted");
        setShowPrompt(false);
      } else {
        logUserAction("pwa_install_rejected");
      }
    } catch (error) {
      handleError(error, "Failed to show install prompt", {
        context: { component: "PWAWelcomePrompt", action: "install" },
      });
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-welcome-dismissed", Date.now().toString());
    logUserAction("pwa_welcome_dismissed");
    onDismiss?.();
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Set a shorter dismissal period for "remind later"  
    const remindTime = Date.now() - 6 * 24 * 60 * 60 * 1000; // Remind in 1 day
    localStorage.setItem("pwa-welcome-dismissed", remindTime.toString());
    logUserAction("pwa_welcome_remind_later");
  };

  // Don't show if already installed or user dismissed or no prompt available
  if (isInstalled || !deferredPrompt || !showPrompt) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md mx-4 bg-background shadow-2xl border-0 animate-slide-in-right md:animate-scale-in">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Install DripMuse
              </CardTitle>
              <CardDescription className="mt-2 text-sm">
                Get the full app experience with offline access and quick launch
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 md:space-y-6">
          {/* Benefits - Mobile optimized */}
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Lightning Fast</div>
                <div className="text-xs text-muted-foreground">
                  Instant access from your home screen
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wifi className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Works Offline</div>
                <div className="text-xs text-muted-foreground">
                  Access your wardrobe without internet
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Native Experience</div>
                <div className="text-xs text-muted-foreground">
                  App-like interface and notifications
                </div>
              </div>
            </div>
          </div>

          {/* Installation Steps Preview */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 md:p-4">
            <div className="text-sm font-medium mb-2 text-center">
              Quick & Easy Installation
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="px-2 py-1 text-xs">
                1 Click
              </Badge>
              <ArrowRight className="w-3 h-3" />
              <Badge variant="outline" className="px-2 py-1 text-xs">
                Confirm
              </Badge>
              <ArrowRight className="w-3 h-3" />
              <Badge variant="outline" className="px-2 py-1 text-xs">
                Enjoy!
              </Badge>
            </div>
          </div>

          {/* Action Buttons - Mobile optimized */}
          <div className="space-y-3">
            <Button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 text-sm md:text-base"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Install Now
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRemindLater}
                className="flex-1 text-sm"
                size="sm"
              >
                Remind Later
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="flex-1 text-sm"
                size="sm"
              >
                Not Now
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Free</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Offline</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAWelcomePrompt;
