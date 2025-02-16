import { ADDRESS_PACIFICRAMP } from "@/constants/config";
import { mockJackUSDABI } from "@/lib/abi/mockJackUSDABI";
import { toast } from "sonner";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

export const useOnramp = () => {
  const {
    data: swapHash,
    isPending: isSwapPending,
    writeContractAsync: writeSwap,
  } = useWriteContract();

  const { isLoading: isSwapConfirming, isSuccess: isSwapConfirmed } =
    useWaitForTransactionReceipt({
      hash: swapHash,
    });

  const handleOnramp = async (amount: string) => {
    try {
      console.log("amount", amount);
      await writeSwap({
        abi: mockJackUSDABI,
        address: ADDRESS_PACIFICRAMP,
        functionName: "requestOnRamp",
        args: [BigInt(amount.replace(/\D/g, "").padStart(18, "0"))],
      });

      while (!isSwapConfirmed) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast.success("Offramp successfully!");
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Transaction failed. Please try again."
      );
    }
  };

  return {
    swapHash,
    isSwapPending,
    isSwapConfirming,
    isSwapConfirmed,
    handleOnramp,
  };
};
