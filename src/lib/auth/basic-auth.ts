export function encodeBasicAuth(username: string, password: string) {
  const token = `${username}:${password}`;
  if (typeof window === "undefined") {
    return Buffer.from(token).toString("base64");
  }
  return window.btoa(token);
}
