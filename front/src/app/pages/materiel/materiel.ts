import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TypeMaterielPage } from "./type-materiel/type-materiel";
import { MaterielInfoPage } from "./materiel-info/materiel-info";

@Component({
  selector: 'app-materiel',
  imports: [MatTabsModule, TypeMaterielPage, MaterielInfoPage],
  templateUrl: './materiel.html',
  styleUrl: './materiel.scss',
})
export class MaterielPage {

}
