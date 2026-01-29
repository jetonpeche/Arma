import { Component, inject, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TypeMaterielPage } from "./type-materiel/type-materiel";
import { MaterielInfoPage } from "./materiel-info/materiel-info";
import { Droit } from '@models/DroitGroupe';
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';

@Component({
  selector: 'app-materiel',
  imports: [MatTabsModule, TypeMaterielPage, MaterielInfoPage],
  templateUrl: './materiel.html'
})
export class MaterielPage implements OnInit
{
    protected droitMateriel: Droit;
    protected droitTypeMateriel: Droit;

    private authServ = inject(AuthentificationService);

    ngOnInit(): void 
    {
        this.droitMateriel = this.authServ.RecupererDroit(EUrl.Materiel);
        this.droitTypeMateriel = this.authServ.RecupererDroit(EUrl.TypeMateriel);
    }
}
