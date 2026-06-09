"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SectionLabel } from "@/components/layout/section-label";
import { RoleSelect } from "@/features/settings/components/role-select";
import type { Role } from "@/types/enums";

/** Opens a modal to invite a new teammate. Self-contained; inline success on send. */
export function InviteUserModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("hr");
  const [sent, setSent] = useState(false);

  function close() {
    setOpen(false);
    // Reset after the modal closes so the next open is clean.
    setTimeout(() => {
      setEmail("");
      setRole("hr");
      setSent(false);
    }, 200);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    // No backend — acknowledge inline.
    setSent(true);
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Invite someone
      </Button>

      <Modal open={open} onClose={close}>
        <div className="p-7">
          {sent ? (
            <div className="anim-in">
              <div className="smallcaps mb-3 text-[11px] text-accent">Invitation sent</div>
              <h2 className="mb-2 font-serif text-[26px] font-normal leading-tight text-ink">
                We&rsquo;ve reached out to {email || "your teammate"}.
              </h2>
              <p className="mb-7 max-w-md text-[14px] text-ink-soft">
                They&rsquo;ll land in the roster once they accept. You can adjust their role any
                time.
              </p>
              <div className="flex justify-end">
                <Button type="button" variant="primary" onClick={close}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={send}>
              <div className="smallcaps mb-3 text-[11px] text-accent">Invite</div>
              <h2 className="mb-2 font-serif text-[26px] font-normal leading-tight text-ink">
                Bring someone onto the team.
              </h2>
              <p className="mb-7 max-w-md text-[14px] text-ink-soft">
                Send a workspace invitation. They&rsquo;ll get access scoped to the role you pick.
              </p>

              <SectionLabel className="mb-2">Email</SectionLabel>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@tmsystems.in"
                className="mb-6"
              />

              <SectionLabel className="mb-2">Role</SectionLabel>
              <div className="mb-8">
                <RoleSelect value={role} onChange={setRole} />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Send invite
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
