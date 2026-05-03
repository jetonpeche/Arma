import { DroitGroupe } from "./DroitGroupe"

export type Authentification = 
{
    login: string,
    mdp: string
}

export type Authentifier =
{
    jwt: string,
    nom: string,
    nbPointBoutique: number,
    nbPointBanque: number,
    droit: DroitGroupe | null
}

export type Inscription =
{
    login: string,
    mdp: string,
    nom: string,
    nomDiscord: string,
    dateNaissance: string,
    matricule: string,
    groupeSanguin: string,
    etatService: string | null,
    idPlaneteOrigine: number,
    idSpecialite: number | null
}