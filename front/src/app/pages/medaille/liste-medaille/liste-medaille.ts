import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { GridContainer, GridElement } from "@jetonpeche/angular-responsive";
import { Medaille } from '@models/Medaille';

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

    protected OnClick(_medaille: Medaille): void
    {
        this.onClickMedaille.emit(_medaille);
    }
}
