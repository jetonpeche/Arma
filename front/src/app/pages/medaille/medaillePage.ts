import { Component, inject, OnInit, signal } from '@angular/core';
import { Medaille } from '@models/Medaille';
import { MedailleService } from '@services/MedailleService';
import {MatTabsModule} from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { AjouterModifierMedaille } from '@modals/ajouter-modifier-medaille/ajouter-modifier-medaille';
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';
import { Droit } from '@models/DroitGroupe';
import { ListeMedaille } from "./liste-medaille/liste-medaille";

@Component({
  selector: 'app-medaille',
  imports: [MatTabsModule, MatCardModule, MatButtonModule, MatIconModule, ListeMedaille],
  templateUrl: './medaillePage.html',
  styleUrl: './medaillePage.scss',
})
export class MedaillePage implements OnInit
{
    protected listeMedaille = signal<Medaille[]>([]);
    protected droit: Droit;

    private medailleServ = inject(MedailleService);
    private authServ = inject(AuthentificationService);
    private dialog = inject(MatDialog);

    ngOnInit(): void
    {
        this.droit = this.authServ.RecupererDroit(EUrl.Medaille);
        this.Lister();
    }

    protected OuvriModalAjouterModifierMedaille(_medaille?: Medaille): void
    {
        const DIALOG_REF = this.dialog.open(AjouterModifierMedaille, {
            data: _medaille
        });

        DIALOG_REF.afterClosed().subscribe({
            next: (retour) => 
            {
                if(retour === true)
                    this.Lister();
            }
        });
    }

    protected ListerMedaille(_groupe: number): Medaille[]
    {
        return this.listeMedaille().filter(x => x.groupe == _groupe);
    }

    private Lister(): void
    {
        this.medailleServ.Lister().subscribe({
            next: (retour) =>
            {
                this.listeMedaille.set(retour);
            }
        });
    }
}
