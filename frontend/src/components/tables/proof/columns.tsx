import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./ColumnHeader";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  formatNullableAddress,
  formatNullableData,
  formatNullableTimestamp,
} from "@/lib/utils";
import { OffRamps } from "@/types";

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

export const columns = (
  handleRowActionClick: (row: OffRamps) => void
): ColumnDef<OffRamps>[] => [
  {
    id: "number",
    header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
    cell: ({ row }) => <div className="w-12 py-2">{row.index + 1}</div>,
    enableSorting: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Receipt ID" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center truncate w-fit justify-between">
        <span className="mr-2">{formatNullableAddress(row.original.id)}</span>
        {row.original.transactionHash && (
          <button
            onClick={() => copyToClipboard(row.original.id)}
            aria-label="Copy to clipboard"
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <Copy size={16} />
          </button>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-between">
        <span>{formatNullableData(row.original.status)}</span>
        {row.original.status === "PENDING" && (
          <button
            onClick={() => handleRowActionClick(row.original)}
            className="ml-2 text-blue-500 hover:text-blue-700"
          >
            Take Action
          </button>
        )}
      </div>
    ),
  },
  {
    accessorKey: "transactionHash",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Hash" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center truncate w-fit justify-between">
        <span className="mr-2">
          {formatNullableAddress(row.original.transactionHash)}
        </span>
        {row.original.transactionHash && (
          <button
            onClick={() => copyToClipboard(row.original.transactionHash)}
            aria-label="Copy to clipboard"
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <Copy size={16} />
          </button>
        )}
      </div>
    ),
  },
  {
    accessorKey: "channelId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Channel ID" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center truncate w-fit justify-between">
        <span className="mr-2">
          {formatNullableAddress(row.original.channelId).toUpperCase()}
        </span>
        {row.original.channelId && (
          <button
            onClick={() => copyToClipboard(row.original.channelId)}
            aria-label="Copy to clipboard"
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <Copy size={16} />
          </button>
        )}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <div>{formatNullableTimestamp(row.original.blockTimestamp)}</div>
    ),
  },
  {
    accessorKey: "respondedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Responded At" />
    ),
    cell: ({ row }) => (
      <div>{formatNullableTimestamp(row.original.fillBlockTimestamp)}</div>
    ),
  },
];
