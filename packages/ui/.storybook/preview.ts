import type { Preview } from "@storybook/react";
import "../src/styles/globals.css";
import { colors } from "../src/tokens";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: "sonafrik-dark",
      values: [{ name: "sonafrik-dark", value: colors.noirProfond }],
    },
    a11y: {
      config: { rules: [{ id: "color-contrast", enabled: true }] },
    },
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default preview;
