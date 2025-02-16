import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { manta } from "viem/chains";

export const config = getDefaultConfig({
  appName: "RainbowKit demo",
  projectId: "04251f8180896efb96c57a0984864657",
  chains: [manta],
});
