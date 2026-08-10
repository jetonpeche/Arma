import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DroitGroupe } from '@models/DroitGroupe';
import { ButtonLoader, InputText } from "@jetonpeche/angular-mat-input";
import { FormArray, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EUrl } from '@enums/EUrl';
import { DroitGroupeService } from '@services/DroitGroupeService';
import { SnackBarService } from '@services/SnackBarService';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-ajouter-modifier-droit-groupe',
  imports: [MatCheckboxModule, MatDialogModule, ButtonLoader, InputText, ReactiveFormsModule, MatDividerModule],
  templateUrl: './ajouter-modifier-droit-groupe.html',
  styleUrl: './ajouter-modifier-droit-groupe.scss',
})
export class AjouterModifierDroitGroupe implements OnInit
{
    protected labelBtn = signal("Ajouter");
    protected btnClick = signal<boolean>(false);
    protected form: FormGroup;

    private matDialogData: DroitGroupe | null = inject(MAT_DIALOG_DATA);
    private droitGroupeServ = inject(DroitGroupeService);
    private snackBarServ = inject(SnackBarService);
    private dialogRef = inject(MatDialogRef<AjouterModifierDroitGroupe>);

    private readonly TOUTES_LES_ROUTES = [
        EUrl.Boutique, EUrl.DroitGroupe, EUrl.Formation, EUrl.Grade, EUrl.Logistique, 
        EUrl.Materiel, EUrl.Personnage, EUrl.Preset, EUrl.Medaille, EUrl.HistoriqueCampagne, 
        EUrl.PlaneteOrigine, EUrl.PropositionAchat, EUrl.Specialite, EUrl.TypeLogistique, EUrl.Aeronef,
        EUrl.TypeMateriel, EUrl.TypeStockageLogistique, EUrl.UploadFichier, EUrl.Vaisseau, EUrl.Orbat
    ].map(url => url.replace("/", ""));

    private readonly ROUTES_LECTURE_OBLIGATOIRE = [
        EUrl.Orbat, EUrl.UploadFichier, EUrl.Aeronef, EUrl.Formation, 
        EUrl.Vaisseau, EUrl.Medaille, EUrl.HistoriqueCampagne, 
        EUrl.Personnage, EUrl.PlaneteOrigine, EUrl.Preset
    ].map(url => url.replace("/", ""));

    private readonly ROUTES_SANS_SUPPRESSION = [
        EUrl.UploadFichier
    ].map(url => url.replace("/", ""));

    private readonly DICTIONNAIRE_LABELS: Record<string, string> = {
        [EUrl.Boutique.replace("/", "")]: "Gestion boutique",
        [EUrl.Specialite.replace("/", "")]: "Gestion spécialité",
        [EUrl.Personnage.replace("/", "")]: "Gestion personnage",
        [EUrl.Medaille.replace("/", "")]: "Gestion médaille",
        [EUrl.Grade.replace("/", "")]: "Gestion grade",
        [EUrl.PlaneteOrigine.replace("/", "")]: "Gestion planète",
        [EUrl.Preset.replace("/", "")]: "Gestion preset",
        [EUrl.Vaisseau.replace("/", "")]: "Gestion vaisseaux",
        [EUrl.Formation.replace("/", "")]: "Gestion centre de formation",
        [EUrl.Aeronef.replace("/", "")]: "Gestion aéronefs",
        [EUrl.Orbat.replace("/", "")]: "Gestion de l'orbat",
        [EUrl.UploadFichier.replace("/", "")]: "Upload Fichiers",
        [EUrl.HistoriqueCampagne.replace("/", "")]: "Historique Campagne"
    };

    get listeDroit(): FormArray 
    {
        return this.form.get("listeDroit") as FormArray;
    }

    ngOnInit(): void 
    {
        this.form = new FormGroup({
            nom: new FormControl(this.matDialogData?.nom ?? "", [Validators.required, Validators.maxLength(50)]),
            estDefaut: new FormControl(this.matDialogData?.estDefaut ?? false),
            peutModifierBanque: new FormControl(this.matDialogData?.peutModifierBanque ?? false),
            peutProposerLogistiqueMateriel: new FormControl(this.matDialogData?.peutProposerLogistiqueMateriel ?? false),
            peutAcheterLogistiqueMateriel: new FormControl(this.matDialogData?.peutAcheterLogistiqueMateriel ?? false),
            peutAcheterVaisseau: new FormControl(this.matDialogData?.peutAcheterVaisseau ?? false),
            listeDroit: new FormArray([])
        });

        if (this.matDialogData)
            this.labelBtn.set("Modifier");

        for (const route of this.TOUTES_LES_ROUTES) 
        {
            // Valeur par défaut
            let lecture = this.EstLectureObligatoire(route);
            let ecriture = false;                            
            let suppression = false;

            if (this.matDialogData) 
            {
                const droitExistant = this.matDialogData.listeDroit.find(d => d.routeGroupe === route);
                
                if (droitExistant) 
                {
                    lecture = this.EstLectureObligatoire(route) ? true : droitExistant.peutLire;
                    ecriture = droitExistant.peutEcrire;
                    suppression = droitExistant.peutSupprimer;
                }
            }

            this.listeDroit.push(this.CreerLigneDroit(route, lecture, ecriture, suppression));
        }
    }

    protected Valider(): void 
    {
        // Contrôle d'intégrité avant envoi
        if(this.form.invalid) 
        {
            this.form.markAllAsTouched();
            return;
        }

        this.btnClick.set(true);

        if(this.matDialogData)
        {
            this.droitGroupeServ.Modifier(this.matDialogData.id, this.form.value).subscribe({
                next: () =>
                {
                    this.snackBarServ.Ok("Le groupe de droit a été modifié");
                    this.btnClick.set(false);

                    this.form.addControl("id", new FormControl(this.matDialogData!.id));
                    this.dialogRef.close(this.form.value);
                },
                error: () => this.btnClick.set(false)
            });
        }
        else
        {
            this.droitGroupeServ.Ajouter(this.form.value).subscribe({
                next: (idDroitGroupe) =>
                {
                    this.snackBarServ.Ok("Le groupe de droit a été ajouté");
                    this.btnClick.set(false);

                    this.form.addControl("id", new FormControl(idDroitGroupe));
                    this.dialogRef.close(this.form.value);
                },
                error: () => this.btnClick.set(false)
            });
        }
    }

    private CreerLigneDroit(route: string, peutLire: boolean, peutEcrire: boolean, peutSupprimer: boolean): FormGroup 
    {
        return new FormGroup({
            routeGroupe: new FormControl(route),
            peutLire: new FormControl(peutLire),
            peutEcrire: new FormControl(peutEcrire),
            peutSupprimer: new FormControl(peutSupprimer)
        });
    }

    protected ObtenirLabelRoute(route: string): string 
    {
        return this.DICTIONNAIRE_LABELS[route] || route;
    }

    protected EstLectureObligatoire(route: string): boolean 
    {
        return this.ROUTES_LECTURE_OBLIGATOIRE.includes(route);
    }

    protected PeutAfficherLecture(route: string): boolean 
    {
        return !this.EstLectureObligatoire(route);
    }

    protected PeutAfficherSuppression(route: string): boolean 
    {
        return !this.ROUTES_SANS_SUPPRESSION.includes(route);
    }
}