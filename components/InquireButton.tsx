// components/InquireButton.tsx
"use client";

import { useState } from "react";
import CTAButton from "@/components/CTAButton";
import InquirySheet from "./InquirySheet";

/**
 * Wrapper for the new enquiries flow.
 * Opens <InquirySheet> with name/phone/note and submits to /api/inbox/enquiries.
 * (ownerId from the old DM flow is no longer needed)
 */
export default function InquireButton({
  jobId,
}: {
  jobId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CTAButton
        onClick={() => setOpen(true)}
        className="bg-emerald-500 hover:bg-emerald-600 text-white"
      >
        Inquire
      </CTAButton>

      <InquirySheet jobId={jobId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
