import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAccount } from "wagmi";
import { ADDRESS_USDM } from "@/constants/config";
import { toast } from "sonner";
import { useInsufficientBalance } from "@/hooks/useInsufficientBalance";
import { HexAddress } from "@/types";
import { LoadingTransaction } from "@/components/loader/LoadingTransaction";
import { pacificUsd } from "@/constants/pacificramp-coin";
import { CurrencyInput } from "@/components/card/CurrencyInput";
import { Method } from "@/components/card/Method";
import { ProcessingInfo } from "@/components/card/ProcessingInfo";
import { SuccessDialog } from "@/components/dialog/SuccessDialog";
import { rpCurrency } from "@/constants/rpCurrency";
import { ArrowDownUp } from "lucide-react";
import { useOnramp } from "@/hooks/useOnramp";

interface FormData {
  confirmed: boolean;
}

export const OnrampForm = () => {
  const { address } = useAccount();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [amountUSD, setAmountUSD] = useState(""); // USD amount
  const [amountIDR, setAmountIDR] = useState(""); // IDR amount

  const { insufficientBalance } = useInsufficientBalance(
    address as HexAddress,
    ADDRESS_USDM,
    amountUSD
  );

  const {
    swapHash,
    isSwapPending,
    isSwapConfirming,
    isSwapConfirmed,
    handleOnramp,
  } = useOnramp();

  const form = useForm<FormData>({
    defaultValues: {},
  });
  const fixedRate = 16100; // Fixed rate for 1 USD = 16100 IDR

  // Handle USD amount change
  const handleAmountUSDChange = useCallback((value: string) => {
    setAmountUSD(value);

    // Calculate the equivalent IDR
    const amountInUSD = parseFloat(value);
    if (!isNaN(amountInUSD)) {
      const equivalentInIDR = amountInUSD * fixedRate;
      setAmountIDR(equivalentInIDR.toFixed(2)); // Set equivalent IDR
    } else {
      setAmountIDR(""); // Clear IDR if USD is invalid
    }
  }, []);

  // Handle IDR amount change (optional, in case user wants to input in IDR)
  const handleAmountIDRChange = useCallback((value: string) => {
    setAmountIDR(value);

    // Calculate the equivalent USD based on the fixed rate
    const amountInIDR = parseFloat(value);
    if (!isNaN(amountInIDR)) {
      const equivalentInUSD = amountInIDR / fixedRate;
      setAmountUSD(equivalentInUSD.toFixed(2)); // Set equivalent USD
    } else {
      setAmountUSD(""); // Clear USD if IDR is invalid
    }
  }, []);

  useEffect(() => {
    if (isSwapConfirmed && swapHash) {
      setShowSuccessDialog(true);
      form.reset();
    }
  }, [isSwapConfirmed, swapHash, form]);

  const handleSubmit = useCallback(async () => {
    if (insufficientBalance) {
      toast.error("Invalid amount or not enough balance!");
      return;
    }
    setShowSuccessDialog(false);

    await handleOnramp(amountUSD);

    toast.success("Offramp request submitted!");
  }, [insufficientBalance, handleOnramp, amountUSD]);

  const isSubmitDisabled = useMemo(
    () =>
      isSwapPending ||
      isSwapConfirming ||
      insufficientBalance ||
      typeof amountUSD === "undefined" ||
      amountUSD === "",
    [isSwapPending, isSwapConfirming, insufficientBalance, amountUSD]
  );

  const buttonText = useMemo(() => {
    if (isSwapPending || isSwapConfirming) {
      return "Offramping...";
    }
    if (insufficientBalance) {
      return "Insufficient balance";
    }
    return "Submit";
  }, [isSwapPending, isSwapConfirming, insufficientBalance]);

  return (
    <>
      {(isSwapPending || isSwapConfirming) && (
        <LoadingTransaction
          message={isSwapPending ? "Offramping..." : "Confirming offramp..."}
        />
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex relative flex-col h-fit w-auto gap-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <CurrencyInput
                  value={amountIDR}
                  onChange={handleAmountIDRChange}
                  coin={rpCurrency}
                />
              </motion.div>
              <motion.div className="flex items-center justify-center">
                <ArrowDownUp />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CurrencyInput
                  value={amountUSD}
                  onChange={handleAmountUSDChange}
                  coin={pacificUsd}
                  disabled
                />
              </motion.div>
            </div>
            <div className="flex flex-row gap-5">
              <Method
                value="jackramp"
                title="JackRamp"
                duration="Realtime"
                rate="1 USD = 16100 IDR"
                onClick={() => {}}
              />
              <Method
                value="-"
                title="Available Soon"
                duration="-"
                rate="-"
                onClick={() => {}}
              />
            </div>
            <ProcessingInfo method="jackramp" networkFee="-" />
            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={isSubmitDisabled}
            >
              {buttonText}
            </Button>
          </div>
        </form>
      </Form>
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        txHash={swapHash || ""}
        amount={amountUSD}
        processName="Off Ramp"
      />
    </>
  );
};
