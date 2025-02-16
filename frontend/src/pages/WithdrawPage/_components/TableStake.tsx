"use client";

import { useEffect, useState } from "react";
import { request } from "graphql-request";
import { useQuery } from "@tanstack/react-query";
import { Stake } from "@/types";
import { useAccount } from "wagmi";
import { queryStake } from "@/graphql/query";
import { SUBGRAPH_URL } from "@/constants/config";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tables/swap/ColumnHeader";
import { copyToClipboard, formatAddress } from "@/lib/utils";
import { Copy } from "lucide-react";
import { DataTable } from "@/components/tables/withdraw/DataTable";

type QueryData = {
  stakes: Stake[];
};

export function columns(): ColumnDef<Stake>[] {
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
      accessorKey: "provider",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Provider" />
      ),
      cell: ({ row }) => row.original.provider || "-",
    },
    {
      accessorKey: "transactionHash",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transaction Hash" />
      ),
      cell: ({ row }) => {
        const hash = row.original.transactionHash;
        if (!hash) return "-";
        return (
          <div className="flex items-center gap-2">
            <span>{formatAddress(hash)}</span>
            <button
              onClick={() => copyToClipboard(hash)}
              aria-label="Copy to clipboard"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => row.original.amount || "-",
    },
    {
      accessorKey: "user",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return "-";
        return (
          <div className="flex items-center gap-2">
            <span>{formatAddress(user)}</span>
            <button
              onClick={() => copyToClipboard(user)}
              aria-label="Copy to clipboard"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];
}

export default function TableStake() {
  const [hasMounted, setHasMounted] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const url = SUBGRAPH_URL;

  const { data, isLoading, refetch } = useQuery<QueryData>({
    queryKey: ["data"],
    queryFn: async () => {
      return await request(url, queryStake);
    },
    refetchInterval: 10000,
  });

  const handleRefresh = () => {
    refetch();
  };

  const filteredMints =
    data?.stakes && address
      ? data?.stakes.filter(
          (mint: Stake) =>
            mint.user.toLocaleLowerCase() === address.toLocaleLowerCase()
        )
      : [];

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="w-full space-y-4 p-5 h-auto z-10">
      <DataTable
        data={filteredMints}
        columns={columns()}
        handleRefresh={handleRefresh}
        isLoading={isLoading}
      />
    </div>
  );
}
