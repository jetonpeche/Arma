import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from "@angular/material/snack-bar";
import { MatIcon } from "@angular/material/icon";

export class SnackBarService
{
    private snackBar = inject(MatSnackBar);

    Ok(_message: string)
    {
        this.Ouvrir(_message, "primaire", "check_circle");
    }

    Erreur(_message: string): void
    {
        this.Ouvrir(_message, "erreur", "cancel");
    }

    private Ouvrir(_message: string, _theme: string, _icon: string): void
    {
        this.snackBar.openFromComponent(PizzaPartyAnnotatedComponent, {
            panelClass: [_theme],
            data: {
                message: _message,
                icon: _icon
            }
        });
    }
}

@Component({
    selector: 'app-snack-bar',
    template: `
        <span matSnackBarLabel>
            <mat-icon style="vertical-align: middle">{{ info.icon }}</mat-icon> 
            {{ info.message }}
        </span>
        <span matSnackBarActions>
            <button style="color: var(--mat-sys-on-primary)" matIconButton matSnackBarAction (click)="snackBarRef.dismissWithAction()">
                <mat-icon>close_small</mat-icon>
            </button>
        </span>
    `,
    styles: `
        :host {
            display: flex;
        }
    `,
  imports: [MatButtonModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction, MatIcon],
})
export class PizzaPartyAnnotatedComponent 
{
  snackBarRef = inject(MatSnackBarRef);
  info = inject(MAT_SNACK_BAR_DATA);
}