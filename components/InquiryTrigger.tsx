// components/InquiryTrigger.tsx
"use client";

import { useState } from "react";
import CTAButton from "@/components/CTAButton";
import InquirySheet from "@/components/InquirySheet";

export default function InquiryTrigger({
  jobId,
  className,
}: {
  jobId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <CTAButton variant="primary" onClick={() => setOpen(true)}>
        Inquire
      </CTAButton>

      <InquirySheet jobId={jobId} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
