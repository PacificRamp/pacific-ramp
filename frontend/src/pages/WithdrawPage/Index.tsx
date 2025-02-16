import { Suspense } from "react";
import { WithdrawComponent } from "./_components/WithdrawComponent";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StakeComponent } from "@/pages/WithdrawPage/_components/StakeComponent";

import TableStake from "./_components/TableStake";

export const Stepper = () => {
  const [activeStep, setActiveStep] = useState(0); // 0: Withdraw, 1: Stake

  const handleNextStep = () => {
    if (activeStep < 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="w-full flex flex-col items-center mt-[82px]">
      <div className="flex space-x-5">
        <Button onClick={handlePreviousStep} disabled={activeStep === 0}>
          Withdrawal
        </Button>
        <Button onClick={handleNextStep} disabled={activeStep === 1}>
          Stake
        </Button>
      </div>
      <div className="min-h-[calc(100vh-82px-36px)] w-full flex justify-center items-center">
        {activeStep === 0 ? (
          <WithdrawComponent />
        ) : (
          <div className="flex flex-col gap-5 w-full items-center justify-center max-w-7xl">
            <StakeComponent />
            <TableStake />
          </div>
        )}
      </div>
    </div>
  );
};

export const WithdrawPage = () => {
  return (
    <div className="flex flex-col w-screen h-screen z-10 overflow-y-auto overflow-x-hidden">
      <Suspense fallback={<div>Loading...</div>}>
        <Stepper />
      </Suspense>
    </div>
  );
};
