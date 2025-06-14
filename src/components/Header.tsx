
import { Edit3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();

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
      </div>
    </header>
  );
};

export default Header;
