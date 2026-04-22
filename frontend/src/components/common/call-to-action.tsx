import Link from "next/link";
import { Button } from "../ui/button";
import HeadingTwo from "./heading-two";
import TextComponent from "./text-component";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
type CallToActionProps = {
  title: string;
  description: string;
  variant: "primary" | "secondary";
  button1: {
    title: string;
    link: string;
  };
  button2: {
    title: string;
    link: string;
  };
};
const CallToAction = ({
  callToAction,
  variant = "primary",
  color = "background",
}: {
  callToAction: CallToActionProps;
  variant?: "primary" | "secondary";
  color?: "primary" | "background" | "white";
}) => {
  variant = callToAction.variant;
  return (
    <div
      className={` ${
        color == "primary"
          ? "bg-primary"
          : color == "background"
          ? "bg-background text-dark"
          : "bg-white border"
      } to-light text-center p-6 py-12 md:p-12 rounded-2xl`}
    >
      <HeadingTwo className={cn({ "text-background": color == "primary" })}>
        {callToAction.title}
      </HeadingTwo>
      <TextComponent
        className={cn("my-8 mx-auto lg:max-w-2xl", {
          "text-background/60": color == "primary",
        })}
      >
        {callToAction.description}
      </TextComponent>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          asChild
          size="lg"
          variant={color == "primary" ? "secondary" : "default"}
          className={cn("font-title font-medium text-primary", {
            "text-white": color == "white",
          })}
        >
          <Link
            href={callToAction.button1.link}
            className="flex items-center gap-2"
          >
            {callToAction.button1.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        {variant == "secondary" && (
          <Button
            asChild
            variant="outline"
            size="lg"
            className={cn(
              "bg-transparent hover:text-white font-title font-medium",
              {
                "border-white text-white hover:bg-background/20":
                  color == "primary",
                "hover:bg-primary/40 hover:text-white": color == "background",
                "hover:text-primary": color == "white",
              }
            )}
          >
            <Link href={callToAction.button2.link}>
              {callToAction.button2.title}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CallToAction;
