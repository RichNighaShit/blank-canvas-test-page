import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  LogOut,
  BarChart3,
  Menu,
  Sparkles,
  Shirt,
  Palette,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const Header = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignIn = useCallback(() => {
    navigate("/auth");
  }, [navigate]);

  const handleGetStarted = useCallback(() => {
    if (user) {
      navigate("/wardrobe");
    } else {
      navigate("/auth");
    }
  }, [navigate, user]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  const navigationItems = useMemo(
    () => [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: BarChart3,
        tourId: "dashboard-nav"
      },
      {
        label: "Wardrobe",
        path: "/wardrobe",
        icon: Shirt,
        tourId: "wardrobe-nav"
      },
      {
        label: "Style Me",
        path: "/recommendations",
        icon: Sparkles,
        tourId: "style-me-nav"
      },
      {
        label: "Analytics",
        path: "/analytics",
        icon: BarChart3,
        tourId: "analytics-nav"
      },
    ],
    [],
  );

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="https://i.ibb.co/cSpbSRn7/logo.png"
            alt="DripMuse Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            DripMuse
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                {...(import.meta.env.DEV && { 'data-tour': item.tourId })}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-3">
          <ThemeToggle />

          {/* Mobile Menu */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-6">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 text-left py-3 px-4 rounded-lg transition-colors",
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    );
                  })}

                  {user && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <button
                          onClick={() => {
                            navigate("/edit-profile");
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 text-left py-3 px-4 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors"
                        >
                          <Settings className="h-5 w-5" />
                          Edit Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate("/profile/palette");
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 text-left py-3 px-4 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors"
                        >
                          <Palette className="h-5 w-5" />
                          Your Color Palette
                        </button>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 text-left py-3 px-4 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors"
                        >
                          <LogOut className="h-5 w-5" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}

                  {!user && (
                    <div className="border-t pt-4 mt-4 space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          handleSignIn();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => {
                          handleGetStarted();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Desktop User Menu */}
          {!isMobile && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={profile?.face_photo_url || ""}
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.face_photo_url || ""}
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {profile?.display_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/edit-profile")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/palette")} {...(import.meta.env.DEV && { 'data-tour': 'color-palette-nav' })}>
                  <Palette className="mr-2 h-4 w-4" />
                  Your Color Palette
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Desktop Auth Buttons */}
          {!isMobile && !user && (
            <>
              <Button variant="ghost" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
});

export default Header;
