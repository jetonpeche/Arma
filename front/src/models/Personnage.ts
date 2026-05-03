import { GradeLeger } from "./Grade"
import { PlaneteOrigine } from "./PlaneteOrigine"
import { SpecialiteLeger } from "./Specialite"

export type Personnage =
{
    id: number,
    nom: string,
    nomDiscord: string,
    matricule: string,
    dateNaissance: string,
    etatService: string | null,
    groupeSanguin: string,
    urlPhotoIdentite: string,
    nbOperation: number,
    nbBootcamp: number,
    estFormateur: boolean,
    estFormateurSpecialite: boolean,
    formationFaite: boolean,
    grade: GradeLeger,
    nbPointBoutique: number,
    specialite: SpecialiteLeger | null,
    planeteOrigine: PlaneteOrigine | null,
    dateDerniereParticipation: Date | null,
    dateCreation: Date,
    estValider: boolean
}

export type PersonnageLeger =
{
    id: number,
    nom: string
}

export type PersonnageRequete =
{
    nom: string,
    login: string | null,
    mdp: string | null,
    nomDiscord: string,
    matricule: string,
    groupeSanguin: string,
    etatService: string | null,
    formationFaite: boolean,
    idGrade: number,
    idPlaneteOrigine: number,
    idSpecialite: number | null
}

export type PersonnageModifierRequete =
{
    nom: string,
    nomDiscord: string,
    matricule: string,
    groupeSanguin: string,
    etatService: string | null,
    nbOperation: number,
    nbBootcamp: number,
    estFormateur: boolean,
    estFormateurSpecialite: boolean,
    formationFaite: boolean,
    idGrade: number,
    idPlaneteOrigine: number,
    idSpecialite: number | null
}