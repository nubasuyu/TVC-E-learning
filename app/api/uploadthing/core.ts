import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  // This defines our "imageUploader" endpoint
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      // This runs when the upload is done. We log the URL to the console.
      console.log("Upload complete:", file.url);
      return { uploadedBy: "teacher" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;