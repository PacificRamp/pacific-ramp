import { useWaitForTransactionReceipt } from "wagmi";
import { useWriteContract } from "wagmi";
import { toast } from "sonner";
import { mockJackUSDABI } from "@/lib/abi/mockJackUSDABI";
import { ADDRESS_PACIFICRAMP } from "@/constants/config";

export const useFillOnRamp = () => {
  const {
    data: swapHash,
    isPending: isSwapPending,
    writeContractAsync: writeSwap,
    error: swapError,
  } = useWriteContract();

  const { isLoading: isSwapConfirming, isSuccess: isSwapConfirmed } =
    useWaitForTransactionReceipt({
      hash: swapHash,
    });

  const handleAcceptOnRamp = async (
    requestId: string,
    channelId: string,
  ) => {
    try {
      await writeSwap({
        abi: mockJackUSDABI,
        address: ADDRESS_PACIFICRAMP,
        functionName: "acceptOnRamp",
        args: [requestId, channelId],
      });

      toast.success("Accept On Ramp Successfully!");
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Transaction failed. Please try again."
      );
    }

    // If there is an error from the transaction interaction, show that error
    if (swapError) {
      toast.error(
        swapError instanceof Error ? swapError.message : "Transaction failed"
      );
    }
  };

  const handleSubmitReceiptId = async (
    requestOnrampId: string,
    receiptId: string,
  ) => {
    try {
      await writeSwap({
        abi: mockJackUSDABI,
        address: ADDRESS_PACIFICRAMP,
        functionName: "submitReceiptId",
        args: [requestOnrampId, receiptId],
      });

      toast.success("Submit Recepint ID Successfully!");
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Transaction failed. Please try again."
      );
    }

    // If there is an error from the transaction interaction, show that error
    if (swapError) {
      toast.error(
        swapError instanceof Error ? swapError.message : "Transaction failed"
      );
    }
  };

  return {
    swapHash,
    isSwapPending,
    isSwapConfirming,
    isSwapConfirmed,
    handleAcceptOnRamp,
    handleSubmitReceiptId
  };
};
