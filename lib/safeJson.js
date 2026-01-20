export async function safeJson(response, { allowHtml = false } = {}) {
  if (!response) return { success: false, error: "no response" };

  const status = response.status;
  const url = response.url || "<unknown url>";
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    // Read snippet for debugging
    let text;
    try {
      text = await response.text();
    } catch (e) {
      text = "<unable to read response body>";
    }
    // Log the status, url and the first part of the response to help debugging server-side errors
    console.error(`safeJson: expected JSON but received (status=${status}) from ${url}:`, text.slice(0, 2000));
    // If allowed to return raw text for special cases, do so
    if (allowHtml) return { success: false, html: text, status };
    return { success: false, status, error: "non-json-response", bodySnippet: text.slice(0, 2000) };
  }

  try {
    const data = await response.json();
    if (!response.ok) {
      // Log status, url and parsed body for better debugging
      console.error(`safeJson: response not ok (status=${status}) from ${url}:`, data);
      // Normalize to an object with success:false so callers don't crash when they access .success
      if (data && typeof data === "object") {
        if (data.success === undefined) data.success = false;
        data._status = status;
        data._url = url;
        return data;
      }
      return { success: false, status, body: data };
    }
    return data;
  } catch (err) {
    console.error(`safeJson: JSON parse error from ${url}:`, err);
    return { success: false, status, error: "json-parse-error" };
  }
}
