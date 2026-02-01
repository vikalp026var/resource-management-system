import { Avatar } from "@heroui/react";

const generateUserColor = (username: string) => {
  // Simple hash function to generate a number from string
  const hash = username.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Generate cool/neutral color palette
  // Limit hue to cool colors (180-270 degrees) or neutral grays
  const useNeutral = Math.abs(hash) % 4 === 0; // 25% chance of neutral

  let h, s, l;
  if (useNeutral) {
    h = 0;
    s = 0;
    l = 40 + (Math.abs(hash) % 30); // 40-70% lightness for grays
  } else {
    h = 180 + (Math.abs(hash) % 90); // 180-270 degrees (blues/purples)
    s = 30 + (Math.abs(hash) % 30); // 30-60% saturation
    l = 45 + (Math.abs(hash) % 20); // 45-65% lightness
  }

  // Convert HSL to RGB
  const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;

  let r, g, b;
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  const rgb = [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];

  // Calculate perceived brightness
  const brightness = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  const textColor = brightness > 0.6 ? "#000000" : "#FFFFFF";

  // Convert to hex
  const backgroundColor = `#${rgb
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;

  return { backgroundColor, textColor };
};

export function renderUser(user?: string): React.ReactNode {
  if (!user) return "N/A";
  const username = user.toString();
  const userColor = generateUserColor(username);
  return (
    <>
      <span className="flex flex-row items-center gap-2">
        <Avatar
          style={{
            backgroundColor: userColor.backgroundColor,
            color: userColor.textColor,
          }}
          showFallback
          size="sm"
          name={username.toString().charAt(0).toUpperCase()}
        />
        {username.charAt(0).toUpperCase() + username.slice(1)}
      </span>
    </>
  );
}
