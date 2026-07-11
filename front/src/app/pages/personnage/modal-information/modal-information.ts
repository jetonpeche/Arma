import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Personnage } from '@models/Personnage';
import { BoutiquePage } from "../../boutique/boutique";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Droit } from '@models/DroitGroupe';
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { PersonnageService } from '@services/PersonnageService';
import { SnackBarService } from '@services/SnackBarService';

@Component({
  selector: 'app-modal-information',
  imports: [MatDialogModule, MatIconModule, MatTooltipModule, MatTabsModule, MatButtonModule, BoutiquePage],
  templateUrl: './modal-information.html',
  styleUrl: './modal-information.scss',
})
export class ModalInformation implements OnInit
{
    protected droit: Droit;
    protected dialogData: Personnage = inject(MAT_DIALOG_DATA);

    private authServ = inject(AuthentificationService);
    private personnageServ = inject(PersonnageService);
    private dialogConfirmationServ = inject(DialogConfirmationService);
    private snackBarServ = inject(SnackBarService);

    ngOnInit(): void 
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Personnage);
    }

    protected SupprimerMedaille(_medaille: any): void 
    {
        this.dialogConfirmationServ.Ouvrir("Révoquer une médaille", `Confirmez-vous la révoquation de la medaille ${_medaille.nom}`).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.Supprimer(_medaille.id);
            }
        });
    }

    private Supprimer(_idMedaille: number): void
    {
        this.personnageServ.SupprimerMedaille(_idMedaille, this.dialogData.id).subscribe({
            next: () => 
                {
                    this.dialogData.listeMedaille = this.dialogData.listeMedaille.filter(m => m.id !== _idMedaille);
                    this.snackBarServ.Ok("La médaille est révoquée");
                }
        });
    }
}
