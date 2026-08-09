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

    get listeDroit(): FormArray {
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
        {
            this.labelBtn.set("Modifier");
            for (const element of this.matDialogData.listeDroit) {
                this.listeDroit.push(this.CreerLigneDroit(element.routeGroupe, element.peutLire, element.peutEcrire, element.peutSupprimer));
            }
        } 
        else 
        {
            const LISTE_URLS = [
                EUrl.Boutique, EUrl.DroitGroupe, EUrl.Formation, EUrl.Grade, EUrl.Logistique, 
                EUrl.Materiel, EUrl.Personnage, EUrl.Preset, EUrl.Medaille, EUrl.HistoriqueCampagne, 
                EUrl.PlaneteOrigine, EUrl.PropositionAchat, EUrl.Specialite, EUrl.TypeLogistique, 
                EUrl.TypeMateriel, EUrl.TypeStockageLogistique, EUrl.UploadFichier, EUrl.Vaisseau, EUrl.Orbat
            ];

            for (const url of LISTE_URLS) {
                const route = url.replace("/", "");
                const lectureDefaut = !this.EstRouteSansLecture(route);
                this.listeDroit.push(this.CreerLigneDroit(route, lectureDefaut, false, false));
            }
        }
    }

    protected Valider(): void
    {
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
        const dictionnaire: Record<string, string> = {
            "boutique": "Gestion boutique", "specialite": "Gestion spécialité",
            "personnage": "Gestion personnage", "medaille": "Gestion médaille",
            "grade": "Gestion grade", "planete-origine": "Gestion planète",
            "preset": "Gestion preset", "vaisseau": "Gestion vaisseaux",
            "formation": "Gestion centre de formation", "aeronef": "Gestion aéronefs",
            "orbat": "Gestion de l'orbat", "upload-fichier": "Upload Fichiers",
            "historique-campagne": "Historique Campagne"
        };
        return dictionnaire[route] || route;
    }

    protected EstRouteSansLecture(route: string): boolean 
    {
        const routesSpecifiques = ["orbat", "upload-fichier", "aeronef", "formation", "vaisseau", "medaille", "historique-campagne", "personnage", "planete-origine", "preset"];
        return routesSpecifiques.includes(route);
    }

    protected PeutAfficherLecture(route: string): boolean 
    {
        return !this.EstRouteSansLecture(route);
    }

    protected PeutAfficherSuppression(route: string): boolean 
    {
        return route !== "upload-fichier";
    }
}