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
            font-family: 'Courier New', Courier, monospace !important;
            letter-spacing: 1px;
            position: relative;
            overflow: hidden; /* Empêche le scanner de déborder */
            
            /* Séquence d'allumage du terminal */
            animation: unsc-hud-boot 0.3s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        }

        /* --- LE BALAYAGE SCANNER (Faisceau lumineux qui traverse l'alerte) --- */
        :host::after {
            content: '';
            position: absolute;
            top: 0; left: 0; bottom: 0;
            width: 30%;
            background: linear-gradient(
                to right, 
                transparent, 
                rgba(255, 255, 255, 0.15), 
                transparent
            );
            transform: translateX(-150%);
            animation: unsc-scan-sweep 3s infinite linear;
            pointer-events: none;
            z-index: 0;
        }

        .unsc-snack-label {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 0.9rem;
            z-index: 1; /* Reste au-dessus du scanner */
        }

        .snack-icon {
            transform: scale(1.15);
            flex-shrink: 0;
            /* L'icône pulse pour attirer l'œil */
            animation: unsc-icon-pulse 1s infinite alternate;
        }

        .snack-text {
            line-height: 1.4;
            /* Léger grésillement holographique à l'apparition */
            animation: unsc-text-flicker 0.4s ease-in-out forwards;
        }

        .unsc-snack-actions {
            margin-right: -8px;
            z-index: 1;
        }

        .snack-close-btn {
            color: inherit !important;
            opacity: 0.7;
            transition: opacity 0.2s ease, transform 0.2s ease;

            &:hover {
                opacity: 1;
                transform: scale(1.1);
                background-color: rgba(255, 255, 255, 0.15) !important;
            }
        }

        /* =========================================================
           PROTOCOLES D'ANIMATION HOLOGRAPHIQUE
           ========================================================= */

        /* Flash lumineux lors de l'apparition de l'alerte */
        @keyframes unsc-hud-boot {
            0% { filter: brightness(3) contrast(1.5); transform: scaleX(0.95); opacity: 0; }
            100% { filter: brightness(1) contrast(1); transform: scaleX(1); opacity: 1; }
        }

        /* Balayage radar continu de gauche à droite */
        @keyframes unsc-scan-sweep {
            0%, 20% { transform: translateX(-150%); }
            80%, 100% { transform: translateX(400%); }
        }

        /* L'icône respire et projette une ombre lumineuse */
        @keyframes unsc-icon-pulse {
            0% { filter: drop-shadow(0 0 2px currentColor); opacity: 0.7; }
            100% { filter: drop-shadow(0 0 10px currentColor); opacity: 1; }
        }

        /* Grésillement façon transmission cryptée qui s'établit */
        @keyframes unsc-text-flicker {
            0% { opacity: 0; }
            20% { opacity: 1; }
            40% { opacity: 0.3; }
            60% { opacity: 1; }
            80% { opacity: 0.6; }
            100% { opacity: 1; }
        }
    `,
    imports: [MatButtonModule, MatIconModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction]
})
export class PizzaPartyAnnotatedComponent 
{
  snackBarRef = inject(MatSnackBarRef);
  info = inject(MAT_SNACK_BAR_DATA);
}