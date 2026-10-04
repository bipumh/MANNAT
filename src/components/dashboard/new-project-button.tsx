"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "@/components/projects/project-dialog";
import type { Client } from "@/types";

export function NewProjectButton({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden className="h-4 w-4" />
        New project
      </Button>
      {open ? (
        <ProjectDialog
          project={null}
          clients={clients}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
