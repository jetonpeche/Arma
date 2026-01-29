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