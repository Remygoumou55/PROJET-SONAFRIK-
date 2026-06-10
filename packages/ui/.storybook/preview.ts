import type { Preview } from "@storybook/react";
import "../src/styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: "sonafrik-dark",
      values: [{ name: "sonafrik-dark", value: "#0D0D0D" }],
    },
    a11y: {
      config: { rules: [{ id: "color-contrast", enabled: true }] },
    },
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default preview;
