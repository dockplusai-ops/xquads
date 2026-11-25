import type { SkyPair } from "@agenteschat/ui/agent/engine";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "./theme";

/** xquads' symbol, as the web's (`packages/ui` `LogoMark`): the person (a circle, on top) and three agents. */
const PERSON =
  "M128.00 10.45 C152.21 10.45 171.84 30.08 171.84 54.29 C171.84 78.50 152.21 98.13 128.00 98.13 C103.79 98.13 84.16 78.50 84.16 54.29 C84.16 30.08 103.79 10.45 128.00 10.45 Z";
const AGENTS =
  "M185.98 83.99 C193.01 76.96 204.41 76.96 211.44 83.99 L239.72 112.27 C246.75 119.30 246.75 130.70 239.72 137.73 L211.44 166.01 C204.41 173.04 193.01 173.04 185.98 166.01 L157.70 137.73 C150.67 130.70 150.67 119.30 157.70 112.27 Z M115.27 154.70 C122.30 147.67 133.70 147.67 140.73 154.70 L169.01 182.98 C176.04 190.01 176.04 201.41 169.01 208.44 L140.73 236.72 C133.70 243.75 122.30 243.75 115.27 236.72 L86.99 208.44 C79.96 201.41 79.96 190.01 86.99 182.98 Z M44.56 83.99 C51.59 76.96 62.99 76.96 70.02 83.99 L98.30 112.27 C105.33 119.30 105.33 130.70 98.30 137.73 L70.02 166.01 C62.99 173.04 51.59 173.04 44.56 166.01 L16.28 137.73 C9.25 130.70 9.25 119.30 16.28 112.27 Z";
/** The kit's cut for 16 to 24 px: smaller pieces, wider gaps. */
const PERSON_SMALL =
  "M128.00 10.91 C150.95 10.91 169.55 29.51 169.55 52.46 C169.55 75.41 150.95 94.01 128.00 94.01 C105.05 94.01 86.45 75.41 86.45 52.46 C86.45 29.51 105.05 10.91 128.00 10.91 Z";
const AGENTS_SMALL =
  "M190.23 87.82 C196.47 81.57 206.60 81.57 212.85 87.82 L239.72 114.69 C245.97 120.93 245.97 131.07 239.72 137.31 L212.85 164.18 C206.60 170.43 196.47 170.43 190.23 164.18 L163.36 137.31 C157.11 131.07 157.11 120.93 163.36 114.69 Z M116.69 161.36 C122.93 155.11 133.07 155.11 139.31 161.36 L166.18 188.23 C172.43 194.47 172.43 204.60 166.18 210.85 L139.31 237.72 C133.07 243.97 122.93 243.97 116.69 237.72 L89.82 210.85 C83.57 204.60 83.57 194.47 89.82 188.23 Z M43.15 87.82 C49.40 81.57 59.53 81.57 65.77 87.82 L92.64 114.69 C98.89 120.93 98.89 131.07 92.64 137.31 L65.77 164.18 C59.53 170.43 49.40 170.43 43.15 164.18 L16.28 137.31 C10.03 131.07 10.03 120.93 16.28 114.69 Z";
const SMALL_PX = 24;
/** The person is the logo's one camel part: dark camel on light grounds, camel on dark ones (the logo guide). */
const CAMEL = { light: "#A87545", dark: "#C79D70" } as const;

/**
 * The xquads symbol in the theme's ink, the person in camel. A workspace without a logo of its own wears it, `sky`
 * (its `workspaceSky`) on the person.
 */
export function LogoMark({ size, sky }: { size: number; sky?: SkyPair }) {
  const { colors, scheme } = useTheme();
  const small = size <= SMALL_PX;
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" accessibilityElementsHidden importantForAccessibility="no">
      <Path d={small ? PERSON_SMALL : PERSON} fill={sky ? sky[1] : CAMEL[scheme]} />
      <Path d={small ? AGENTS_SMALL : AGENTS} fill={colors.ink} />
    </Svg>
  );
}
