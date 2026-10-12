import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { attachmentsQuery } from "@/lib/queries";
import { attachmentUrl } from "@/lib/cascades.functions";

export function AttachmentList({ cascadeId, orgId }: { cascadeId: string; orgId: string }) {
  const { data = [] } = useQuery(attachmentsQuery(cascadeId));
  const getUrl = useServerFn(attachmentUrl);
  if (data.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((f) => (
        <button
          key={f.id}
          className="inline-flex items-center gap-2 rounded-md border bg-secondary px-3 py-1.5 text-sm hover:border-highlight"
          onClick={async () => {
            try {
              const { url } = await getUrl({ data: { org_id: orgId, path: f.file_path } });
              window.open(url, "_blank", "noopener");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't open file");
            }
          }}
        >
          <Paperclip className="h-4 w-4" /> {f.file_name}
        </button>
      ))}
    </div>
  );
}
