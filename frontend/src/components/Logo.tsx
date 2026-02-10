import { Image } from "@heroui/react";
import { IMAGES } from "../config/assets";

export default function Logo() {
  return (
    <Image src={IMAGES.LOGO_MAIN} alt="RMS Logo" width={200} height={50} />
  );
}
