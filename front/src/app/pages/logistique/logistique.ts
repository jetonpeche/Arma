import { Component, inject, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TypeLogistiquePage } from "./type-logistique/type-logistique";
import { TypeStockagePage } from "./type-stockage/type-stockage";
import { LogistiqueInfo } from "./logistique-info/logistique-info";
import { Droit } from '@models/DroitGroupe';
import { AuthentificationService } from '@services/AuthentificationService';
import { EUrl } from '@enums/EUrl';

@Component({
  selector: 'app-logistique',
  imports: [MatTabsModule, TypeLogistiquePage, TypeStockagePage, LogistiqueInfo],
  templateUrl: './logistique.html',
})
export class LogistiquePage implements OnInit
{
    protected droitLogistique: Droit;
    protected droitTypeLogistique: Droit;
    protected droitTypeStockage: Droit;

    private authServ = inject(AuthentificationService);

    ngOnInit(): void 
    {
        this.droitLogistique = this.authServ.RecupererDroit(EUrl.Logistique);
        this.droitTypeLogistique = this.authServ.RecupererDroit(EUrl.TypeLogistique);
        this.droitTypeStockage = this.authServ.RecupererDroit(EUrl.TypeStockageLogistique);
    }
}
