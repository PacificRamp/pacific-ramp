import { columns } from "@/components/tables/proof/columns";
import { DataTable } from "@/components/tables/proof/DataTable";
import { useEffect, useState } from "react";
import { request } from "graphql-request";
import { useQuery } from "@tanstack/react-query";
import { OffRamps } from "@/types";
import { queryOperator } from "@/graphql/query";
import { SUBGRAPH_URL } from "@/constants/config";
import { toast } from "sonner";
import { useFillOfframp } from "@/hooks/useFillOffRamp";

type QueryData = {
  offRamps: OffRamps[];
};

export default function TableProof() {
  const [selectedRow, setSelectedRow] = useState<OffRamps | null>(null);
  const [channelId, setChannelId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasMounted, setHasMounted] = useState(false);

  const { handleSwap, isSwapConfirmed, isSwapPending } = useFillOfframp();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const url = SUBGRAPH_URL;

  const { data, isLoading, refetch } = useQuery<QueryData>({
    queryKey: ["data"],
    queryFn: async () => {
      return await request(url, queryOperator);
    },
    refetchInterval: 10000,
  });

  const handleRefresh = () => {
    refetch();
  };

  if (!hasMounted) {
    return null;
  }

  const handleRowActionClick = (row: OffRamps) => {
    if (row.status === "PENDING") {
      setSelectedRow(row); // Store the selected row when the action button is clicked
    }
  };

  const handleSubmit = async () => {
    if (channelId && transactionId && selectedRow) {
      setIsSubmitting(true);
      try {
        // Initiating the swap transaction
        await handleSwap(selectedRow.id, channelId, transactionId);

        // Handle success or confirmation
        if (isSwapConfirmed) {
          toast.success("Offramp filled successfully!");
        } else if (isSwapPending) {
          toast.info("Transaction is pending...");
        }

        setIsSubmitting(false);
        setChannelId("");
        setTransactionId("");
        setSelectedRow(null); // Optionally close the form after submitting
      } catch (error) {
        console.error("Error during swap:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Transaction failed. Please try again."
        );
        setIsSubmitting(false);
      }
    } else {
      toast.error("Please provide both Channel ID and Transaction ID.");
    }
  };
  return (
    <div className="w-full space-y-4 p-5 h-auto z-10">
      <DataTable
        data={data?.offRamps || []}
        columns={columns(handleRowActionClick)}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Form to submit action if a row is selected with PENDING status */}
      {selectedRow && selectedRow.status === "PENDING" && (
        <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-black mb-4">
            Submit Action for Pending Transaction
          </h3>
          <div className="flex flex-col gap-4">
            {/* Readonly Request ID */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Request ID
              </label>
              <input
                type="text"
                value={selectedRow.id}
                readOnly
                className="p-3 border rounded-md bg-gray-100 text-black cursor-not-allowed"
              />
            </div>

            {/* Channel ID */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Channel ID
              </label>
              <input
                type="text"
                placeholder="Channel ID"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="p-3 border rounded-md text-black"
              />
            </div>

            {/* Transaction ID */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Transaction ID
              </label>
              <input
                type="text"
                placeholder="Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="p-3 border rounded-md text-black"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`p-3 rounded-md text-white ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } transition`}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
