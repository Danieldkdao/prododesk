export const createFileKey = (
  file: File,
  keyPrefix: string,
  userId: string,
) => {
  const safeFileName = file.name
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return `${userId}-${keyPrefix.replace(/\/+$/, "")}/${crypto.randomUUID()}-${safeFileName}`;
};

export const uploadFileWithProgress = (
  url: string,
  file: File,
  onProgress: (progress: number) => void,
) => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 204) {
        onProgress(100);
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status: ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed"));
    };

    xhr.open("PUT", url);

    if (file.type) {
      xhr.setRequestHeader("Content-Type", file.type);
    }

    xhr.send(file);
  });
};
