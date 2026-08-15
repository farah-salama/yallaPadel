import QRCode from "qrcode";

export async function bookingQrDataUrl(token: string) {
  return QRCode.toDataURL(token, {
    margin: 1,
    width: 280,
    color: { dark: "#080B09", light: "#C8FF00" },
  });
}
