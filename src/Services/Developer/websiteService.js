import api from "../../Config/axios";

// ─── Website CRUD ─────────────────────────────────────────────────────────────

/**
 * Creates a website with text data, an icon file, and multiple screenshots.
 * @param {Object} data - The text fields (name, url, category, description, tags, ownerName)
 * @param {File} iconFile - The single icon image file
 * @param {File[]} screenshotFiles - Array of screenshot image files
 */
export const createWebsite = (data, iconFile, screenshotFiles = []) => {
  const form = new FormData();

  // 1. Append standard text fields safely
  form.append("name", data.name);
  form.append("url", data.url);
  form.append("category", data.category || "");
  form.append("description", data.description || "");
  form.append("ownerName", data.ownerName || "");

  // 2. Append the tags array elements individually for Multer layout parsing
  if (Array.isArray(data.tags)) {
    data.tags.forEach((tag) => form.append("tags[]", tag));
  }

  // 3. Append the single icon binary file (matches req.file on backend)
  if (iconFile) {
    form.append("icon", iconFile);
    
  }
  

  // 4. Append multiple screenshots binary files (matches req.files on backend)
  if (screenshotFiles && screenshotFiles.length > 0) {
    screenshotFiles.forEach((file) => {
      form.append("screenshots", file);
    });
  }

  // Axios automatically computes the correct 'multipart/form-data' boundary headers
  return api.post("/dev/websites", form);
};

export const getMyWebsites = (params) =>
  api.get("/dev/websites/my", { params });

export const getWebsiteById = (id) => api.get(`/dev/websites/${id}`);

export const updateWebsite = (id, data) =>
  api.patch(`/dev/websites/${id}`, data);

export const deleteWebsite = (id) => api.delete(`/dev/websites/${id}`);

// ─── Icon ─────────────────────────────────────────────────────────────────────

export const updateIcon = (id, file) => {
  const form = new FormData();
  form.append("icon", file);
  return api.patch(`/dev/websites/${id}/icon/update`, form);
};

// ─── Screenshots ──────────────────────────────────────────────────────────────

export const updateScreenshot = (id, screenshotId, file) => {
  const form = new FormData();
  form.append("screenshot", file);
  return api.patch(`/dev/websites/${id}/screenshots/${screenshotId}`, form);
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getWebsiteStats = (id) => api.get(`/dev/websites/stats/${id}`);
