import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Maximize2, Save } from "lucide-react";
import Link from "next/link";
import Loader from "@/components/common/loader";

const FormPreview = ({
  questions,
  title,
  setTitle,
  formId,
  handleSaveForm,
  isSaving,
}: any) => {
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);

  interface UseOnClickOutsideHandler {
    (event: MouseEvent): void;
  }

  interface RefObject<T> {
    current: T | null;
  }

  const useOnClickOutside = (
    ref: RefObject<HTMLElement>,
    handler: UseOnClickOutsideHandler
  ): void => {
    useEffect(() => {
      const listener = (event: MouseEvent) => {
        // Do nothing if clicking ref's element or descendant elements.
        if (!ref.current || ref.current.contains(event.target as Node)) {
          return;
        }
        // Call the handler function.
        handler(event);
      };

      document.addEventListener("mousedown", listener);

      return () => {
        document.removeEventListener("mousedown", listener);
      };
    });
  };

  const formTitleRef = useRef(null);

  useOnClickOutside(formTitleRef, () => setIsEditingTitle(false));

  return (
    <div className="flex-1  bg-muted/20 border-b">
      <div className="border-b relative bg-sidebar">
        <h3 className="font-semibold  p-2 px-4 text-center">Preview</h3>
        {/* {formId && (
          <Link
            href={`/admin/forms/${formId}/preview`}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <Button variant="ghost" size="icon">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </Link>
        )} */}
      </div>
      <ScrollArea className="h-[calc(100dvh-200px)] px-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="bg-white space-y-6 border p-4 rounded-md max-w-2xl my-8 mx-auto"
        >
          <div className="">
            {isEditingTitle ? (
              <div className="flex gap-2">
                <Input
                  className=""
                  ref={formTitleRef}
                  defaultValue={"untitled"}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                  }}
                />
                <Button onClick={() => setIsEditingTitle(false)}>Save</Button>
              </div>
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="font-semibold text-2xl text-center"
              >
                {title || "Untitled"}
              </h2>
            )}
          </div>
          {Object.values(questions).map((q: any, idx: number) => {
            const isRequired = q.required === true || q.required === "on";
            const description = q.description || "";
            if (q.type === "short-answer") {
              return (
                <div key={idx} className="space-y-2">
                  <Label className="pb-1">
                    {q.title}
                    {isRequired && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    className="bg-white"
                    required={isRequired}
                    placeholder={description}
                  />
                </div>
              );
            }
            if (q.type === "paragraph") {
              return (
                <div key={idx} className="space-y-2">
                  <Label className="pb-1">
                    {q.title}
                    {isRequired && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    className="bg-white h-40"
                    required={isRequired}
                    placeholder={description}
                  />
                </div>
              );
            }
            if (q.type === "multiple-choice") {
              const options = q.options;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex flex-col gap-1 mb-3">
                    <Label>
                      {q.title}
                      {isRequired && <span className="text-red-500">*</span>}
                    </Label>
                    {description && (
                      <div className="text-muted-foreground text-sm ">
                        {description}
                      </div>
                    )}
                  </div>
                  <RadioGroup required={isRequired}>
                    {options.map((opt: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 pb-1 hover:cursor-pointer"
                      >
                        <RadioGroupItem
                          className="bg-white "
                          value={opt}
                          id={`radio-${idx}-${i}`}
                        />
                        <Label htmlFor={`radio-${idx}-${i}`}>{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );
            }
            if (q.type === "drop-down") {
              const options = Object.keys(q)
                .filter((k) => k.startsWith("option") && q[k])
                .map((k) => q[k]);
              return (
                <div key={idx} className="space-y-2">
                  <Label className="pb-1">
                    {q.title}
                    {isRequired && <span className="text-red-500">*</span>}
                  </Label>
                  {/* {description && (
                  <div className="text-muted-foreground text-sm mb-1">
                    {description}
                  </div>
                )} */}
                  <Select required={isRequired}>
                    <SelectTrigger className="bg-white">
                      <SelectValue
                        placeholder={description || "Select an option"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt: string, i: number) => (
                        <SelectItem key={i} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }
            // Fallback for unknown type
            return null;
          })}
        </form>
      </ScrollArea>
      <div className="flex justify-end pr-2">
        <Button onClick={handleSaveForm} disabled={isSaving}>
          {isSaving ? (
            <Loader size="16" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              {formId ? "Update" : "Save"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FormPreview;
