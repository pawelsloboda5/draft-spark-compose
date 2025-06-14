
import { Edit3 } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white border-b-2 border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Edit3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DraftCreate
            </h1>
            <p className="text-sm text-gray-600">AI-powered content generation</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
