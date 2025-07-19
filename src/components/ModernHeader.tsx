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
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ModernHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignIn = () => {
    navigate("/auth");
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/wardrobe");
    } else {
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: BarChart3,
    },
    {
      label: "Wardrobe",
      path: "/wardrobe",
      icon: Shirt,
    },
    {
      label: "Style Me",
      path: "/recommendations",
      icon: Sparkles,
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: BarChart3,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <div
          className="flex items-center space-x-4 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src="https://i.ibb.co/cSpbSRn7/logo.png"
            alt="DripMuse Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            DripMuse
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground shadow-button"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* Mobile Menu */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[320px] bg-background/95 backdrop-blur-md"
              >
                <div className="flex flex-col space-y-6 mt-8">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <img
                      src="https://i.ibb.co/cSpbSRn7/logo.png"
                      alt="DripMuse Logo"
                      className="w-8 h-8 object-contain"
                    />
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      DripMuse
                    </span>
                  </div>

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
                          "flex items-center gap-4 text-left text-lg py-4 px-4 rounded-xl transition-all duration-200",
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground shadow-button"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    );
                  })}

                  {user && (
                    <>
                      <hr className="border-border/50 my-4" />
                      <button
                        onClick={() => {
                          navigate("/edit-profile");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-4 text-left text-lg text-muted-foreground hover:text-foreground transition-colors py-4 px-4 rounded-xl hover:bg-muted/50"
                      >
                        <Settings className="h-5 w-5" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-4 text-left text-lg text-muted-foreground hover:text-foreground transition-colors py-4 px-4 rounded-xl hover:bg-muted/50"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  )}

                  {!user && (
                    <>
                      <hr className="border-border/50 my-4" />
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                          handleSignIn();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign In
                      </Button>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => {
                          handleGetStarted();
                          setMobileMenuOpen(false);
                        }}
                      >
                        Get Started
                      </Button>
                    </>
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
                  className="relative h-12 w-12 rounded-full"
                >
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage
                      src={profile?.face_photo_url || ""}
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-background/95 backdrop-blur-md"
                align="end"
              >
                <div className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={profile?.face_photo_url || ""}
                      alt="Profile"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {profile?.display_name || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/edit-profile")}
                  className="py-3"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/profile/palette")}
                  className="py-3"
                >
                  <Palette className="mr-3 h-4 w-4" />
                  Your Color Palette
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="py-3">
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Desktop Auth Buttons */}
          {!isMobile && !user && (
            <>
              <Button variant="ghost" size="lg" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-button"
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
};

export default ModernHeader;
