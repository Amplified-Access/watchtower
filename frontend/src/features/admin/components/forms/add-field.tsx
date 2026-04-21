import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

const AddField = ({ questions, setQuestions }: any) => {
  const [fieldType, setFieldType] = useState("short-answer");
  const [options, setOptions] = useState([
    { name: "option1", placeholder: "Option 1" },
  ]);
  const [isRequired, setIsRequired] = useState(false);
  const [open, setOpen] = useState(false);

  const fieldOptions = [
    { value: "short-answer", label: "Short answer" },
    { value: "paragraph", label: "Paragraph" },
    { value: "multiple-choice", label: "Multiple choice" },
    { value: "drop-down", label: "Drop down" },
  ];

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newQuestion: Record<string, any> = {};

    // Get form values
    for (let [key, value] of formData.entries()) {
      if (value) {
        // Only add non-empty values
        newQuestion[key] = value;
      }
    }

    // Validate title
    if (!newQuestion.title) {
      alert("Please provide a title for the question");
      return;
    }

    newQuestion.type = fieldType;
    newQuestion.required = isRequired;

    if (fieldType === "multiple-choice" || fieldType === "drop-down") {
      const formOptions = options
        .map((opt) => formData.get(opt.name))
        .filter(Boolean);

      if (formOptions.length === 0) {
        alert("Please provide at least one option");
        return;
      }

      newQuestion.options = formOptions;
    }

    // Add question with unique key
    const questionKey =
      newQuestion.title.replace(/\s+/g, "_").toLowerCase() + "_" + Date.now();
    setQuestions((prev: any) => ({
      ...prev,
      [questionKey]: newQuestion,
    }));

    // Reset form and close dialog
    e.target.reset();
    setFieldType("short-answer");
    setOptions([{ name: "option1", placeholder: "Option 1" }]);
    setIsRequired(false);
    setOpen(false);
  };

  return (
    <div className="flex justify-center">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          asChild
          className={cn(
            "text-black border aspect-square h-9 w-9 grid place-items-center rounded-md hover:bg-white hover:cursor-pointer"
          )}
        >
          <span>
            <Plus className="shrink-0 " size={16} />
          </span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="mb-4">
              <DialogTitle>Add a field</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="flex justify-between">
                <Select value={fieldType} onValueChange={setFieldType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Field Types</SelectLabel>
                      {fieldOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <span>Required?</span>
                  <Switch
                    checked={isRequired}
                    onCheckedChange={setIsRequired}
                  />
                </div>
              </div>
              {(fieldType === "short-answer" || fieldType === "paragraph") && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="title">Title / Question</Label>
                    <Input id="title" name="title" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea id="description" name="description" />
                  </div>
                </>
              )}
              {(fieldType === "multiple-choice" ||
                fieldType === "drop-down") && (
                <ScrollArea className="max-h-80 pe-3">
                  <div className="grid gap-3 pb-3">
                    <Label htmlFor="title">Title / Question</Label>
                    <Input id="title" name="title" />
                  </div>
                  <div className="grid gap-3 pb-3">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div className="grid gap-3 pb-3">
                    <Label>Options</Label>
                    {options.map(({ name, placeholder }, index) => (
                      <div className="relative" key={index}>
                        <Input name={name} placeholder={placeholder} />
                        <button
                          type="button"
                          className="absolute hover:cursor-pointer text-muted-foreground/50 hover:border-red-500 hover:bg-red-500/20 hover:text-red-500 rounded-full border p-0.5 right-2 top-1/2 -translate-y-1/2"
                          onClick={() => {
                            setOptions((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <X className="" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        setOptions((prev) => [
                          ...prev,
                          {
                            name: "option" + (prev.length + 1),
                            placeholder: "Option " + (prev.length + 1),
                          },
                        ]);
                      }}
                      className="hover:cursor-pointer"
                    >
                      Add Option
                    </Button>
                  </div>
                </ScrollArea>
              )}
              {fieldType && (
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add field</Button>
                </DialogFooter>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddField;
