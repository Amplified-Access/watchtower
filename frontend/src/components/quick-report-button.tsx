"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import OrganizationIncidentReportForm from "@/features/organization-reporting/components/organization-incident-report-form";

interface QuickReportButtonProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const QuickReportButton: React.FC<QuickReportButtonProps> = ({
  className = "",
  variant = "default",
  size = "default",
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSuccess = () => {
    // Optionally refresh data or show additional success messaging
  };

  return (
    <>
      <Button
        onClick={handleOpenForm}
        className={className}
        variant={variant}
        size={size}
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Quick Report
      </Button>

      <OrganizationIncidentReportForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default QuickReportButton;
