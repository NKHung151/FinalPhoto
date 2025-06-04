const API_BASE_URL = "http://localhost:8081/api";

async function fetchModel(url, options = {}) {
  try {
    console.log("Fetching from:", API_BASE_URL + url);
    const response = await fetch(`${API_BASE_URL}${url}`, {
      credentials: "include", // Thêm dòng này để gửi cookie session
      ...options,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("fetchModel error:", error);
    throw error;
  }
}

export default fetchModel;
