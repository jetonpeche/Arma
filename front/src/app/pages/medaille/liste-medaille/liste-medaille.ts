import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { Medaille } from '@models/Medaille';
import { ModalAttribuerMedaille } from '../modal-attribuer-medaille/modal-attribuer-medaille';

@Component({
  selector: 'app-liste-medaille',
  imports: [GridContainer, GridElement, MatCardModule, MatButtonModule],
  templateUrl: './liste-medaille.html',
  styleUrl: './liste-medaille.scss',
})
export class ListeMedaille
{
    listeMedaille = input.required<Medaille[]>();
    peutEcrire = input.required<boolean>();

    onClickMedaille = output<Medaille>();

    private dialog = inject(MatDialog);

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
}
