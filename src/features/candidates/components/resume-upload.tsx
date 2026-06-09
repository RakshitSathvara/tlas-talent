"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import type { ResumeFile } from "../types";
import { createResumeUploadUrl, confirmResumeUpload } from "../actions";

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // mirrors the schema cap (10MB)

// The content types the resumes bucket accepts (PDF / DOC / DOCX).
const ACCEPTED: Record<string, true> = {
  "application/pdf": true,
  "application/msword": true,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
};
const ACCEPT_ATTR = ".pdf,.doc,.docx";

/** Human-readable byte size for the existing-file caption. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * HR/admin résumé upload control rendered above the faux preview on the candidate detail page.
 * Drives the two-call presigned flow: createResumeUploadUrl → PUT the bytes straight to Storage
 * → confirmResumeUpload. When a résumé already exists, links to it via the access-checked
 * `/api/files/[id]` route (which redirects to a short-lived signed URL). Read-only roles see
 * only the existing-file link, if any.
 */
export function ResumeUpload({
  candidateId,
  resume,
}: {
  candidateId: string;
  resume: ResumeFile | null;
}) {
  const router = useRouter();
  const { can } = useRole();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canUpload = can("uploadResume");

  function pickFile() {
    setError(null);
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so picking the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (!ACCEPTED[file.type]) {
      setError("Résumés must be a PDF, DOC, or DOCX file.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setError("File is too large — the limit is 10MB.");
      return;
    }

    const contentType = file.type as
      | "application/pdf"
      | "application/msword"
      | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    startTransition(async () => {
      // Step 1: presigned upload URL.
      const presigned = await createResumeUploadUrl({
        candidateId,
        fileName: file.name,
        contentType,
        sizeBytes: file.size,
      });
      if (!presigned.ok) {
        setError(presigned.error);
        return;
      }

      // Step 2: PUT the bytes straight to Storage (the server never proxies them).
      const put = await fetch(presigned.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!put.ok) {
        setError("Upload to storage failed. Please retry.");
        return;
      }

      // Step 3: persist the files row.
      const confirmed = await confirmResumeUpload({
        candidateId,
        storagePath: presigned.data.storagePath,
        contentType,
        sizeBytes: file.size,
      });
      if (!confirmed.ok) {
        setError(confirmed.error);
        return;
      }

      router.refresh();
    });
  }

  // Nothing to show for read-only roles without an existing résumé.
  if (!canUpload && !resume) return null;

  return (
    <Card className="mb-4">
      {resume ? (
        <div className="flex items-start justify-between gap-4">
          <a
            href={`/api/files/${resume.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 text-ink hover:text-accent"
          >
            <FileText size={18} className="mt-0.5 shrink-0 text-ink-soft" />
            <span>
              <span className="block text-[13.5px] font-medium">{resume.fileName}</span>
              <span className="mt-0.5 block font-mono text-[11px] text-ink-softer">
                {formatBytes(resume.sizeBytes)} · uploaded {resume.uploadedOn}
              </span>
            </span>
          </a>
          {canUpload && (
            <Button variant="secondary" onClick={pickFile} disabled={pending}>
              {pending ? "Uploading…" : "Replace"}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-ink-soft">
            <Upload size={18} className="shrink-0" />
            <span className="text-[13px]">No résumé on file yet.</span>
          </div>
          <Button variant="secondary" onClick={pickFile} disabled={pending}>
            {pending ? "Uploading…" : "Upload résumé"}
          </Button>
        </div>
      )}

      {canUpload && (
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={handleFile}
        />
      )}

      {error && (
        <p className="mt-3 text-[12.5px] text-accent" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
