import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { Medaille } from '@models/Medaille';
import { ModalAttribuerMedaille } from '../modal-attribuer-medaille/modal-attribuer-medaille';
import { Droit } from '@models/DroitGroupe';
import { DialogConfirmationService } from '@services/DialogConfirmationService';

@Component({
  selector: 'app-liste-medaille',
  imports: [GridContainer, GridElement, MatCardModule, MatButtonModule],
  templateUrl: './liste-medaille.html',
  styleUrl: './liste-medaille.scss',
})
export class ListeMedaille
{
    listeMedaille = input.required<Medaille[]>();
    droit = input.required<Droit>();

    onClickMedaille = output<Medaille>();
    onClickSuppMedaille = output<Medaille>();

    private dialog = inject(MatDialog);
    private dialogConfirmationServ = inject(DialogConfirmationService);

    protected OnClick(_medaille: Medaille): void
    {
        this.onClickMedaille.emit(_medaille);
    }

    protected OuvrirModalAttribuerMedaille(_medaille: Medaille): void
    {
        this.dialog.open(ModalAttribuerMedaille, {
            data: _medaille
        });
    }

    protected OuvrirSupprimerMedaille(_medaille: Medaille): void
    {
        const TITRE = "Suppression médaille";
        const MESSAGE = `Confirmez vous la suppression de la médaille: ${_medaille.nom}`;
        this.dialogConfirmationServ.Ouvrir(TITRE, MESSAGE).subscribe({
            next: (retour) =>
            {
                if(retour)
                    this.onClickSuppMedaille.emit(_medaille);
            }
        });
    }
}
