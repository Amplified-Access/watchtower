"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Loader from "@/components/common/loader";
import { Check, EllipsisVertical, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/_trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef, Row } from "@tanstack/react-table";

const ActionsMenu = ({ row }: { row: any }) => {
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const approveOrganizationMutation =
    trpc.approveOrganizationApplication.useMutation();

  const declineOrganizationMutation =
    trpc.declineOrganizationApplication.useMutation();

  const handleApproveOrganization = async (id: number, name: string) => {
    setIsApproving(true);
    try {
      const result = await approveOrganizationMutation.mutateAsync({
        id,
      });
      if (!result.success) {
        toast.error("result.message");
        return;
      }
      if (result.success) {
        queryClient.invalidateQueries();
        toast.success(name + " approved");
      }
    } catch (error) {
      toast.error(
        "Either organization exists or an error occured during creation"
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeclineOrganization = async (id: number, name: string) => {
    setIsApproving(true);
    try {
      const result = await declineOrganizationMutation.mutateAsync({
        id,
      });
      if (!result.success) {
        toast.error("result.message");
        return;
      }
      if (result.success) {
        queryClient.invalidateQueries();
        toast.success(name + "declined");
      }
    } catch (error) {
      toast.error(
        "Either organization exists or an error occured during creation"
      );
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isApproving}
        className={cn(
          "hover:cursor-pointer hover:bg-accent border-none outline-none"
        )}
      >
        {isApproving ? (
          <Loader size="16" />
        ) : (
          <EllipsisVertical size={16} className="" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() =>
            handleApproveOrganization(
              row.original.id,
              row.original.organizationName
            )
          }
          className="hover:bg-accent hover:cursor-pointer"
        >
          <Check className="text-green-500" />
          Approve
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            handleDeclineOrganization(
              row.original.id,
              row.original.organizationName
            )
          }
          className="hover:bg-destructive/10 hover:cursor-pointer"
        >
          <X className="text-destructive" />
          Decline
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionsMenu;
