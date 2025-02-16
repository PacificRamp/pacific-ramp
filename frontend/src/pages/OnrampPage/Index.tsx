import { OnrampComponent } from "@/pages/OnrampPage/_components/OnrampComponent";
import { Suspense } from "react";

export const OnrampPage = () => {
  return (
    <div className="flex flex-col w-screen h-screen z-10 overflow-y-auto overflow-x-hidden">
      <Suspense fallback={<div>Loading...</div>}>
        <OnrampComponent />
      </Suspense>
    </div>
  );
};
