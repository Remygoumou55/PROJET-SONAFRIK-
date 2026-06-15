"use client";

import { useState } from "react";
import type { Work } from "@sonafrik/types";
import { WorksList } from "./WorksList";
import { CreateWorkForm } from "./CreateWorkForm";

interface Props {
  works: Work[];
  creatorId: string;
}

export function WorksPageClient({ works, creatorId }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {showForm ? (
        <CreateWorkForm
          creatorId={creatorId}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <WorksList works={works} onCreateClick={() => setShowForm(true)} />
      )}
    </div>
  );
}
