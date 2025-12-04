export const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL;

export const IMAGES = {
  LOGO_MAIN: `${S3_BASE_URL}/starlab_images/transparent-slc-rgb.png`,
} as const;
