// Frontend storage helper for uploading files to S3
// This is a simplified version that calls the backend API

export async function storagePut(
  key: string,
  data: Uint8Array,
  contentType: string
): Promise<{ url: string; key: string }> {
  // Convert Uint8Array to base64
  const base64 = btoa(String.fromCharCode(...data));
  
  // Call backend API to upload to S3
  const response = await fetch("/api/storage/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      data: base64,
      contentType,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
}
