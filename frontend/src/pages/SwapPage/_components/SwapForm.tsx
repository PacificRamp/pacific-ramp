import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAccount } from "wagmi";
import { ADDRESS_USDM } from "@/constants/config";
import { useSwap } from "@/hooks/useSwap";
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
import { bank } from "@/constants/bank";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface FormData {
  confirmed: boolean;
}

export const SwapForm = () => {
  const [amountUSD, setAmountUSD] = useState(""); // USD amount
  const [amountIDR, setAmountIDR] = useState(""); // IDR amount
  const fixedRate = 16100; // 1 USD = 16100 IDR
  const { address } = useAccount();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedBank, setSelectedBank] = useState(bank[0]);
  const [channelAccount, setChannelAccount] = useState("");

  // New state to track AML analysis status
  const [isAMLLoading, setIsAMLLoading] = useState(false);
  const [showAMLResult, setShowAMLResult] = useState(false);
  const [amlResult, setAmlResult] = useState<string | null>(null);

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
    handleSwap,
  } = useSwap();

  const form = useForm<FormData>({
    defaultValues: {},
  });

  const handleAmountChange = useCallback((value: string) => {
    setAmountUSD(value); // Update USD amount

    const amountInUSD = parseFloat(value);
    if (!isNaN(amountInUSD)) {
      const equivalentInIDR = amountInUSD * fixedRate;
      setAmountIDR(equivalentInIDR.toString()); // Set the calculated IDR amount
    } else {
      setAmountIDR(""); // Clear IDR if USD is invalid
    }
  }, []);

  const handleChannelAccountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setChannelAccount(e.target.value);
    },
    []
  );

  useEffect(() => {
    if (isSwapConfirmed && swapHash) {
      setShowSuccessDialog(true);
      form.reset();
      setChannelAccount(""); // Reset channel account on success
    }
  }, [isSwapConfirmed, swapHash, form]);

  const handleBankSelect = (value: string) => {
    const selected = bank.find((b) => b.name === value);
    if (selected) {
      setSelectedBank(selected);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (insufficientBalance) {
      toast.error("Invalid amount or not enough balance!");
      return;
    }
    if (!selectedBank) {
      toast.error("Please select a bank!");
      return;
    }
    if (!channelAccount.trim()) {
      toast.error("Please enter a bank number!");
      return;
    }

    // Step 1: Simulate AML check (this will be a mock API request)
    setIsAMLLoading(true);
    setAmlResult(null); // Clear previous result

    // Simulate delay for AML check (mock API request)
    setTimeout(async () => {
      setIsAMLLoading(false);

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      const sourceOfFunds = "Binance";

      const raw = JSON.stringify({
        message: `${address} is requesting to offramp ${amountUSD} USD from ${sourceOfFunds}`,
      });

      const result = await fetch("https://api-agent.pacificramp.xyz/chat", {
        method: "POST",
        headers: myHeaders,
        body: raw,
      }).then((response) => response.text());

      const mockResult = result.includes("SAFE") ? "Approved" : "Rejected";
      setAmlResult(mockResult);
      setShowAMLResult(true);

      if (mockResult === "Rejected") {
        toast.error("AML check failed, transaction rejected!");

        await new Promise((resolve) => setTimeout(resolve, 1000));

        setShowAMLResult(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowSuccessDialog(false);
      setShowAMLResult(false);

      await handleSwap(amountUSD, selectedBank.name, channelAccount);
    }, 3000);
  }, [
    amountUSD,
    insufficientBalance,
    handleSwap,
    selectedBank,
    channelAccount,
  ]);

  const isSubmitDisabled = useMemo(
    () =>
      isSwapPending ||
      isSwapConfirming ||
      insufficientBalance ||
      typeof amountUSD === "undefined" ||
      amountUSD === "" ||
      !selectedBank ||
      !channelAccount.trim(),
    [
      isSwapPending,
      isSwapConfirming,
      insufficientBalance,
      amountUSD,
      selectedBank,
      channelAccount,
    ]
  );

  const buttonText = useMemo(() => {
    if (isSwapPending || isSwapConfirming) {
      return "Offramping...";
    }
    if (insufficientBalance) {
      return "Insufficient balance";
    }
    if (!selectedBank) {
      return "Select a bank";
    }
    if (!channelAccount.trim()) {
      return "Enter bank number";
    }
    return "Submit";
  }, [
    isSwapPending,
    isSwapConfirming,
    insufficientBalance,
    selectedBank,
    channelAccount,
  ]);

  return (
    <>
      {(isSwapPending || isSwapConfirming) && (
        <LoadingTransaction
          message={isSwapPending ? "Offramping..." : "Confirming offramp..."}
        />
      )}

      {isAMLLoading && (
        <div className="flex justify-center items-center w-full h-full fixed top-0 left-0 bg-opacity-50 bg-gray-800 z-50">
          <span className="text-xl text-white font-semibold animate-pulse">
            Analysing Address for AML Security...
          </span>
        </div>
      )}

      {amlResult && !isAMLLoading && showAMLResult && (
        <div className="flex justify-center items-center w-full h-full fixed top-0 left-0 bg-opacity-50 bg-gray-800 z-50">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-lg w-full">
            <span className="text-2xl font-bold text-gray-800">
              AML Check Result:{" "}
              <span
                className={`font-semibold ${
                  amlResult === "Approved" ? "text-green-500" : "text-red-500"
                }`}
              >
                {amlResult}
              </span>
            </span>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex relative flex-col h-fit w-auto gap-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CurrencyInput
                  value={amountUSD} // USD amount
                  onChange={handleAmountChange} // Handle USD input change
                  coin={pacificUsd}
                />
              </motion.div>

              <motion.div className="flex items-center justify-center">
                <ArrowDownUp />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <CurrencyInput
                  value={amountIDR} // IDR amount (calculated from USD)
                  onChange={() => {}} // Disabled, no need to change
                  coin={rpCurrency}
                  disabled
                />
              </motion.div>
            </div>
            <div className="flex flex-row gap-5">
              <Method
                value="jackramp"
                title="JackRamp"
                duration="Realtime"
                rate="16100 IDR = 1 USD"
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
            <div className="w-full">
              <Select
                onValueChange={handleBankSelect}
                defaultValue={selectedBank.name}
              >
                <SelectTrigger className="w-full h-14 px-4 bg-transparent border-gray-500 border-[3px] rounded-xl">
                  <div className="flex items-center gap-2">
                    <SelectValue placeholder="Select a bank" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {bank.map((bankOption) => (
                      <SelectItem
                        key={bankOption.name}
                        value={bankOption.name}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={bankOption.image}
                            alt={bankOption.name}
                            className="w-12 h-8 px-2 object-contain bg-white rounded-lg"
                          />
                          <span>{bankOption.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Input
              type="text"
              className="bg-transparent border-gray-500 border-[3px] px-5 py-6 rounded-xl"
              value={channelAccount}
              onChange={handleChannelAccountChange}
              placeholder="Bank Number"
            />
            <ProcessingInfo method="jackramp" networkFee="-" />
            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={isSubmitDisabled || isAMLLoading}
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
