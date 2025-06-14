
import { Edit3, LogOut, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import ProfileDrawer from "./ProfileDrawer";

const Header = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully",
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="container mx-auto max-w-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">DraftCreate</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:block text-sm text-gray-600">
              {user.email}
            </div>
          )}
          <button
            aria-label="Profile"
            className="rounded-full p-2 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <Cog className="w-5 h-5 text-gray-500" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
        <ProfileDrawer open={drawerOpen} setOpen={setDrawerOpen} />
      </div>
    </header>
  );
};

export default Header;
