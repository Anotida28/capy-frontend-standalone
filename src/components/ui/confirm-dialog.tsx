"use client";

import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmTone = "default",
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmTone?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <ModalBody>
        {description ? <p>{description}</p> : null}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        {confirmTone === "destructive" ? (
          <button className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        ) : (
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
