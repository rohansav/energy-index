/* Keep Decap's GitHub OAuth UI; replace content reads/writes with the owner-only API. */
window.registerEnergyDatabaseBackend = function (CMS, apiUrl) {
  const GitHubBackend = CMS.getBackend("github").BackendClass;
  const ratingFields = ["score", "sweetness", "tartness", "dryness", "energy"];
  class DatabaseBackend extends GitHubBackend {
    versions = new Map();
    async request(path, options = {}) {
      const response = await fetch(`${apiUrl}${path}`, {
        ...options,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || `Editor request failed (${response.status})`,
        );
      return data;
    }
    entry(review) {
      const data = { ...review };
      for (const key of ratingFields)
        data[key] = data[key] == null ? "" : Number(data[key]).toFixed(1);
      return {
        file: {
          path: `reviews/${review.id}.json`,
          id: review.id,
          name: `${review.id}.json`,
        },
        data: JSON.stringify(data),
      };
    }
    async entriesByFolder(folder) {
      if (folder !== "reviews") throw new Error("Unknown collection");
      return (await this.request("/editor/reviews")).map((review) =>
        this.entry(review),
      );
    }
    allEntriesByFolder(folder) {
      return this.entriesByFolder(folder);
    }
    async getEntry(path) {
      const id = path.match(/^reviews\/([a-z0-9-]+)\.json$/)?.[1];
      if (!id) throw new Error("Unknown review");
      const { review, version } = await this.request(`/editor/reviews/${id}`);
      this.versions.set(id, version);
      return this.entry(review);
    }
    async persistEntry(entry) {
      if (entry.dataFiles.length !== 1 || entry.assets.length)
        throw new Error("Only review edits are supported");
      const file = entry.dataFiles[0];
      const id = file.path.match(/^reviews\/([a-z0-9-]+)\.json$/)?.[1];
      const version = this.versions.get(id);
      if (!version) throw new Error("Reopen this review before saving");
      const result = await this.request(`/editor/reviews/${id}`, {
        method: "PUT",
        body: JSON.stringify({ version, review: JSON.parse(file.raw) }),
      });
      this.versions.set(id, result.version);
    }
    getMedia() {
      return Promise.resolve([]);
    }
    persistMedia() {
      throw new Error("Media uploads are not supported");
    }
    deleteFile() {
      throw new Error("Deleting catalogue entries is not supported");
    }
  }
  CMS.registerBackend("energy-database", DatabaseBackend);
};
