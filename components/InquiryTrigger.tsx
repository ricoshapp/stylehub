"use client";

import { useState } from "react";
import InquirySheet from "./InquirySheet";

export default function InquiryTrigger({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black hover:bg-white/90"
      >
        Inquire
      </button>

      <InquirySheet
        jobId={jobId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
