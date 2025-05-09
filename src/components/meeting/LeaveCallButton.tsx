
import React from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LeaveCallButtonProps {
  onClick: () => void;
}

const LeaveCallButton: React.FC<LeaveCallButtonProps> = ({ onClick }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          onClick={onClick}
          className="h-12 w-12 rounded-full"
        >
          <Phone className="h-5 w-5 rotate-[135deg]" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Leave meeting</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default LeaveCallButton;
