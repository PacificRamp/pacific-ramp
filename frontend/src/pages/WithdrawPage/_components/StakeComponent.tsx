"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/card/CurrencyInput"; // Used for pUSD input
import { pacificUsd } from "@/constants/pacificramp-coin";
import { Card, CardContent } from "@/components/ui/card";
import {
  Label as LabelHeadless,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { SuccessDialog } from "@/components/dialog/SuccessDialog";
import { Loader2 } from "lucide-react";

import { useAccount, useWriteContract } from "wagmi";
import { useBalance } from "@/hooks/useBalance";

import { convertBigIntToNumber } from "@/lib/utils";

import { HexAddress } from "@/types";

import { ADDRESS_PACIFICRAMP, ADDRESS_USDM } from "@/constants/config";

import { toast } from "sonner";
import { mockJackUSDABI } from "@/lib/abi/mockJackUSDABI";

interface OptionsStake {
  img: string;
  value: string;
}

const OPTIONS: OptionsStake[] = [
  {
    img: "https://images.seeklogo.com/logo-png/47/2/manta-network-manta-logo-png_seeklogo-476308.png",
    value: "Manta CeDeFi",
  },
  {
    img: "https://resources.accumulated.finance/platforms/acfi.png",
    value: "Accumulated Finance",
  },
];

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m13 8l4 4l-4 4M7 8l4 4l-4 4"
    />
  </svg>
);

export const StakeComponent = () => {
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<OptionsStake>(
    OPTIONS[0]
  );
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);

  const { address } = useAccount();

  const { balance } = useBalance(address as HexAddress, ADDRESS_PACIFICRAMP);

  const handleSuccessDialogClose = () => {
    setIsSuccessDialogOpen(false);
  };

  const handleStakeAmountChange = (value: string) => {
    setStakeAmount(value);
  };

  const insufficientBalance = useMemo(() => {
    if (balance === undefined || stakeAmount === "") return false;
    return (
      convertBigIntToNumber(balance) <
      convertBigIntToNumber(BigInt(stakeAmount))
    );
  }, [balance, stakeAmount]);

  const handleProviderChange = (provider: OptionsStake) => {
    setSelectedProvider(provider);
  };

  const {
    data: stakeHash,
    isPending: isStakePending,
    writeContractAsync: writeStake,
  } = useWriteContract();

  const handleStake = async (amount: string, provider: string) => {
    try {
      await writeStake({
        abi: mockJackUSDABI,
        address: ADDRESS_PACIFICRAMP,
        functionName: "stake",
        args: [BigInt(amount), provider],
      });

      toast.success("Stake successfully!");
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Transaction failed. Please try again."
      );
    }
  };

  const {
    // data: approvalHash,
    isPending: isApprovalPending,
    writeContractAsync: writeApproval,
  } = useWriteContract();

  const handleSubmit = () => {
    if (
      !selectedProvider ||
      !stakeAmount ||
      insufficientBalance 
      // !isStakePending ||
      // !isApprovalPending
    ) {
      // Show error if no provider or stake amount is selected
      toast.error("Invalid amount or not enough balance!");
      return;
    }

    console.log(
      `Staking ${stakeAmount} pUSD with provider ${selectedProvider}`
    );

    writeApproval({
      abi: mockJackUSDABI,
      address: ADDRESS_USDM,
      functionName: "approve",
      args: [ADDRESS_PACIFICRAMP, BigInt(stakeAmount)],
    }).then(() => {
      handleStake(stakeAmount, selectedProvider.value).then(() => {
        setIsSuccessDialogOpen(true);
      });
    });
  };

  return (
    <div className="flex flex-col gap-5 pt-5">
      <SuccessDialog
        isOpen={isSuccessDialogOpen}
        onClose={handleSuccessDialogClose}
        txHash={stakeHash || "-"}
        amount={stakeAmount || "-"}
        processName={"Stake"}
      />
      <Card className="max-w-[400px] border-none outline-none">
        <CardContent className="p-10">
          <div className="space-y-6">
            {/* Staking Provider Dropdown */}
            <div>
              <Listbox value={selectedProvider} onChange={handleProviderChange}>
                <LabelHeadless className="block text-sm/6 font-medium text-gray-400">
                  Select Staking Provider
                </LabelHeadless>
                <div className="relative mt-2">
                  <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                    <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6">
                      <img
                        alt={selectedProvider.value}
                        src={selectedProvider.img}
                        className="size-5 shrink-0 rounded-full"
                      />
                      <span className="block truncate">
                        {selectedProvider.value}
                      </span>
                    </span>

                    <div className="col-start-1 row-start-1 self-center justify-self-end text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="size-5 sm:size-4"
                      >
                        <path
                          fill="currentColor"
                          d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6l-6-6z"
                        />
                      </svg>
                    </div>
                  </ListboxButton>

                  <ListboxOptions
                    transition
                    className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base ring-1 shadow-lg ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
                  >
                    {OPTIONS.map((item, index) => (
                      <ListboxOption
                        key={index}
                        value={item}
                        className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                      >
                        <div className="flex items-center">
                          <img
                            alt={item.value}
                            src={item.img}
                            className="size-5 shrink-0 rounded-full"
                          />
                          <span className="ml-3 block truncate font-normal group-data-selected:font-semibold">
                            {item.value}
                          </span>
                        </div>
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            {/* Amount to Stake */}
            <div className="space-y-2">
              <Label>Enter Amount to Stake (pUSD)</Label>
              <CurrencyInput
                value={stakeAmount}
                onChange={handleStakeAmountChange}
                coin={pacificUsd}
              />
            </div>

            {/* Logo */}
            <div className="w-full flex flex-row justify-between">
              {/* Staking Provider Dropdown */}
              <div>
                <img
                  alt={"Pasific USD"}
                  src={pacificUsd.image}
                  className="h-6 w-auto shrink-0 rounded-full"
                />
              </div>
              <ChevronIcon />
              <div>
                <img
                  alt={"Mountain Protovol"}
                  src={
                    "https://media.licdn.com/dms/image/v2/D4E0BAQGH0MsytCDApw/company-logo_200_200/company-logo_200_200/0/1694466386519/mountain_protocol_logo?e=2147483647&v=beta&t=7hKgZ0GxxUP6NbBbL0mdZ0-VWu2UAprr-FMo_8QGP2Y"
                  }
                  className="h-6 w-auto shrink-0 rounded-full"
                />
              </div>
              <ChevronIcon />
              <div>
                <img
                  alt={selectedProvider.value}
                  src={selectedProvider.img}
                  className="h-6 w-auto shrink-0 rounded-full"
                />
              </div>
            </div>

            {/* Stake Button */}
            <Button
              onClick={handleSubmit}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2"
              disabled={
                !stakeAmount ||
                !selectedProvider ||
                insufficientBalance ||
                isStakePending ||
                isApprovalPending
              }
            >
              {(isStakePending || isApprovalPending) && (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              )}
              Stake
            </Button>
            {insufficientBalance && (
              <Label className="text-red-500 text-sm font-medium">
                Insufficient balance to complete this purchase.
              </Label>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
