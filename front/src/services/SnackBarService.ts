import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from "@angular/material/snack-bar";
import { MatIconModule } from "@angular/material/icon";

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
        <div matSnackBarLabel class="unsc-snack-label">
            <mat-icon class="snack-icon">{{ info.icon }}</mat-icon> 
            <span class="snack-text">{{ info.message }}</span>
        </div>
        
        <div matSnackBarActions class="unsc-snack-actions">
            <button matIconButton matSnackBarAction (click)="snackBarRef.dismissWithAction()" class="snack-close-btn">
                <mat-icon>close</mat-icon>
            </button>
        </div>
    `,
    styles: `
        :host {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            
            /* Typographie militaire réglementaire */
            font-family: 'Courier New', Courier, monospace !important;
            letter-spacing: 1px;
        }

        .unsc-snack-label {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 0.9rem;
        }

        .snack-icon {
            transform: scale(1.15);
            flex-shrink: 0;
        }

        .snack-text {
            line-height: 1.4;
        }

        .unsc-snack-actions {
            margin-right: -8px; /* Recale le bouton proprement sur le bord */
        }

        .snack-close-btn {
            color: inherit !important; /* Capte automatiquement la couleur on-primary ou on-error du parent */
            opacity: 0.7;
            transition: opacity 0.2s ease, transform 0.2s ease;

            &:hover {
                opacity: 1;
                transform: scale(1.1);
                background-color: rgba(255, 255, 255, 0.15) !important;
            }
        }
    `,
    imports: [MatButtonModule, MatIconModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
})
export class PizzaPartyAnnotatedComponent 
{
  snackBarRef = inject(MatSnackBarRef);
  info = inject(MAT_SNACK_BAR_DATA);
}