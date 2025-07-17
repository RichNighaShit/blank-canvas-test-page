
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Check } from "lucide-react";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
  onInstallSuccess?: () => void;
  showText?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = "ghost",
  size = "default",
  className = "",
  onInstallSuccess,
  showText = true,
}) => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
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
      logUserAction("pwa_install_prompt_available");
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
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
  }, [onInstallSuccess, logUserAction]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);
    logUserAction("pwa_install_click");

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        logUserAction("pwa_install_accepted");
      } else {
        logUserAction("pwa_install_rejected");
      }
    } catch (error) {
      handleError(error, "Failed to show install prompt", {
        context: { component: "PWAInstallButton", action: "install" },
      });
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Check className="w-4 h-4 mr-2" />
        {showText && "App Installed"}
      </Button>
    );
  }

  // Don't show if prompt not available
  if (!deferredPrompt) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleInstallClick}
      disabled={isInstalling}
    >
      {isInstalling ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {showText && (isInstalling ? "Installing..." : "Install App")}
    </Button>
  );
};

export default PWAInstallButton;
