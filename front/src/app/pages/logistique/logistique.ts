import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TypeLogistiquePage } from "./type-logistique/type-logistique";
import { TypeStockagePage } from "./type-stockage/type-stockage";
import { LogistiqueInfo } from "./logistique-info/logistique-info";

@Component({
  selector: 'app-logistique',
  imports: [MatTabsModule, TypeLogistiquePage, TypeStockagePage, LogistiqueInfo],
  templateUrl: './logistique.html',
})
export class LogistiquePage { }
