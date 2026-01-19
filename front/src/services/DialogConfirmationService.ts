import { DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatDialog } from "@angular/material/dialog";
import { ModalConfirmation } from "@modals/modal-confirmation/modal-confirmation";
import { Subject } from "rxjs";

export class DialogConfirmationService
{
    private dialog = inject(MatDialog);
    private destroyRef = inject(DestroyRef);

    Ouvrir(_titre: string, _message: string): Subject<boolean>
    {
        let retourConfirmation = new Subject<boolean>();

        const DIALOG_REF = this.dialog.open(ModalConfirmation, {
            data: {
                titre: _titre,
                message: _message
            }
        });
        
        DIALOG_REF.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (retour: boolean) =>
            {
                retourConfirmation.next(retour === true);
                retourConfirmation.complete();
            }
        });

        return retourConfirmation;
    }
}