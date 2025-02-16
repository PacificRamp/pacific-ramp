import { DataTable } from "@/components/tables/swap/DataTable";
import { useEffect, useState } from "react";
import { request } from "graphql-request";
import { useQuery } from "@tanstack/react-query";
import { OnRamp } from "@/types";
import { queryOnramp } from "@/graphql/query";
import { SUBGRAPH_URL } from "@/constants/config";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tables/swap/ColumnHeader";
import { formatAddress } from "@/lib/utils";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { useFillOnRamp } from "@/hooks/useFillOnRamp";

type QueryData = {
  onRamps: OnRamp[];
};

const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success("Copied to clipboard!");
    })
    .catch((err) => {
      toast.error(`Failed to copy to clipboard! ${err}`);
    });
};

export default function TableOnramp() {
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedOnRamp, setSelectedOnRamp] = useState<OnRamp | null>(null);

  // channelId
  const [channelId, setChannelId] = useState<string>("");
  const [receiptId, setReceiptId] = useState<string>("");

  const {
    handleAcceptOnRamp,
    handleSubmitReceiptId,
    isSwapPending,
    isSwapConfirming,
    isSwapConfirmed,
  } = useFillOnRamp();

  const handleSelectOnRamp = (onRamp: OnRamp) => {
    setSelectedOnRamp(onRamp);
  };

  const handleAccept = async () => {
    if (selectedOnRamp && channelId) {
      try {
        await handleAcceptOnRamp(selectedOnRamp.id, channelId).then(() => {
          setSelectedOnRamp(null);
          setChannelId("");
        });

        // Handle success or confirmation
        if (isSwapConfirmed) {
          toast.success("Onramp filled successfully!");
          handleRefresh();
        } else if (isSwapPending) {
          toast.info("Transaction is pending...");
        }
      } catch (error) {
        console.error("Error during swap:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Transaction failed. Please try again."
        );
      }
    } else {
      toast.error("Please provide both Channel ID and Transaction ID.");
    }
  };

  const handleSubmit = async () => {
    if (selectedOnRamp && receiptId) {
      try {
        await handleSubmitReceiptId(selectedOnRamp.id, receiptId).then(() => {
          setSelectedOnRamp(null);
          setReceiptId("");
        });

        // Handle success or confirmation
        if (isSwapConfirmed) {
          toast.success("Onramp filled successfully!");
          handleRefresh();
        } else if (isSwapPending) {
          toast.info("Transaction is pending...");
        }
      } catch (error) {
        console.error("Error during swap:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Transaction failed. Please try again."
        );
      }
    } else {
      toast.error("Please provide both Receipt ID and Transaction ID.");
    }
  };

  function columns(): ColumnDef<OnRamp>[] {
    return [
      {
        id: "number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="#" />
        ),
        cell: ({ row }) => <div className="w-12 py-2">{row.index + 1}</div>,
        enableSorting: false,
      },
      {
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="ID" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center truncate w-fit justify-between">
            <span className="mr-2">{formatAddress(row.original.id)}</span>
            <button
              onClick={() => copyToClipboard(row.original.id)}
              aria-label="Copy to clipboard"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Copy size={16} />
            </button>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Requested Amount" />
        ),
        cell: ({ row }) => <div>{row.original.amount}</div>,
      },
      {
        accessorKey: "buyer",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Buyer" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center truncate w-fit justify-between">
            <span className="mr-2">
              {formatAddress(row.original.buyer ?? "")}
            </span>
            <button
              onClick={() => copyToClipboard(row.original.buyer ?? "")}
              aria-label="Copy to clipboard"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Copy size={16} />
            </button>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <div>
            {row.original.seller === null
              ? "PENDING"
              : row.original.receiptId
              ? "COMPLETE"
              : "IN_PROGRESS"}
          </div>
        ),
      },
      {
        accessorKey: "seller",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="User" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center truncate w-fit justify-between">
            <span className="mr-2">
              {formatAddress(row.original.seller ?? "")}
            </span>
            <button
              onClick={() => copyToClipboard(row.original.seller ?? "")}
              aria-label="Copy to clipboard"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Copy size={16} />
            </button>
          </div>
        ),
      },
      {
        accessorKey: "actions",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Aksi" />
        ),
        cell: ({ row }) => {
          if (row.original.seller !== null && row.original.receiptId !== null) {
            return <div>-</div>;
          }
          return (
            <div className="flex items-center truncate w-fit justify-between">
              <button
                onClick={() => handleSelectOnRamp(row.original)}
                aria-label="Copy to clipboard"
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                Take Action
              </button>
            </div>
          );
        },
      },
    ];
  }

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const url = SUBGRAPH_URL;

  const { data, isLoading, refetch } = useQuery<QueryData>({
    queryKey: ["data"],
    queryFn: async () => {
      return await request(url, queryOnramp);
    },
    refetchInterval: 10000,
  });

  const handleRefresh = () => {
    refetch();
  };

  const filteredOnramp = data?.onRamps || [];

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="w-full space-y-4 p-5 h-auto z-10">
      <DataTable
        data={filteredOnramp}
        columns={columns()}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {selectedOnRamp && selectedOnRamp.seller === null && (
        <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-black mb-4">
            Submit Action for Pending Transaction
          </h3>
          <div className="flex flex-col gap-4">
            {/* Readonly Request ID */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Request ID
              </label>
              <input
                type="text"
                value={selectedOnRamp.id}
                readOnly
                className="p-3 border rounded-md bg-gray-100 text-black cursor-not-allowed"
              />
            </div>

            {/* Channel ID */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
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

            {/* Submit Button */}
            <button
              onClick={handleAccept}
              disabled={isSwapPending || isSwapConfirming}
              className={`p-3 rounded-md text-white ${
                // isSubmitting
                isSwapPending || isSwapConfirming
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } transition`}
            >
              {isSwapPending || isSwapConfirming ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {selectedOnRamp &&
        selectedOnRamp.receiptId === null &&
        selectedOnRamp.seller !== null && (
          <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-black mb-4">
              Submit Action for In Progress Transaction
            </h3>
            <div className="flex flex-col gap-4">
              {/* Readonly Request ID */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Request ID
                </label>
                <input
                  type="text"
                  value={selectedOnRamp.id}
                  readOnly
                  className="p-3 border rounded-md bg-gray-100 text-black cursor-not-allowed"
                />
              </div>

              {/* Receipt ID */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">
                  Receipt ID
                </label>
                <input
                  type="text"
                  placeholder="Receipt ID"
                  value={receiptId}
                  onChange={(e) => setReceiptId(e.target.value)}
                  className="p-3 border rounded-md text-black"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSwapPending || isSwapConfirming}
                className={`p-3 rounded-md text-white ${
                  // isSubmitting
                  isSwapPending || isSwapConfirming
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                } transition`}
              >
                {isSwapPending || isSwapConfirming ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
