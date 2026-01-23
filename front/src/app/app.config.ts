import { ApplicationConfig, importProvidersFrom, Injectable, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideJpMatInput } from '@jetonpeche/angular-mat-input';
import { PersonnageService } from '@services/PersonnageService';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions } from '@angular/material/form-field';
import { GradeService } from '@services/GradeService';
import { PlaneteService } from '@services/PlaneteService';
import { SpecialiteService } from '@services/SpecialiteService';
import { FichierService } from '@services/FichierService';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EVENT_MANAGER_PLUGINS } from '@angular/platform-browser';
import { DebounceEventPlugin } from '../Events/DebounceEventPlugin';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SnackBarService } from '@services/SnackBarService';
import { DialogConfirmationService } from '@services/DialogConfirmationService';
import { BoutiqueService } from '@services/BoutiqueService';
import { LogistiqueService } from '@services/LogistiqueService';
import { TypeLogistiqueService } from '@services/TypeLogistiqueService';
import { TypeStockageLogistiqueService } from '@services/TypeStockageLogistiqueService';
import { TypeMaterielService } from '@services/TypeMaterielService';
import { MaterielService } from '@services/MaterielService';
import { VaisseauService } from '@services/VaisseauService';
import { PanierService } from '@services/PanierService';
import { PropositionAchatService } from '@services/PropositionAchatService';
import { AuthentificationService } from '@services/AuthentificationService';
import { jwtInterceptor } from './interceptors/jwt-interceptor';

const matInput: MatFormFieldDefaultOptions = {
  appearance: 'outline',
  subscriptSizing: 'dynamic'
};

const snackBar: MatSnackBarConfig = {
  verticalPosition: "top",
  horizontalPosition: "right",
  duration: 2_500
};

@Injectable()
class FrancaisDateAdapter extends NativeDateAdapter 
{
  override parse(value: any): Date | null 
  {
    if (typeof value == 'string' && value.indexOf('/') > -1) 
    {
      const str = value.split('/');
      const ANNEE = Number(str[2]);
      const MOIS = Number(str[1]) - 1;
      const JOUR = Number(str[0]);
      
      return new Date(ANNEE, MOIS, JOUR);
    }

    return super.parse(value);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideJpMatInput(),
    importProvidersFrom(MatNativeDateModule),

    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: PersonnageService, useClass: PersonnageService },
    { provide: GradeService, useClass: GradeService },
    { provide: PlaneteService, useClass: PlaneteService },
    { provide: SpecialiteService, useClass: SpecialiteService },
    { provide: FichierService, useClass: FichierService },
    { provide: SnackBarService, useClass: SnackBarService },
    { provide: BoutiqueService, useClass: BoutiqueService },
    { provide: LogistiqueService, useClass: LogistiqueService },
    { provide: MaterielService, useClass: MaterielService },
    { provide: VaisseauService, useClass: VaisseauService },
    { provide: TypeLogistiqueService, useClass: TypeLogistiqueService },
    { provide: TypeStockageLogistiqueService, useClass: TypeStockageLogistiqueService },
    { provide: TypeMaterielService, useClass: TypeMaterielService },
    { provide: DialogConfirmationService, useClass: DialogConfirmationService },
    { provide: PanierService, useClass: PanierService },
    { provide: PropositionAchatService, useClass: PropositionAchatService },
    { provide: AuthentificationService, useClass: AuthentificationService },

    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: matInput },
    { provide: MAT_DATE_LOCALE, useValue: navigator.language },
    { provide: DateAdapter, useClass: FrancaisDateAdapter },
    { provide: EVENT_MANAGER_PLUGINS, multi: true, useClass: DebounceEventPlugin },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: snackBar }
  ]
};
