
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface PostCardProps {
  content: string;
  onCopy: () => void;
}

const PostCard = ({ content, onCopy }: PostCardProps) => {
  return (
    <Card className="border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-3">
          <p className="text-gray-800 leading-relaxed flex-1 text-base">
            {content}
          </p>
          <Button
            onClick={onCopy}
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-9 w-9 p-0 border-2 hover:bg-blue-50 hover:border-blue-300"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
