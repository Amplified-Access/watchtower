import { Plus } from "lucide-react";
import Link from "next/link";

const NewForm = () => {
  return (
    <div>
      <Link href={"/admin/forms/untitled"} className="">
        <div className="w-36  ">
          <div className="w-full h-44 bg-white">
            <div className="w-fit h-fit border-r border-b">
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: " 0px solid transparent",
                  borderRight: "40px solid transparent",
                  borderTop: "40px solid oklch(0.97 0 0)",
                }}
              />
            </div>
            <div className="flex flex-col gap-4 px-4 pt-9 h-full">
              <Plus className="mx-auto" />
            </div>
          </div>
          <h4 className="line-clamp-1 pt-2 text-center">New form</h4>
        </div>
      </Link>
    </div>
  );
};

export default NewForm;
