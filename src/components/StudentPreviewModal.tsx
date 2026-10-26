"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function StudentPreviewModal({
  student,
  open,
  onClose,
}: {
  student: any;
  open: boolean;
  onClose: () => void;
}) {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Student Preview</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border shadow-md bg-muted flex items-center justify-center">
            {student.profile_photo ? (
              <img
                src={student.profile_photo}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-primary/60 bg-primary/10">
                {student.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
            )}
          </div>

          <div className="text-center space-y-1 w-full">
            <h3 className="font-extrabold text-lg text-foreground">{student.name}</h3>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              <span className="font-bold text-foreground">Reg No:</span> {student.registration_number || "—"}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              <span className="font-bold text-foreground">Year / Class:</span> {student.year || student.class_name || "—"}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              <span className="font-bold text-foreground">Term:</span> {student.term || "—"}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              <span className="font-bold text-foreground">Status:</span>{" "}
              <span className="capitalize font-bold text-primary">{student.enrolment_status || "ongoing"}</span>
            </p>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              <span className="font-bold text-foreground">Academy Joined:</span>{" "}
              {student.academy_joined_date?.split("T")[0] || "—"}
            </p>
          </div>

          <div className="w-full space-y-1 text-left">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Remarks (teacher/admin only)
            </label>
            <Textarea
              placeholder="Remarks (teacher/admin only – not saved)"
              className="w-full bg-muted/30 border-2 font-medium resize-none text-sm"
              rows={3}
              disabled
            />
          </div>
        </div>

        <DialogClose asChild>
          <button className="w-full mt-4 h-11 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl transition-all active:scale-[0.99] shadow-sm cursor-pointer">
            Close
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
