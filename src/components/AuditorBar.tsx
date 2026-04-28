import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRound, Pencil, Check } from "lucide-react";

interface Props {
  auditor: string;
  onChange: (name: string) => void;
}

export const AuditorBar = ({ auditor, onChange }: Props) => {
  const [editing, setEditing] = useState(!auditor);
  const [value, setValue] = useState(auditor);

  const save = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
      <UserRound className="h-5 w-5 text-muted-foreground shrink-0" />
      {editing ? (
        <>
          <Input
            autoFocus
            placeholder="Seu nome"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="h-9"
          />
          <Button size="sm" onClick={save} disabled={!value.trim()}>
            <Check className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Auditor</p>
            <p className="font-medium truncate">{auditor}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};
