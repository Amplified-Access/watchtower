import Container from "@/components/common/container";
import TextComponent from "@/components/common/text-component";
import OrganizationRegistrationForm from "@/features/organization-registration/components/organization-registration-form";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import BackButton from "./back-button";

const page = () => {
  return (
    <section className="py-3  h-[100vh] flex flex-col justify-center">
      <Container className=" lg:px-4 " size="sm">
        <div className="grid md:grid-cols-2  w-full h-full rounded-2xl max-w-screen md:relative isolate overflow-hidden">
          <div className="bg-white shadow-sm aspect-square w-9 h-9 grid place-items-center rounded-full absolute top-4 border">
            <BackButton />
          </div>
          <div className="relative isolate hidden md:flex flex-col justify-between bg-primary w-full  p-10">
            <BackButton />
            <Image
              src={"/topographic.svg"}
              alt={""}
              width={1000}
              height={1000}
              className=" -z-1 absolute w-full h-full opacity-10 object-cover  top-0 left-0 "
            />
            <div>
              <h1 className="text-3xl text-muted font-semibold font-title max-w-96 leading-tight pb-4">
                Report incidents Stay protected
              </h1>
              <TextComponent className="max-w-lg text-muted/70">
                Submit an application to WatchTower to begin reporting and
                managing incidents securely, or{" "}
                <Link href={"/sign-in"} className=" underline">
                  <span> click here </span>
                </Link>{" "}
                to sign in to an existing account .
              </TextComponent>
            </div>
          </div>
          <div className="w-full flex flex-col justify-center items-center bg-white py-10 2xl:py-20">
            <OrganizationRegistrationForm />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default page;
